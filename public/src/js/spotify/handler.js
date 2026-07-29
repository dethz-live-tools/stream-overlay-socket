var player = null;

var spotifyCommandHandler = (msg) => {
  const cmd = msg.replace("spt: ", "");

  if (cmd.startsWith("NEW TOKEN ")) {
    sessionStorage.setItem("spotify_token", cmd.replace("NEW TOKEN ", ""));

    spotifyInit();
  } else if (cmd.startsWith("PLAYER DATA -- ")) {
    const data = JSON.parse(cmd.replace("PLAYER DATA -- ", ""));
    player = data;

    spotifyPlayerRenderer(data);
  } else if (cmd.startsWith("QUEUE ")) {
    const data = JSON.parse(cmd.replace("QUEUE ", ""));

    ws.send("spt: player -- player");

    // Render Queue
    spotifyQueueRenderer(data);
  } else {
    console.log(cmd);

    spotifyInit();
  }
};
window.spotifyCommandHandler = spotifyCommandHandler;
