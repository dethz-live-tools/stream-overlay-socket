import { ISpotifyToken } from "../interfaces/spotify/token.interface";

import * as config from "../../modules/config";

export const exchangeCodeForToken = async (code: string, state: string) => {
  if (state === null) {
    return { state: 0, message: "state_mismatch" };
  } else {
    // ponytail: read config dynamically
    const clientId = config.SPOTIFY_CLIENT_ID || config.getConfig().SPOTIFY_CLIENT_ID || "";
    const clientSecret = config.SPOTIFY_CLIENT_SECRET || config.getConfig().SPOTIFY_CLIENT_SECRET || "";
    const redirectUri = config.SPOTIFY_REDIRECT_URI || config.getConfig().SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3000/spotify/callback/";

    const token_resp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from((clientId || "") + ":" + (clientSecret || "")).toString(
            "base64",
          ),
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: redirectUri || "",
        grant_type: "authorization_code",
      }),
    });

    const response_json = await token_resp.json();
    const time = new Date().getTime();

    const parsing: ISpotifyToken = {
      ...response_json,
      timestamp: {
        start: time,
        end: time + response_json.expires_in * 1000,
      },
    };

    return { state: 1, message: "success", data: parsing };
  }
};
