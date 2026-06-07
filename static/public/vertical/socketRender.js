const playerRender = (data) => {
  const element = document.querySelector("#now-content");

  const artistString = data.artists.map((artist) => artist.name).join(", ");
  const songInfo = `${artistString} - ${data.name} [${data.album.name}]`;

  element.innerHTML = `<div class="song-info">
          <div class="cover">
            <img id="cover" src="${data.album.images[0].url}" alt="Album Cover" />
          </div>
          <div class="text">
            <h2 id="song-name" class="text-overflow-ellipsis">
            <span>
              ${songInfo} &nbsp;&nbsp;&nbsp; ${songInfo}
            </span>
            </h2>
          </div>
        </div>`;

  checkOverflow();
};

const queueRender = (data) => {
  var elementList = "";

  for (let i = 0; i < 5; i++) {
    let payload = data[i];

    elementList += `<div class="item-container">
  <img src="${payload.album.images[0].url}" alt="cover image">
  
  <div class="data-controller">
    <p id="name">${payload.name}</p>
    <p id="artists">${payload.artists.map((artist) => artist.name).join(", ")}</p>
  </div>
</div>`;
  }

  document.querySelector("#playlist > div.window-pane").innerHTML = elementList;
};

const renderController = (data) => {
  playerRender(data.currently_playing);
  queueRender(data.queue);
};

const checkOverflow = () => {
  const elements = document.querySelectorAll(".text-overflow-ellipsis");
  elements.forEach((el) => {
    const span = el.querySelector("span");
    if (span && span.offsetWidth > el.offsetWidth) {
      el.classList.add("scrolling");
    } else {
      el.classList.remove("scrolling");
    }
  });
};

window.addEventListener("resize", checkOverflow);
