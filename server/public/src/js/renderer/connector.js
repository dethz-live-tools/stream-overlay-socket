// deno-lint-ignore-file
const connector = (ip) => {
  const encode = btoa(ip);
  window.location.href = `${window.location.origin}/controller/?id=${encode}`;
};

const connectRenderer = () => {
  document.head.innerHTML += `<link rel="stylesheet" href="/src/css/connector.css">`;

  document.querySelector("#main").innerHTML += `<div class="main-container">
  <h1>Web Socket Controller</h1>

  <form id="connector">
    <label for="url">Web Socket URL:</label>
    <input type="text" id="url" placeholder="localhost:3000" required>
    <button type="submit">Connect</button>
  </form>
</div>`;

  document.querySelector("#connector").addEventListener("submit", (e) => {
    e.preventDefault();
    const ip = document.querySelector("#url").value;

    if (ip === "" || ip === null || ip === undefined) return;

    connector(ip);
  });
};
