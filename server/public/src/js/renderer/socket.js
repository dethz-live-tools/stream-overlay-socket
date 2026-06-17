// deno-lint-ignore-file
var conListener = false;
var disListener = false;

const socketOnline = () => {
  const element = `<form id="socket-message">
  <input type="text" id="message" name="message" placeholder="message">
  <button type="submit">Send</button>
</form>

<div class="socket-button-controller">
  <button id="disconnect">Disconnect</button>
</div>`;

  document.querySelector("#socket-controller").innerHTML = element;

  consoleController(true);

  if (conListener === false) {
    document
      .querySelector("#socket-message")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        const message = document.querySelector("#message").value;
        console.log(".");
        ws.send(message);
      });

    document.querySelector("#disconnect").addEventListener("click", () => {
      ws.close();
    });

    conListener = true;
  }
};

const socketOffline = () => {
  const element = `<div class="socket-button-controller">
  <button id="reconnect">Reconnect</button>
</div>`;

  document.querySelector("#socket-controller").innerHTML = element;

  consoleController(false);

  if (disListener === false) {
    document.querySelector("#reconnect").addEventListener("click", () => {
      socketConnector(atob(id));
    });

    disListener = true;
  }
};

const socketController = (online) => {
  if (online) {
    document.querySelector("#socket-status").innerHTML = "🟢";
    disListener = false;
    socketOnline();
  } else {
    document.querySelector("#socket-status").innerHTML = "🔴";
    conListener = false;
    socketOffline();
  }
};
