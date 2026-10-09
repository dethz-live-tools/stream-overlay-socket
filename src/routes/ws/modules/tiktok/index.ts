import { ServerWebSocket } from "bun";
import { WebcastEvent } from "tiktok-live-connector";

import { tiktokClient } from "../../../../modules/tiktok";
import { chatParser } from "./modules/chat";
import { giftParser } from "./modules/gift";

var tiktok: tiktokClient | null = null;
var isConnected = false;
const recentGifts = new Set<string>();

export const tiktokHandler = async (msg: string, ws: ServerWebSocket) => {
  const cmd = msg.replace("tt: ", "");

  if (cmd.startsWith("connect to ")) {
    const username = cmd.replace("connect to ", "");

    if (tiktok !== null) {
      try {
        tiktok.client.disconnect();
      } catch (err) {}
      tiktok = null;
      isConnected = false;
    }
    recentGifts.clear();
    tiktok = new tiktokClient(username);

    tiktok.client
      .connect()
      .then((state) => {
        console.log(`Connected to tiktok-live on room ID ${state.roomId}`);
        ws.send(
          `log: success -- Connected to tiktok-live on room ID ${state.roomId}`,
        );
        ws.send("tt: connected");
        isConnected = true;
      })
      .catch((err) => {
        console.error("Failed to connect", err.message);
        console.error(err);
        ws.send("log: error -- Failed to connect");
      });

    tiktok.client.on(WebcastEvent.CHAT, (data) => {
      ws.send("tt: chat " + JSON.stringify(chatParser(data)));
    });

    tiktok.client.on(WebcastEvent.GIFT, (data) => {
      const isRepeatEnd = Boolean((data as any).repeatEnd || (data as any).repeat_end === 1);
      const giftType = Number((data as any).giftType ?? (data as any).giftDetails?.giftType ?? 0);
      const repeatCount = Number((data as any).repeatCount ?? (data as any).gift?.repeat_count ?? 1);

      // Streak in progress: skip if streakable or repeatCount > 1 or repeatEnd explicitly false
      if (!isRepeatEnd && (giftType === 1 || repeatCount > 1 || (data as any).repeatEnd === false)) {
        return;
      }

      // Deduplication: prevent duplicate gift alerts
      const groupId = (data as any).groupId ? String((data as any).groupId) : "";
      const msgId = (data as any).msgId ? String((data as any).msgId) : ((data as any).id ? String((data as any).id) : "");
      const userId = (data as any).userId || (data as any).user?.userId || "";
      const giftId = (data as any).giftId || (data as any).giftDetails?.id || "";

      const dedupKey = groupId
        ? `grp_${groupId}_${repeatCount}`
        : (msgId
            ? `msg_${msgId}`
            : `gift_${userId}_${giftId}_${repeatCount}_${Math.floor(Date.now() / 3000)}`);

      if (recentGifts.has(dedupKey)) {
        return;
      }
      recentGifts.add(dedupKey);
      if (recentGifts.size > 1000) {
        const first = recentGifts.values().next().value;
        if (first) recentGifts.delete(first);
      }

      ws.send("tt: gift " + JSON.stringify(giftParser(data)));
    });
  } else if (cmd === "disconnect") {
    if (tiktok !== null) {
      try {
        tiktok.client.disconnect();
      } catch (err) {}
      tiktok = null;
      isConnected = false;
      recentGifts.clear();
      ws.send("log: success -- Disconnected from tiktok-live");
      ws.send("tt: disconnected");
    } else {
      ws.send("log: error -- Not connected to tiktok-live");
    }
  }
};

export const tiktokCleanup = (_ws?: ServerWebSocket) => {
  if (tiktok !== null) {
    try {
      tiktok.client.disconnect();
    } catch (err) {}
    tiktok = null;
    isConnected = false;
    recentGifts.clear();
    console.log("TikTok connection cleaned up.");
  }
};
