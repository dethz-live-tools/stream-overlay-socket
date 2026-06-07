import { Hono } from "hono";

import { spotifyOAuth } from "../../../modules/spotify/OAuth";
import { exchangeCodeForToken } from "../../../modules/spotify/callback";

const spotify = new Hono();

spotify.get("/", (c) => {
  return c.text("Hello from spotify routes!");
});

spotify.get("/auth", async (c) => {
  const state = c.req.query("state");

  if (state === undefined) {
    return c.json({
      status: 0,
      message: "state is undefined",
    });
  }

  const authUri = spotifyOAuth(state as string);
  return c.redirect(authUri);
});

spotify.post("/callback", async (c) => {
  const body = await c.req.json();
  const code = body.code;
  const state = body.state;

  if (code === undefined || state === undefined) {
    return c.json({
      status: 0,
      message: "code or state is undefined",
    });
  }

  const resp = await exchangeCodeForToken(code as string, state as string);
  return c.json({
    status: 1,
    message: "success",
    payload: resp,
  });
});

export default spotify;
