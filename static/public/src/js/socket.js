var ws = null;

const endpoint = atob(new URLSearchParams(window.location.search).get("id"));

const socketConnector = () => {
  ws = new WebSocket(`ws://${endpoint}/ws`);

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (e) => {
    const msg = e.data;

    if (msg !== "spt: heartbeat") {
      if (msg.startsWith("spt: ")) {
        if (msg.startsWith("spt: QUEUE ")) {
          var data = JSON.parse(msg.replace("spt: QUEUE ", ""));

          renderController(data);
        }
      } else {
        console.log(msg);
      }
    }
  };

  ws.onclose = () => {
    console.log("WebSocket Connection closed");
  };
};

socketConnector();
