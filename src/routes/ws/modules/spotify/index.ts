import { ServerWebSocket } from "bun";
import { systemTopic } from "../../index";
import { queueFetcher } from "./functions/queue";
import { ISpotifyToken } from "../../../../modules/interfaces/spotify/token.interface";
import { refreshAccessToken } from "../../../../modules/spotify/refresh";
import { ISpotifyQueue } from "../../../../modules/interfaces/spotify/queue.interface";
import { spotifySearchHandler } from "./functions/search";
import { playerHandler } from "./functions/player";
import { server } from "../../../..";

interface SpotifyConnectionState {
  token: ISpotifyToken;
  polling?: NodeJS.Timeout;
}

var stockData: ISpotifyQueue | null = null;

const activeConnections = new WeakMap<
  ServerWebSocket,
  SpotifyConnectionState
>();

// ponytail: refresh if missing timestamp, expired, or near expiry (< 10 min)
export const refresh_token = async (
  inp_token: ISpotifyToken,
  time: number,
): Promise<ISpotifyToken | null> => {
  const needsRefresh =
    !inp_token.timestamp?.end ||
    inp_token.timestamp.end - 600 * 1000 < time;

  if (!needsRefresh) {
    return inp_token;
  }

  if (!inp_token.refresh_token) {
    return inp_token.timestamp?.end && inp_token.timestamp.end > time
      ? inp_token
      : null;
  }

  const refreshed = await refreshAccessToken(inp_token.refresh_token);

  if (refreshed === null || refreshed.error) {
    return inp_token.timestamp?.end && inp_token.timestamp.end > time
      ? inp_token
      : null;
  }

  if (!refreshed.refresh_token) {
    refreshed.refresh_token = inp_token.refresh_token;
  }

  return refreshed;
};

const init = async (ws: ServerWebSocket) => {
  const polling = setInterval(async () => {
    try {
      const conn = activeConnections.get(ws);
      if (!conn || !conn.token) {
        clearInterval(polling);
        return;
      }

      const newDate = new Date().getTime();
      const refreshedToken = await refresh_token(conn.token, newDate);

      if (refreshedToken === null) {
        ws.publish(systemTopic, "error: token refresh failed");
        clearInterval(polling);
        activeConnections.delete(ws);
        console.log("token is null in polling after refresh failure");
        return;
      }

      if (refreshedToken.access_token !== conn.token.access_token) {
        conn.token = refreshedToken;
        ws.publish(systemTopic, "spt: token refreshed");
        ws.send(`spt: NEW TOKEN ${JSON.stringify(refreshedToken)}`);
      }

      const data = await queueFetcher(conn.token);

      if (data === null) {
        ws.publish(systemTopic, "spt: fetch error (queue)");
      } else {
        // ponytail: safe comparison handling null playback or empty queue without throwing
        if (stockData !== null) {
          const prevPlayingId = stockData.currently_playing?.id ?? null;
          const currPlayingId = data.currently_playing?.id ?? null;
          const prevFirstId = stockData.queue?.[0]?.id ?? null;
          const currFirstId = data.queue?.[0]?.id ?? null;
          const prevLen = stockData.queue?.length ?? 0;
          const currLen = data.queue?.length ?? 0;

          const hasChanged =
            prevPlayingId !== currPlayingId ||
            prevFirstId !== currFirstId ||
            prevLen !== currLen;

          if (hasChanged) {
            stockData = data;
            server?.publish(systemTopic, `spt: QUEUE ${JSON.stringify(data)}`) ??
              ws.publish(systemTopic, `spt: QUEUE ${JSON.stringify(data)}`);
          }
        } else {
          stockData = data;
          server?.publish(systemTopic, `spt: QUEUE ${JSON.stringify(data)}`) ??
            ws.publish(systemTopic, `spt: QUEUE ${JSON.stringify(data)}`);
        }
      }

      ws.publish(systemTopic, `spt: heartbeat`);
    } catch (err) {
      console.error("[Spotify] Polling error:", err);
    }
  }, 2500);

  const conn = activeConnections.get(ws);
  if (conn) {
    conn.polling = polling;
  }
};

export const spotifyHandler = async (msg: string, ws: ServerWebSocket) => {
  const now = new Date().getTime();

  if (msg.startsWith("spt: SET TOKEN ")) {
    let parsed_token: ISpotifyToken | null = null;
    try {
      parsed_token = JSON.parse(msg.replace("spt: SET TOKEN ", ""));
    } catch {
      ws.publish(systemTopic, "error: invalid token format");
      return;
    }

    if (!parsed_token || (!parsed_token.access_token && !parsed_token.refresh_token)) {
      ws.publish(systemTopic, "error: no token");
      return;
    }

    // Refresh if needed or expired (ponytail: restore session seamlessly)
    const refreshedToken = await refresh_token(parsed_token, now);
    if (refreshedToken === null) {
      ws.publish(systemTopic, "error: token refresh failed");
      return;
    } else if (refreshedToken.access_token !== parsed_token.access_token) {
      ws.publish(systemTopic, "spt: token refreshed");
      const tokenContext = `spt: NEW TOKEN ${JSON.stringify(refreshedToken)}`;

      ws.send(tokenContext);
    }

    // Clear any existing poll for this socket to prevent duplicates
    const existing = activeConnections.get(ws);
    if (existing?.polling) {
      clearInterval(existing.polling);
    }

    // Setup state
    activeConnections.set(ws, {
      token: refreshedToken,
    });

    // Initialize polling
    await init(ws);
  } else if (msg === "spt: logout") {
    // ponytail: handle explicit logout command
    spotifyCleanup(ws);
    ws.publish(systemTopic, "spt: logged out");
    ws.send("spt: logged out");
  } else if (msg.startsWith("spt: ")) {
    const conn = activeConnections.get(ws);

    if (!conn || !conn.token) {
      ws.publish(systemTopic, "error: no token");
    } else {
      if (msg === "spt: pulling") {
        if (stockData !== null) {
          (server?.publish(
            systemTopic,
            `spt: QUEUE ${JSON.stringify(stockData)}`,
          ) ??
            ws.publish(
              systemTopic,
              `spt: QUEUE ${JSON.stringify(stockData)}`,
            ));
        } else {
          const data = await queueFetcher(conn.token);
          if (data !== null) {
            stockData = data;
            ws.publish(systemTopic, `spt: QUEUE ${JSON.stringify(data)}`);
          }
        }
      } else if (msg === "spt: pull token") {
        ws.publish(
          systemTopic,
          `spt: CURRENT TOKEN ${JSON.stringify(conn.token)}`,
        );
      } else if (msg.startsWith("spt: search -- ")) {
        const searchData = await spotifySearchHandler(
          conn.token.access_token,
          msg.replace("spt: search -- ", ""),
        );

        ws.send(`spt: FOUND ${JSON.stringify(searchData)}`);
        ws.publish(systemTopic, `spt: FOUND ${JSON.stringify(searchData)}`);
      } else if (msg.startsWith("spt: player -- ")) {
        await playerHandler(msg, conn.token.access_token, ws);
      } else {
        ws.send(`spt: unknown command -- ${msg}`);
      }
    }
  }
};

export const spotifyCleanup = (ws: ServerWebSocket) => {
  const conn = activeConnections.get(ws);
  if (conn) {
    if (conn.polling) {
      clearInterval(conn.polling);
    }
    activeConnections.delete(ws);
    console.log("Spotify polling cleared for disconnected client.");
  }
};
