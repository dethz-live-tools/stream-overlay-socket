const tiktokHandler = (msg) => {
  const command = msg.replace("tt: ", "");

  if (command === "connected" || command === "disconnected") {
    tiktokInitialElement(command === "connected");
  } else if (command.startsWith("chat ")) {
    // const data = JSON.parse(command.replace("chat ", ""));
    // console.log("Chat:", data);
  } else if (command.startsWith("gift ")) {
    // const data = JSON.parse(command.replace("gift ", ""));
    // console.log("Gift:", data);
  } else {
    console.log(msg);
  }
};
