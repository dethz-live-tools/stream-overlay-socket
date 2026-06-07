import { Hono } from "hono";

import spotify from "./spotify";

const api = new Hono();

api.route("/spotify", spotify);

export default api;
