import { WebcastGiftMessage } from "tiktok-live-connector";

export const giftParser = (data: WebcastGiftMessage | any) => {
  const isRepeatEnd = Boolean(data.repeatEnd || data.repeat_end === 1);
  const giftType = data.giftDetails?.giftType ?? data.giftType ?? data.gift?.gift_type ?? 0;
  const giftName = data.giftDetails?.giftName || data.giftName || data.describe || data.name || "Gift";
  const giftImage = data.giftDetails?.giftImage?.url?.[0] || data.giftPictureUrl || data.giftIcon || "";
  const repeatCount = Number(data.repeatCount ?? data.gift?.repeat_count ?? 1);
  const diamondCount = Number(data.giftDetails?.diamondCount ?? data.diamondCount ?? 0);
  const msgId = data.msgId ? String(data.msgId) : (data.id ? String(data.id) : "");
  const groupId = data.groupId ? String(data.groupId) : "";
  const timestamp = Number(data.timestamp || data.createTime || Date.now());
  const uniqueId = String(msgId || groupId || `${data.user?.userId || data.userId}_${data.giftId}_${repeatCount}_${timestamp}`);

  const giftData = {
    id: uniqueId,
    msgId: msgId,
    groupId: groupId,
    timestamp: timestamp,
    user: {
      id: data.user?.userId || data.userId,
      nickname: data.user?.nickname || data.nickname || "Viewer",
      uniqueId: data.user?.uniqueId || data.uniqueId || "",
      profile:
        data.user?.profilePicture?.url?.[0] ||
        data.user?.profile ||
        data.profilePictureUrl ||
        "",
      followStatus:
        data.user?.followInfo?.followStatus === "1"
          ? "follower"
          : data.user?.followInfo?.followStatus === "2"
            ? "fanclub"
            : data.user?.followInfo?.followStatus === "0"
              ? ""
              : "subscriber",
      attribute: {
        isAdmin: data.user?.userAttr?.isAdmin,
        isSuperAdmin: data.user?.userAttr?.isSuperAdmin,
      },
    },
    gift: {
      id: data.giftDetails?.id || data.giftId || data.gift?.gift_id,
      msgId: msgId,
      groupId: groupId,
      name: giftName,
      type: giftType,
      combo: data.giftDetails?.combo ?? data.combo,
      count: diamondCount,
      repeat: repeatCount,
      image: giftImage,
      repeatEnd: isRepeatEnd,
    },
    repeatEnd: isRepeatEnd,
    giftType: giftType,
    giftName: giftName,
    giftPictureUrl: giftImage,
    repeatCount: repeatCount,
    diamondCount: diamondCount,
  };

  return giftData;
};
