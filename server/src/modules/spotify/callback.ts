import { ISpotifyToken } from "../interfaces/spotify/token.interface.ts";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
// const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

const redirect_uri = "http://127.0.0.1:3000/spotify/callback/";

export const exchangeCodeForToken = async (code: string, state: string) => {
  if (state === null) {
    return { state: 0, message: "state_mismatch" };
  } else {
    const token_resp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from((client_id || "") + ":" + (client_secret || "")).toString(
            "base64",
          ),
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri || "",
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
