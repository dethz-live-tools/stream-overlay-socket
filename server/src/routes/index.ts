import { Hono } from "hono";
import { serveStatic } from "hono/bun";

import * as config from "../modules/config";

import ws from "./ws";
import api from "./api";
// import staticPath from "./static";

const routes = new Hono();

routes.get("/", (c) => {
  console.log(config.TEST_VALUE);
  return c.text("server loaded");
});

routes.get(
  "/core/src/*",
  serveStatic({
    root: "public",
    rewriteRequestPath: (path) => path.replace("/core/src/", "/src/"),
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`);
    },
  }),
);

routes.get(
  "/static/*",
  serveStatic({
    root: "static",
    // rewriteRequestPath: (path) => path.replace("/static", "/static"),
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`);
    },
  }),
);

routes.route("/api", api);
routes.route("/ws", ws);

export default routes;
