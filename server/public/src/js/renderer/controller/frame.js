// deno-lint-ignore-file
const controllerFrame = () => {
  document.head.innerHTML += `<link rel="stylesheet" href="/src/css/controller.css">`;

  const element = `<div class="main-container">
  <div id="status">
    <div class="status-container">
      <p id="socket">
        Socket Status: <span id="socket-status">🔴</span>
      </p>
      <p id="spotify">
        <p id="spotify-status-container">
          Spotify Status: <span id="spotify-status">🔴</span>
        </p>

        <p id="time" class="hidden">
          Time Left: <span id="spotify-time-left">0</span>
        </p>
      </p>
    </div>
  </div>
  <div id="controller">
    <div class="controller-container">
      <div id="socket-controller">
        
      </div>

      <div id="tiktok-controller">
        <h2 id="tiktok-header">Tiktok Chat & Utilities</h2>
        <div id="tiktok-container" ${window.localStorage.getItem("tt-hide") === "false" ? 'class=""' : 'class="hidden"'}>
          
        </div>
      </div>
      
      <div id="tts-controller">
        <h2 id="tts-header">TTS Config</h2>
        <div id="tts-container" ${window.localStorage.getItem("tts-hide") === "false" ? 'class=""' : 'class="hidden"'}>
          
        </div>
      </div>
      
      <div id="spotify-controller">
        nothing to load right now
      </div>

      <div id="log-controller">
        <h2 id="console-header">Console</h2>
        <div id="console-container" ${window.localStorage.getItem("log-hide") === "false" ? 'class=""' : 'class="hidden"'}>
          <div id="log-box"></div>
        </div>
      </div>
    </div>
  </div>
</div>`;

  document.querySelector("#main").innerHTML = element;
};

const spotifyFrame = (state) => {
  if (state) {
    document.querySelector("#spotify-controller").innerHTML =
      `<h3 id="spt-header">
  Spotify Controller
</h3>

<div id="spt-dash">
  <button id="spt-login">Login with Spotify</button>
  <div>
    <p>If you already logged in and some error occurred</p>
    <button id="spt-reauth">Re-Initialized Frame</button>
  </div>
</div>`;

    document.querySelector("#spt-login").addEventListener("click", async () => {
      window.location.href = "/spotify/auth/?state=" + id;
    });

    document
      .querySelector("#spt-reauth")
      .addEventListener("click", async () => {
        if (window.sessionStorage.getItem("spotify_token") !== null) {
          spotifyInit();
        } else {
          Swal.fire({
            icon: "error",
            title: "No token found",
            text: "You need to login first",
          });
        }
      });
  } else {
    document.querySelector("#spotify-controller").innerHTML =
      `<h3 id="spt-header">
  Spotify Controller
</h3>

<div id="spt-dash" class="hidden isLogin">
  <div class="spt-button-controller">
    <div id="spt-current-play"></div>
    
    <div class="player-controller">
      <button id="spt-previous">
        Previous
      </button>
      <button id="spt-play">
        Play
      </button> 
      <button id="spt-next">
        Next
      </button>
    </div>
    
    <div class="volume-controller">
      <button id="spt-volume-down">Volume Down</button>
      <button id="spt-volume-up">Volume Up</button>
    </div>
    
    <form id="spotify-search">
      <input type="text" placeholder="song name // song name + artist" id="context" name="context" />
      <button type="submit">search</button>
    </form>
    
    <div class="state-controller">
      <button id="spt-logout">Logout</button>
      <button id="spt-reauth">Re-Authenticate</button>
    </div>
  </div>
  <div class="spt-queue-controller">
    <button id="pull-queue">
      Pull Queue
    </button> 
    <div id="spt-queue"></div>
  </div>
</div>`;

    if (localStorage.getItem("spt-hide") === "false") {
      document.querySelector("#spt-dash").classList.remove("hidden");
    }

    const timeClass = document.querySelector("p#time").classList;

    if (timeClass.contains("hidden")) {
      timeClass.remove("hidden");
    }

    spotifyListener();
    startTokenCountdown(token);
  }
};
