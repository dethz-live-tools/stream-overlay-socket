// deno-lint-ignore-file
var ws;

const socketConnector = (ip) => {
  ws = new WebSocket(`ws://${ip}/ws`);

  ws.onopen = () => {
    console.log("Connected to server");
    socketController(true);

    ws.send("spt: SET TOKEN " + JSON.stringify(token));
    ws.send("spt: player -- player");
  };

  ws.onmessage = (e) => {
    var msg = String(e.data);

    if (msg.startsWith("spt: ")) {
      spotifyCommandHandler(msg);
    } else if (msg.startsWith("log: ")) {
      logHandler(msg);
    } else {
      console.log(msg);
    }
  };

  ws.onclose = () => {
    console.log("Disconnected from server");
    socketController(false);
  };
};

const controllerRenderer = (ip) => {
  controllerFrame();
  spotifyInit();

  socketConnector(ip);
};
