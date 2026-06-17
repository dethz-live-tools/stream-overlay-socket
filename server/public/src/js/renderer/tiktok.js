const tiktokInitialElement = (isLogin) => {
  if (!isLogin) {
    document.querySelector("#tiktok-container").innerHTML =
      `<form id="tiktok-connect">
  <input id="tt-username" placeholder="Username" />
  <button type="submit">Connect</button>
</form>`;

    document
      .querySelector("#tiktok-connect")
      .addEventListener("submit", (e) => {
        e.preventDefault();

        const username = window.document.querySelector("#tt-username").value;
        ws.send(`tt: connect to ${username}`);
      });
  } else {
    document.querySelector("#tiktok-container").innerHTML = `<div id="tt-dash">
  <div id="tt-chat-container">
    <!-- Chat -->
    <div id="tt-chatbox"></div>

    <!-- Gift -->
    <div id="tt-giftbox"></div>
  </div>
</div>`;
  }
};
