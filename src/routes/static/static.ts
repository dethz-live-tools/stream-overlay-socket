import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const staticPath = new Hono();

staticPath.get(
  "/*",
  serveStatic({
    root: "static",
    rewriteRequestPath: (path) => {
      let outPath = path.replace("/static", "");
      // console.log(path, " -> ", outPath);

      return outPath;
    },
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`);
    },
  }),
);

export default staticPath;
