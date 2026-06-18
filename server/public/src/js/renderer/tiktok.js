const tiktokInitialElement = (isLogin) => {
  if (!isLogin) {
    document.querySelector("#tiktok-container").innerHTML =
      `<form id="tiktok-connect">
  <input id="tt-username" placeholder="Username" value="${window.localStorage.getItem("tt-username") ? window.localStorage.getItem("tt-username") : ""}" />
  <button type="submit">Connect</button>
</form>`;

    document
      .querySelector("#tiktok-connect")
      .addEventListener("submit", (e) => {
        e.preventDefault();

        const username = window.document.querySelector("#tt-username").value;
        window.localStorage.setItem("tt-username", username);
        ws.send(`tt: connect to ${username}`);
      });
  } else {
    document.querySelector("#tiktok-container").innerHTML =
      `<div id="current-connect">
  Currently connected to ${window.localStorage.getItem("tt-username")}
  <button id="tt-disconnect">Disconnect</button>
</div>

<div id="tt-dash">
  <div id="tt-chat-container">
    <!-- Chat -->
    <div id="tt-chatbox"></div>

    <!-- Gift -->
    <div id="tt-giftbox"></div>
  </div>
</div>`;

    document.querySelector("#tt-disconnect").addEventListener("click", () => {
      ws.send("tt: disconnect");
    });
  }
};
