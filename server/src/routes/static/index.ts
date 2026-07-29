// Controller
import controllerPage from "../../../public/controller/index.html";

// Spotify
import spotifyAuthPage from "../../../public/spotify/auth/index.html";
import spotifyCallbackPage from "../../../public/spotify/callback/index.html";
import spotifySessionPage from "../../../public/spotify/session/index.html";

const controllerRoutes = {
  "/controller": controllerPage,
};

const spotifyRoutes = {
  "/spotify/auth": spotifyAuthPage,
  "/spotify/callback": spotifyCallbackPage,
  "/spotify/session": spotifySessionPage,
};

export const staticRoutes = {
  ...controllerRoutes,
  ...spotifyRoutes,
};
