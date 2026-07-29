import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { websocket } from "hono/bun";

import routes from "./routes";
import { staticRoutes } from "./routes/static";

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
    "/core/src/*": app.fetch,

    ...staticRoutes,

    "/*": () => new Response("not found", { status: 404 }),
  },
});

console.log(`Server running at: http://${server.hostname}:${server.port}`);
