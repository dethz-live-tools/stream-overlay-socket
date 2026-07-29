export interface ISpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  timestamp?: {
    start: number;
    end: number;
  };
  error?: string;
  state?: string;
}
