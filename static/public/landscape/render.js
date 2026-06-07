const nowElement = document.querySelector("#now-content");

var songName = "";
var artistName = "";
var albumName = "";

const ElementRenderer = (data) => {
  var payloadData;

  if (data.t == "INIT_STATE") {
    payloadData = data.d[userID];
  } else if (data.t == "PRESENCE_UPDATE") {
    payloadData = data.d;
  } else {
    return;
  }

  if (payloadData == undefined) {
    nowElement.innerHTML = "nothing online";
  } else {
    if (payloadData.listening_to_spotify) {
      if (
        songName != payloadData.spotify.song ||
        artistName != payloadData.spotify.artist ||
        albumName != payloadData.spotify.album
      ) {
        songName = payloadData.spotify.song;
        artistName = payloadData.spotify.artist;
        albumName = payloadData.spotify.album;

        const songInfo = `
              <i class="song-artist">${payloadData.spotify.artist}</i> - 
              <i class="song-title">${payloadData.spotify.song}</i>
              [<i class="song-album">${payloadData.spotify.album}</i>]
        `;

        nowElement.innerHTML = `<div class="song-info">
          <div class="cover">
            <img id="cover" src="${payloadData.spotify.album_art_url}" alt="Album Cover" />
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
      }
    } else {
      nowElement.innerHTML = "nothing online";
    }
  }
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
main();
