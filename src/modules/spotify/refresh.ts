import * as config from "../../modules/config";

export const refreshAccessToken = async (refresh_token: string) => {
  // ponytail: read config dynamically to avoid stale credentials
  const clientId = config.SPOTIFY_CLIENT_ID || config.getConfig().SPOTIFY_CLIENT_ID || "";
  const clientSecret = config.SPOTIFY_CLIENT_SECRET || config.getConfig().SPOTIFY_CLIENT_SECRET || "";

  if (!refresh_token) {
    return { error: "missing_refresh_token", error_description: "No refresh token provided" };
  }

  const paramsObj = {
    grant_type: "refresh_token",
    refresh_token: refresh_token,
    client_id: clientId,
  };

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
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

  // Stamp timestamp so polling and clients track expiry
  const now = new Date().getTime();
  response.timestamp = {
    start: now,
    end: now + (response.expires_in || 3600) * 1000,
  };

  // Preserve refresh token if Spotify did not rotate it
  if (!response.refresh_token) {
    response.refresh_token = refresh_token;
  }

  return response;
};
