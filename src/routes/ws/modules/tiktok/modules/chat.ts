import { debug } from "node:console";
import { WebcastChatMessage } from "tiktok-live-connector";

export const chatParser = (data: WebcastChatMessage) => {
  const chatData = {
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
    message: data.comment,
  };

  return chatData;
};
