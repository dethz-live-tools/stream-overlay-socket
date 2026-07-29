import { ServerWebSocket } from "bun";

import { systemTopic } from "../../..";
import { spotifyController } from "../../../../../modules/spotify/players/controller";

export const playerHandler = async (
  state: string,
  token: string,
  ws: ServerWebSocket,
) => {
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
    ws.send("spt: error -- error occurred");
    ws.publish(systemTopic, "spt: error -- error occurred");
  } else {
    if (controllerResp !== "") {
      if (sendState === "player") {
        ws.send("spt: PLAYER DATA -- " + JSON.stringify(controllerResp));
      } else {
        console.log(controllerResp);
      }
    }
  }
};
