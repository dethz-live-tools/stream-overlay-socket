const playerController = (state) => {
  ws.send(`spt: player -- ${state}`);
  ws.send(`spt: player -- player`);
};

const spotifyListener = () => {
  const buttonList = [
    "#spt-previous",
    "#spt-next",
    "#spt-volume-down",
    "#spt-volume-up",
  ];

  for (let i = 0; i < buttonList.length; i++) {
    document.querySelector(buttonList[i]).addEventListener("click", () => {
      const slug = buttonList[i].replace("#spt-", "");

      if (slug == "volume-up" || slug == "volume-down") {
        console.log(slug.replace("-", ":"));
        playerController(slug.replace("-", ":"));
      } else {
        playerController(slug);
      }
    });
  }

  document.querySelector("#spt-logout").addEventListener("click", () => {
    stopTokenCountdown();
    ws.send("spt: logout");
  });

  document.querySelector("#spt-reauth").addEventListener("click", () => {
    document.location.href = "/spotify/auth/?state=" + id;
  });

  document.querySelector("#pull-queue").addEventListener("click", () => {
    ws.send("spt: pulling");
  });

  document.querySelector("#spotify-search").addEventListener("submit", (e) => {
    e.preventDefault();
    const context = document.querySelector("#context").value;
    ws.send(`spt: search -- ${context}`);
    ws.send("spt: pulling");
  });
};
