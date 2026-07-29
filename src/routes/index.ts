import { Hono } from "hono";
import { serveStatic } from "hono/bun";

import fs from "node:fs";

import ws from "./ws";
import api from "./api";
import { staticListingPage } from "./staticPage";

const routes = new Hono();

routes.get("/", (c) => {
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

routes.get("/static", (c) => {
  // Directory Listing
  const dirList = fs.readdirSync("static");

  return c.html(staticListingPage(dirList));
});

routes.get(
  "/static/*",
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

routes.route("/api", api);
routes.route("/ws", ws);

export default routes;
