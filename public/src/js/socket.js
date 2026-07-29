// deno-lint-ignore-file
var ws;

var socketConnector = (ip) => {
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

var controllerRenderer = (ip) => {
  controllerFrame();
  spotifyInit();
  tiktokInitialElement();

  socketConnector(ip);
};

window.controllerRenderer = controllerRenderer;
window.socketConnector = socketConnector;
