import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const controller = new Hono();

controller.get(
  "/",
  serveStatic({
    root: "core",
    rewriteRequestPath: (path) => path.replace("core/", ""),
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`);
    },
  }),
);

export default controller;
