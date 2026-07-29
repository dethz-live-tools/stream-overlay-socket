import { TikTokLiveConnection } from "tiktok-live-connector";

export class tiktokClient {
  public client: TikTokLiveConnection;

  constructor(username: string) {
    this.client = new TikTokLiveConnection(username);
  }
}
