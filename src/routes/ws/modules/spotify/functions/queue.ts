import { ISpotifyToken } from "../../../../../modules/interfaces/spotify/token.interface";
import { queue } from "../../../../../modules/spotify/players/queue";

export const queueFetcher = async (token: ISpotifyToken) => {
  const data = await queue(token.access_token);

  if (data === null || data.error) {
    return null;
  }

  return data;
};
