import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const staticPath = new Hono();

staticPath.get(
  "/controller/*",
  serveStatic({
    root: "public",
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`);
    },
  }),
);
staticPath.get(
  "/spotify/*",
  serveStatic({
    root: "public",
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`);
    },
  }),
);
staticPath.get(
  "/src/*",
  serveStatic({
    root: "public",
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`);
    },
  }),
);

export default staticPath;
