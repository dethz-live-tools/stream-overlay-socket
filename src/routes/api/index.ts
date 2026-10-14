import { Hono } from "hono";

import spotify from "./spotify";
import update from "./update";
import extension from "./extension";
import configApi from "./config";

const api = new Hono();

api.route("/spotify", spotify);
api.route("/update", update);
api.route("/extension", extension);
api.route("/config", configApi);

// Backward-compatibility alias: /api/modules -> /api/extension
api.route("/modules", extension);

export default api;

