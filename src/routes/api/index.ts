import { Hono } from "hono";

import spotify from "./spotify";
import update from "./update";

const api = new Hono();

api.route("/spotify", spotify);
api.route("/update", update);

export default api;

