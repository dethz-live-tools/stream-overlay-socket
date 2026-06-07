import { Hono } from "hono";

import ws from "./ws";
import api from "./api";
import staticPath from "./static";

const routes = new Hono();

// routes.get("/", (c) => {
//   return c.text("Hello Hono!");
// });

routes.route("/", staticPath);
routes.route("/api", api);
routes.route("/ws", ws);

export default routes;
