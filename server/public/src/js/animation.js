const animationFunction = () => {
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
