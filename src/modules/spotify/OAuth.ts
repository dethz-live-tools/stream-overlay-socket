import * as config from "../../modules/config";

export const spotifyOAuth = (state: string) => {
  // ponytail: read config dynamically
  const clientId = config.SPOTIFY_CLIENT_ID || config.getConfig().SPOTIFY_CLIENT_ID || "";
  const redirectUri = config.SPOTIFY_REDIRECT_URI || config.getConfig().SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3000/spotify/callback/";

  const scopedSlots = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-read-currently-playing",
    "user-modify-playback-state",
  ];

  const paramsObj = {
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopedSlots.join(" "),
    show_dialog: "true",
    state: state,
  };
  const searchParams = new URLSearchParams(paramsObj);
  const queryString = searchParams.toString();

  return `https://accounts.spotify.com/authorize?${queryString}`;
};
