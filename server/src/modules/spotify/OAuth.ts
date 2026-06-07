const client_id = process.env.SPOTIFY_CLIENT_ID || "";
// const redirect_uri = process.env.SPOTIFY_REDIRECT_URI || "";
const redirect_uri = "http://127.0.0.1:3000/spotify/callback/";

export const spotifyOAuth = (state: string) => {
  const scopedSlots = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-read-currently-playing",
    "user-modify-playback-state",
  ];

  const paramsObj = {
    response_type: "code",
    client_id: client_id,
    redirect_uri: redirect_uri,
    scope: scopedSlots.join("%20"),
    show_dialog: "true",
    state: state,
  };
  const searchParams = new URLSearchParams(paramsObj);
  const queryString = searchParams.toString();

  return `https://accounts.spotify.com/authorize?${queryString}`;
};
