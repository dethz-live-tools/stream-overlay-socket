import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const config = new Hono();

// ponytail: static config dashboard served straight from core/config
config.get(
  "/*",
  serveStatic({
    root: "core",
    rewriteRequestPath: (path) => path.replace("core/", ""),
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`);
    },
  }),
);

export default config;
