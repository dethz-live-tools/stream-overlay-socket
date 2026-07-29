import * as config from "../../modules/config";

const client_id = config.SPOTIFY_CLIENT_ID;
const client_secret = config.SPOTIFY_CLIENT_SECRET;

export const refreshAccessToken = async (refresh_token: string) => {
  const paramsObj = {
    grant_type: "refresh_token",
    refresh_token: refresh_token,
    client_id: client_id || "",
  };

  const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString(
    "base64",
  );

  const url = "https://accounts.spotify.com/api/token";

  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + basicAuth,
    },
    body: new URLSearchParams(paramsObj),
  };
  const body = await fetch(url, payload);
  const response = await body.json();

  if (response.error) {
    return response;
  }

  // Stamp timestamp so the polling loop can track expiry
  const now = new Date().getTime();
  response.timestamp = {
    start: now,
    end: now + response.expires_in * 1000,
  };

  return response;
};
