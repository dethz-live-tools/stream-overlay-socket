import { WebcastGiftMessage } from "tiktok-live-connector";

export const giftParser = (data: WebcastGiftMessage) => {
  const giftData = {
    user: {
      id: data.user?.userId,
      nickname: data.user?.nickname,
      uniqueId: data.user?.uniqueId,
      profile: data.user?.profilePicture?.url[0] || "",
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
      id: data.giftDetails?.id,
      name: data.giftDetails?.giftName,
      type: data.giftDetails?.giftType,
      combo: data.giftDetails?.combo,
      count: data.giftDetails?.diamondCount,
      repeat: data.repeatCount,
      image: data.giftDetails?.giftImage?.url[0],
    },
  };

  return giftData;
};
