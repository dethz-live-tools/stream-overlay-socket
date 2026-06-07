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

const refresh_token = async (
  inp_token: ISpotifyToken,
  time: number,
): Promise<ISpotifyToken | null> => {
  if (inp_token.timestamp === undefined) {
    return null;
  }

  if (inp_token.timestamp.end - 600 * 1000 < time) {
    const refreshed = await refreshAccessToken(inp_token.refresh_token);

    if (refreshed === null) {
      return null;
    }

    if (refreshed.error) {
      return null;
    }

    // Spotify omits refresh_token when it hasn't rotated — preserve the old one
    if (!refreshed.refresh_token) {
      refreshed.refresh_token = inp_token.refresh_token;
    }

    return refreshed;
  } else {
    return inp_token;
  }
};

const init = async (ws: ServerWebSocket) => {
  const polling = setInterval(async () => {
    const conn = activeConnections.get(ws);
    if (!conn || !conn.token) {
      console.log("token is null or connection is missing in polling");
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
      if (stockData !== null) {
        if (data.currently_playing === null) {
          console.log("nothing playing rn");
          return;
        }

        if (
          stockData.currently_playing === null ||
          stockData.currently_playing.id !== data.currently_playing.id ||
          stockData.queue[0].id !== data.queue[0].id
        ) {
          stockData = data;
          server.publish(systemTopic, `spt: QUEUE ${JSON.stringify(data)}`);
        }
      } else {
        stockData = data;
        server.publish(systemTopic, `spt: QUEUE ${JSON.stringify(data)}`);
      }
    }

    ws.publish(systemTopic, `spt: heartbeat`);
  }, 2500);

  const conn = activeConnections.get(ws);
  if (conn) {
    conn.polling = polling;
  }
};

export const spotifyHandler = async (msg: string, ws: ServerWebSocket) => {
  const now = new Date().getTime();

  if (msg.startsWith("spt: SET TOKEN ")) {
    let parsed_token = JSON.parse(msg.replace("spt: SET TOKEN ", ""));

    if (parsed_token === null) {
      ws.publish(systemTopic, "error: no token");
      return;
    }

    if (!parsed_token.timestamp?.end || parsed_token.timestamp.end < now) {
      ws.publish(systemTopic, "error: invalid token");
      return;
    }

    // Refresh if needed
    const refreshedToken = await refresh_token(parsed_token, now);
    if (refreshedToken === null) {
      ws.publish(systemTopic, "error: token refresh failed");
      return;
    } else if (refreshedToken !== parsed_token) {
      ws.publish(systemTopic, "spt: token refreshed");
      const tokenContext = `spt: NEW TOKEN ${JSON.stringify(refreshedToken)}`;

      // ws.publish(systemTopic, tokenContext);
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
  } else if (msg.startsWith("spt: ")) {
    const conn = activeConnections.get(ws);

    if (!conn || !conn.token) {
      ws.publish(systemTopic, "error: no token");
    } else {
      if (msg === "spt: pulling") {
        if (stockData !== null) {
          server.publish(
            systemTopic,
            `spt: QUEUE ${JSON.stringify(stockData)}`,
          );
        } else {
          const data = await queueFetcher(conn.token);
          if (data !== null) {
            stockData = data;
            server.publish(systemTopic, `spt: QUEUE ${JSON.stringify(data)}`);
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
