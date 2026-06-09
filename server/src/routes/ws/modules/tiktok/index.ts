import { ServerWebSocket } from "bun";
import { WebcastEvent } from "tiktok-live-connector";

import { tiktokClient } from "../../../../modules/tiktok";

const handler = (data: any) => {};

const tiktok = new tiktokClient("solomonz_star");
var isConnected = false;

export const tiktokHandler = async (msg: string, ws: ServerWebSocket) => {
  const cmd = msg.replace("tt: ", "");

  if (cmd === "connect") {
    if (!isConnected) {
      tiktok.client
        .connect()
        .then((state) => {
          console.log(`Connected to tiktok-live on room ID ${state.roomId}`);
          ws.send(
            `log: success -- Connected to tiktok-live on room ID ${state.roomId}`,
          );
          isConnected = true;
        })
        .catch((err) => {
          console.error("Failed to connect", err.message);
          ws.send("log: error -- Failed to connect");
        });
    } else {
    }

    tiktok.client.on(WebcastEvent.CHAT, (data) => {
      ws.send(JSON.stringify(data));
    });

    tiktok.client.on(WebcastEvent.GIFT, (data) => {
      ws.send(JSON.stringify(data));
    });
  }
};
