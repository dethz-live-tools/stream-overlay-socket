// deno-lint-ignore-file
var token = null;
var spt_timeout = null;

var did = null;

var spotifyRenderer = (state) => {
  if (state) {
    document.querySelector("#spotify-status").innerHTML = "🔴";
  } else {
    document.querySelector("#spotify-status").innerHTML = "🟢";
  }

  spotifyFrame(state);
};

var spotifyInit = () => {
  const parsedToken = JSON.parse(
    window.sessionStorage.getItem("spotify_token"),
  );

  if (parsedToken !== null) {
    if (parsedToken.error === undefined || parsedToken.error === null) {
      token = parsedToken;
    }
  }

  spotifyRenderer(token === null);
};

var stopTokenCountdown = () => {
  if (spt_timeout !== null) {
    clearInterval(spt_timeout);
    spt_timeout = null;
  }
};

var startTokenCountdown = (token) => {
  if (spt_timeout !== null) {
    stopTokenCountdown();
  }

  spt_timeout = setInterval(() => {
    const now = new Date().getTime();
    const timeLeft = Math.floor((token.timestamp.end - now) / 1000);

    if (timeLeft < 0) {
      Swal.fire({
        icon: "error",
        title: "Token expired",
      }).then(() => {
        stopTokenCountdown();

        token = null;
        spotifyRenderer(token === null);
      });
      return;
    }

    document.querySelector("#spotify-time-left").innerText = timeLeft;
  }, 1000);
};

var spotifyPlayerRenderer = (data) => {
  const playerElement = document.querySelector("#spt-current-play");
  const playElement = document.querySelector("#spt-play");

  var id = data.device.id;

  if (did !== null) {
    if (id !== null) {
      if (id !== did) {
        console.log("Device changed!");
        did = id;
      }
    } else {
      console.log("No device id");
    }
  } else {
    if (id !== null) {
      did = id;
    } else {
      id = did;
    }
  }

  const element = `<div id="spt-player-status">
  <div id="current-play">
    <img src="${data.item.album.images[0].url}" alt="cover-img" id="cover-img">
    <div id="current-play-text">
      <div id="song-name">${data.item.name}</div>
      <div id="artist-name">${data.item.artists.map((artist) => artist.name).join(", ")}</div>
    </div>
  </div>
  
  <hr>

  <div id="device">
    <p>Playing on: </p>
    <p id="current-player">
      ${data.device.name} (${data.device.id})
    </p>
  </div>

  <hr>
 
  <div id="player-state">
    <p>shuffle: ${data.shuffle_state}</p>
    <p>repeat: ${data.repeat_state}</p>
    <p>volume: ${data.device.volume_percent}</p>
  </div>

  <button id="spt-refresh-player">
    Refresh Player
  </button>
</div>`;

  playerElement.innerHTML = element;

  if (data.actions.disallows.resuming === true) {
    playElement.innerHTML = "Pause";
  } else {
    playElement.innerHTML = "Play";
  }

  playElement.addEventListener("click", () => {
    if (playElement.innerHTML == "Pause") {
      playElement.innerHTML = "Play";
      playerController("pause");
    } else {
      playElement.innerHTML = "Pause";
      playerController("play: " + id);
    }
  });

  document
    .querySelector("#spt-refresh-player")
    .addEventListener("click", () => {
      ws.send("spt: player -- player");
    });
};

var spotifyQueueRenderer = (data) => {
  const queueElement = document.querySelector("#spt-queue");
  var queueItem = "";

  for (let i = 0; i < 5; i++) {
    let payload = data.queue[i];

    const trackName = payload.name;
    const artist = payload.artists.map((artist) => artist.name).join(", ");
    const albumArt = payload.album.images[0].url;
    const id = payload.id;

    const element = `
    <div class="queue-item" id="${id}">
      <img src="${albumArt}" alt="cover-img">

      <div id="track-text">
        <p>${trackName}</p>
        <p>${artist}</p>
      </div>
    </div>`;

    queueItem += element;
  }

  queueElement.innerHTML = queueItem;
};
window.token = token;
window.spotifyRenderer = spotifyRenderer;
window.spotifyInit = spotifyInit;
window.stopTokenCountdown = stopTokenCountdown;
window.startTokenCountdown = startTokenCountdown;
window.spotifyPlayerRenderer = spotifyPlayerRenderer;
window.spotifyQueueRenderer = spotifyQueueRenderer;
