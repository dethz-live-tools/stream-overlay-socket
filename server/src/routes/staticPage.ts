import fs from "node:fs";
import { parse } from "yaml";

interface metadataInterface {
  name: string;
  description: string;
  image: string;
  author: string;
}

const color = `/* This is palette from "catppuccin -- Macchiato" */

:root {
  /* Text */
  --ctp-text: rgb(202, 211, 245);
  --ctp-subtext-1: rgb(184, 192, 224);
  --ctp-subtext-0: rgb(165, 173, 203);
  --ctp-overlay-2: rgb(147, 154, 183);
  --ctp-overlay-1: rgb(128, 135, 162);
  --ctp-overlay-0: rgb(110, 115, 141);

  /* Surface */
  --ctp-surface-2: rgb(91, 96, 120);
  --ctp-surface-1: rgb(73, 77, 100);
  --ctp-surface-0: rgb(54, 58, 79);

  /* Base */
  --ctp-base: rgb(36, 39, 58);
  --ctp-mantle: rgb(30, 32, 48);
  --ctp-crust: rgb(24, 25, 38);

  /* Special Colors */
  --ctp-rosewater: rgb(244, 219, 214);
  --ctp-flamingo: rgb(240, 198, 198);
  --ctp-pink: rgb(245, 189, 230);
  --ctp-mauve: rgb(198, 160, 246);
  --ctp-red: rgb(237, 135, 150);
  --ctp-maroon: rgb(238, 153, 160);
  --ctp-peach: rgb(245, 169, 127);
  --ctp-yellow: rgb(238, 212, 159);
  --ctp-green: rgb(166, 218, 149);
  --ctp-teal: rgb(139, 213, 202);
  --ctp-sky: rgb(145, 215, 227);
  --ctp-sapphire: rgb(125, 196, 228);
  --ctp-blue: rgb(138, 173, 244);
  --ctp-lavender: rgb(183, 189, 248);
}`;

const css = `@import url(https://fonts.googleapis.com/css?family=IBM+Plex+Sans+Thai:100,200,300,regular,500,600,700);

${color}

* {
  font-family: 'IBM Plex Sans Thai', sans-serif;
  transition: all .3s;
}

body {
  background: var(--ctp-base);
  color: var(--ctp-text);
}

h1 {
  text-align: center;
}

.flex-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  * {
    margin: 0;
  }

  .flex-item {
    transition: all .3s !important;
    width: 20rem;
    aspect-ratio: 2/1;

    border-radius: 1rem;
    border: 1px solid var(--ctp-text);

    color: var(--ctp-sapphire);
    font-size: 1rem;
    text-decoration: none;

    background-position: center !important;
    background-size: cover !important;
    background-repeat: no-repeat !important;

    .card-overlay {
      width: calc(100% - 2rem);
      height: calc(100% - 2rem);

      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      
      padding: 1rem;

      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(.2rem);
      border-radius: 1rem;

      p {
        width: 100%;
        text-align: center;

        &:nth-child(1) {
          font-size: 1.5rem;
          height: 4rem;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &:nth-child(2) {
          font-size: 1rem;
          opacity: .8;
          height: 5rem;
          
          overflow: scroll;
        }
      }
    }

    &:hover {
      .card-overlay {
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(1rem);
      }
    }
  }
}`;

export const staticListingPage = (dirArray: string[]) => {
  let list = "";

  if (dirArray.length < 1) {
    list = "<p>No directory found</p>";
  } else {
    list = dirArray
      .map((dir) => {
        let element = "";

        if (dir !== "libs") {
          const file = fs.existsSync(`static/${dir}/meta.yaml`)
            ? `static/${dir}/meta.yaml`
            : fs.existsSync(`static/${dir}/meta.yml`)
              ? `static/${dir}/meta.yml`
              : "";

          if (file === "") {
            const detail = `<div class="card-overlay">
  <p>${dir}</p>
  <p></p>
</div>`;

            element = `<a href="/static/${dir}" class="flex-item">${detail}</a>`;
          } else {
            const metadata = fs.readFileSync(file, "utf-8");
            let meta = parse(metadata) as metadataInterface;

            const detail = `<div class="card-overlay">
  <p>${meta.name} [${meta.author}]</p>
  <p>${meta.description}</p>
</div>`;

            element = `<a href="/static/${dir}" class="flex-item" style="background: url('/static/${dir}/${meta.image}')">${detail}</a>`;
          }
        }

        return element;
      })
      .join("");
  }

  const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Static Overlay Listing</title>
  
  <style>
    ${css}
  </style>
</head>
<body>
  <div>
    <h1>Overlay Listing</h1>
    <div class="flex-container">
      ${list}
    </div>
  </div>
</body>
</html>`;

  return page;
};
