import { ISpotifyError } from "./error.interface";

export interface ISpotifyNowPlayImage {
  height: number;
  url: string;
  width: number;
}

export interface ISpotifyNowPlayContext {
  external_urls: {
    spotify: string;
  };
  href: string;
  type: string;
  uri: string;
}

export interface ISpotifyNowPlayItemArtists {
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface ISpotifyNowPlayItemAlbum {
  album_type: string;
  artists: ISpotifyNowPlayItemArtists[];
  available_markets: string[];
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: ISpotifyNowPlayImage[];
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
  restrictions?: {
    reason: string;
  };
}

export interface ISpotifyNowPlayItem {
  album: ISpotifyNowPlayItemAlbum;
  artists: ISpotifyNowPlayItemArtists[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: {
    isrc?: string;
    ean?: string;
    upc?: string;
  };
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: string;
  uri: string;
  is_playable?: boolean;
  linked_from?: Record<string, any>;
  restrictions?: {
    reason: string;
  };
}

export interface ISpotifyNowPlayActions {
  disallows: {
    resuming?: boolean;
    pausing?: boolean;
    skipping_next?: boolean;
    skipping_prev?: boolean;
    toggling_repeat_context?: boolean;
    toggling_repeat_track?: boolean;
    toggling_shuffle?: boolean;
  };
}

export interface ISpotifyNowPlay {
  is_playing: boolean;
  timestamp: number;
  context: ISpotifyNowPlayContext | null;
  progress_ms: number;
  item: ISpotifyNowPlayItem | null;
  currently_playing_type: string;
  actions: ISpotifyNowPlayActions;
  error?: ISpotifyError;
}
