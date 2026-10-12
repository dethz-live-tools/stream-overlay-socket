import { Hono } from "hono";

import spotify from "./spotify";
import update from "./update";
import extension from "./extension";

const api = new Hono();

api.route("/spotify", spotify);
api.route("/update", update);
api.route("/extension", extension);

// Backward-compatibility alias: /api/modules -> /api/extension
api.route("/modules", extension);

export default api;

