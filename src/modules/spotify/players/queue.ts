// Queue Loader

import { basedController } from ".";
import { ISpotifyQueue } from "../../interfaces/spotify/queue.interface";

export const queue = async (accessToken: string) => {
  // API path: https://api.spotify.com/v1/me/player/queue
  const resp = (await basedController(
    accessToken,
    "GET",
    "queue",
  )) as ISpotifyQueue;

  if (!resp || (resp.error !== undefined && resp.error !== null)) return null;
  else return resp;
};
