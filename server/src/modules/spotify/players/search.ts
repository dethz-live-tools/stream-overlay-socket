import { ISpotifySearch } from "../../interfaces/spotify/search.interface";

export const search = async (token: string, context: string) => {
  var uri = new URL(`https://api.spotify.com/v1/search`);

  uri.searchParams.append("type", "track");
  uri.searchParams.append("market", "TH");
  uri.searchParams.append("limit", "2");
  uri.searchParams.append("offset", "0");
  uri.searchParams.append("q", context);

  const resp = (await (
    await fetch(uri, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  ).json()) as ISpotifySearch;

  const data = resp.tracks.items;

  const filtered = data.filter((item) => {
    return item.name.toLowerCase().includes(context.toLowerCase());
  });

  if (filtered.length < 1) {
    return data[0];
  }

  return filtered[0];
};
