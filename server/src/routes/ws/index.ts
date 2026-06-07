import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { ServerWebSocket } from "bun";

import { Greeting } from "./modules/greet";
import { spotifyHandler, spotifyCleanup } from "./modules/spotify";

import { server } from "../../index";

const ws = new Hono();

export const systemTopic = "dethzon:system";

ws.get(
  "/",
  upgradeWebSocket((c) => {
    return {
      onOpen: (_e, ws) => {
        const rawWS = ws.raw as ServerWebSocket;
        rawWS.subscribe(systemTopic);

        ws.send(Greeting());

        console.log("user connected");
      },
      onMessage: async (event, ws) => {
        const rawWS = ws.raw as ServerWebSocket;
        const msg: string = String(event.data);

        if (msg.startsWith("spt: ")) {
          await spotifyHandler(msg, rawWS);
        } else {
          rawWS.publish(systemTopic, msg);
        }
      },
      onClose: (_, ws) => {
        const rawWS = ws.raw as ServerWebSocket;
        rawWS.unsubscribe(systemTopic);
        spotifyCleanup(rawWS);
        console.log("Connection closed");
      },
    };
  }),
);

export default ws;
