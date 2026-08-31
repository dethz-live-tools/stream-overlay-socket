import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { websocket } from "hono/bun";

import fs from "node:fs";

import routes from "./routes";

// Check that is `static` directory exist
if (!fs.existsSync("static")) {
  fs.mkdirSync("static");
}

const app = new Hono();
app.use("*", cors());

app.route("/", routes);

export const server = Bun.serve({
  port: Number(Bun.env.PORT) || 3000,
  websocket,
  routes: {
    "/": app.fetch,
    "/ws": app.fetch,
    "/api/*": app.fetch,
    "/spotify/*": app.fetch,
    "/controller": app.fetch,
    "/core/*": app.fetch,
    "/static": app.fetch,
    "/static/*": app.fetch,

    "/*": () => new Response("not found", { status: 404 }),
  },
});

console.log(`Server running at: http://${server.hostname}:${server.port}`);
