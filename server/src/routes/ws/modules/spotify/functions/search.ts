import { spotifyController } from "../../../../../modules/spotify/players/controller";
import { search } from "../../../../../modules/spotify/players/search";

export const spotifySearchHandler = async (token: string, msg: string) => {
  const data = await search(token, msg);

  const artists = data.artists.map((artist) => artist.name).join(", ");
  const track = data.name;
  const trackID = data.id;
  const trackName = `${artists} - ${track} (${trackID})`;

  const result = await spotifyController("add", token, trackID);

  if (result === null) {
    return null;
  } else {
    return trackName;
  }
};
