import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const source = new Hono();

source.get(
  "/src/*",
  serveStatic({
    root: "core",
    rewriteRequestPath: (path) => path.replace("core/", ""),
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`);
    },
  }),
);

export default source;
