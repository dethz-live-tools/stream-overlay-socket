import { ServerWebSocket } from "bun";
import { WebcastEvent } from "tiktok-live-connector";

import { tiktokClient } from "../../../../modules/tiktok";

const handler = (data: any) => {};

var tiktok: tiktokClient | null = null;
var isConnected = false;

export const tiktokHandler = async (msg: string, ws: ServerWebSocket) => {
  const cmd = msg.replace("tt: ", "");

  if (cmd.startsWith("connect to ")) {
    const username = cmd.replace("connect to ", "");

    if (isConnected && tiktok !== null) tiktok.client.disconnect();
    tiktok = new tiktokClient(username);

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
        console.error(err);
        ws.send("log: error -- Failed to connect");
      });

    tiktok.client.on(WebcastEvent.CHAT, (data) => {
      ws.send(JSON.stringify(data));
    });

    tiktok.client.on(WebcastEvent.GIFT, (data) => {
      ws.send(JSON.stringify(data));
    });
  } else if (cmd === "disconnect") {
    if (isConnected && tiktok !== null) {
      tiktok.client.disconnect();
      tiktok = null;
      isConnected = false;
      ws.send("log: success -- Disconnected from tiktok-live");
    } else {
      ws.send("log: error -- Not connected to tiktok-live");
    }
  }
};
