import { ISpotifyNowPlayItem } from "./play.interface";

export interface ISpotifySearchTracks {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: ISpotifyNowPlayItem[];
}

export interface ISpotifySearch {
  tracks: ISpotifySearchTracks;
}
