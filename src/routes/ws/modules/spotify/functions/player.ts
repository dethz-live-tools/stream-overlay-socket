import { ServerWebSocket } from "bun";

import { systemTopic } from "../../..";
import { spotifyController } from "../../../../../modules/spotify/players/controller";

export const playerHandler = async (
  state: string,
  token: string,
  ws: ServerWebSocket,
) => {
  try {
    const sendState = state.replace("spt: player -- ", "");
    var controllerResp = null;

    if (sendState.startsWith("play:")) {
      const device_id = sendState.replace("play: ", "");
      controllerResp = await spotifyController(
        "play",
        token,
        undefined,
        device_id,
      );
    } else {
      controllerResp = await spotifyController(sendState, token);
    }

    if (controllerResp === null) {
      if (sendState === "player") {
        // ponytail: when nothing is playing, send null player data to signify idle playback
        ws.send("spt: PLAYER DATA -- null");
      } else {
        ws.send("spt: error -- error occurred");
        ws.publish(systemTopic, "spt: error -- error occurred");
      }
    } else {
      if (controllerResp !== "") {
        if (sendState === "player") {
          ws.send("spt: PLAYER DATA -- " + JSON.stringify(controllerResp));
        } else {
          console.log(controllerResp);
        }
      }
    }
  } catch (err) {
    console.error("[Spotify] playerHandler error:", err);
  }
};
