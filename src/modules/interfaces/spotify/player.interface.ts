import { ISpotifyError } from "./error.interface";
import { ISpotifyNowPlay, ISpotifyNowPlayActions } from "./play.interface";

interface ISpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  supports_volume: boolean;
  type: string;
  volume_percent: number;
}

export interface ISpotifyPlayer extends ISpotifyNowPlay {
  device: ISpotifyDevice;
  shuffle_state: boolean;
  smart_shuffle: boolean;
  repeat_state: "off" | "track" | "context";
  progress_ms: number;
  currently_playing_type: "track" | "episode" | "ad" | "unknown";
  actions: ISpotifyNowPlayActions;
  error?: ISpotifyError;
}
