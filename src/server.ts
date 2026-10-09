import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { websocket } from "hono/bun";
import fs from "node:fs";
import routes from "./routes";

export interface ServerOptions {
  port?: number;
  hostname?: string;
  checkUpdates?: boolean;
}

export let server: ReturnType<typeof Bun.serve> | null = null;

export function startServer(options: ServerOptions = {}) {
  if (server) {
    return server;
  }

  if (options.checkUpdates) {
    import("./modules/updater").then(({ runStartupUpdateCheck }) => {
      runStartupUpdateCheck().catch((err) => {
        console.warn("[startServer] Failed startup update check:", err);
      });
    });
  }

  const port = options.port ?? (Number(Bun.env.PORT) || 3000);
  const hostname = options.hostname;

  // Ensure static directory exists
  if (!fs.existsSync("static")) {
    fs.mkdirSync("static", { recursive: true });
  }

  const app = new Hono();
  app.use("*", cors());
  app.route("/", routes);

  server = Bun.serve({
    port,
    ...(hostname ? { hostname } : {}),
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

  return server;
}
