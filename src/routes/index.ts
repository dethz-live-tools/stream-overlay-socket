import { Hono } from "hono";

import fs from "node:fs";

import ws from "./ws";
import api from "./api";

import { staticListingPage } from "./staticPage";

import { mainHandler } from "./static";

const routes = new Hono();

routes.get("/", (c) => {
  return c.text("server loaded");
});

routes.get("/static", (c) => {
  // Directory Listing
  const dirList = fs.readdirSync("static");

  return c.html(staticListingPage(dirList));
});

mainHandler(routes);

routes.route("/api", api);
routes.route("/ws", ws);

export default routes;
