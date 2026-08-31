import { Hono } from "hono";

import { serveStatic } from "hono/bun";

const spotify = new Hono();

spotify.get(
  "/*",
  serveStatic({
    root: "core",
    rewriteRequestPath: (path) => path.replace("", ""),
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`);
    },
  }),
);

export default spotify;
