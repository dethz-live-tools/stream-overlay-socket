var spotifyAnimationFunction = () => {
  document.querySelector("#spt-header").addEventListener("click", () => {
    const target = document.querySelector("#spt-dash");

    if (target.classList.contains("hidden")) {
      target.classList.remove("hidden");
      localStorage.setItem("spt-hide", "false");
    } else {
      target.classList.add("hidden");
      localStorage.setItem("spt-hide", "true");
    }
  });
};

var logAnimationFunction = () => {
  document.querySelector("#console-header").addEventListener("click", () => {
    const target = document.querySelector("#console-container");

    if (target.classList.contains("hidden")) {
      target.classList.remove("hidden");
      localStorage.setItem("log-hide", "false");
    } else {
      target.classList.add("hidden");
      localStorage.setItem("log-hide", "true");
    }
  });

  document.querySelector("#tiktok-header").addEventListener("click", () => {
    const target = document.querySelector("#tiktok-container");

    if (target.classList.contains("hidden")) {
      target.classList.remove("hidden");
      localStorage.setItem("tt-hide", "false");
    } else {
      target.classList.add("hidden");
      localStorage.setItem("tt-hide", "true");
    }
  });

  document.querySelector("#tts-header").addEventListener("click", () => {
    const target = document.querySelector("#tts-container");

    if (target.classList.contains("hidden")) {
      target.classList.remove("hidden");
      localStorage.setItem("tts-hide", "false");
    } else {
      target.classList.add("hidden");
      localStorage.setItem("tts-hide", "true");
    }
  });
};
window.spotifyAnimationFunction = spotifyAnimationFunction;
window.logAnimationFunction = logAnimationFunction;
