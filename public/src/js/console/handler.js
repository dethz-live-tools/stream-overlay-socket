var logHandler = (msg) => {
  const logData = msg.replace("log: ", "");

  const errState = logData.startsWith("error -- ");
  const sucState = logData.startsWith("success -- ");

  const newMessage = `<div class="logData">
    <p class="date">${new Date().toLocaleString()}</p>
    <p class="data ${errState ? "error" : sucState ? "success" : ""}">${errState ? logData.replace("error -- ", "") : sucState ? logData.replace("success -- ", "") : logData}</p>
  </div>`;

  const oldElement = document.querySelector("#log-box").innerHTML;

  document.querySelector("#log-box").innerHTML = newMessage + oldElement;
};
window.logHandler = logHandler;
