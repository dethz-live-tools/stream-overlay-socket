import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { websocket } from "hono/bun";

import routes from "./routes";

const app = new Hono();
app.use("*", cors());

app.route("/", routes);

export const server = Bun.serve({
  port: Number(Bun.env.PORT) || 3000,
  websocket,
  fetch: app.fetch,
});

console.log(`Server running at: http://${server.hostname}:${server.port}`);
