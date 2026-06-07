import { ISpotifyError } from "./error.interface";
import { ISpotifyNowPlayItem } from "./play.interface";

export interface ISpotifyQueue {
  currently_playing: ISpotifyNowPlayItem | null;
  queue: ISpotifyNowPlayItem[];
  error?: ISpotifyError;
}
