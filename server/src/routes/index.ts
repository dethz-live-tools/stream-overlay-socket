import { Hono } from "hono";

import * as config from "../modules/config";

import ws from "./ws";
import api from "./api";
import staticPath from "./static";

const routes = new Hono();

routes.get("/", (c) => {
  console.log(config.TEST_VALUE);
  return c.text("server loaded");
});

routes.route("/", staticPath);
routes.route("/api", api);
routes.route("/ws", ws);

export default routes;
