# Stream Overlay Authoring Guide

This guide covers building, structuring, and integrating live stream overlays into the **Stream Overlay Socket** ecosystem.

---

## 🎨 Overview

Overlays are self-contained web applications (HTML, CSS, JavaScript, and assets) located inside the [`static/`](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/static) directory.

The server:
1. **Hosts overlay files** statically at `/static/<overlay-name>/*`.
2. **Serves an interactive visual gallery** of all installed overlays at `http://localhost:3000/static`.
3. **Manages shared libraries** via automated Git synchronization based on [`meta.yaml`](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/static/spotify-queue-vertical/meta.yaml).
4. **Streams real-time events** (Spotify, TikTok, custom extensions) through WebSockets at `ws://<host>/ws`.

---

## 📁 Anatomy of an Overlay

Each overlay lives in its own subdirectory inside `static/`:

```
static/
└── my-stream-overlay/
    ├── meta.yaml          # Overlay metadata & Git library declarations
    ├── index.html         # Entry point loaded by OBS Browser Source
    ├── src/
    │   ├── background.png # Preview thumbnail or visual asset
    │   ├── style.css      # Custom styling
    │   └── app.js         # Frontend JavaScript & WebSocket listener
    └── .gitignore         # Ignores local build artifacts
```

---

## 📝 The `meta.yaml` Specification

Every overlay should define a `meta.yaml` (or `meta.yml`) in its root directory:

```yaml
name: "Neon Alert Overlay"
description: "Animated subscriber and track alert banner for Twitch & Spotify"
image: "src/background.png"
author: "StreamerDev"
libs:
  - dethz-live-tools/dethz-lib
  - https://github.com/dethz-live-tools/dethz-lib.git
```

### Field Definitions

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | **Yes** | Display name rendered in the `/static` gallery card. |
| `description` | string | No | Short summary explaining overlay capabilities. |
| `image` | string | No | Relative path to thumbnail image displayed in `/static`. |
| `author` | string | No | Creator name or handle. |
| `libs` | string[] | No | Array of external Git repositories needed by this overlay. |

---

## 📦 Shared Git Libraries (`libs`)

To avoid duplicating helper libraries, utility scripts, or styling across multiple overlays, declare them in `libs`.

### Supported Git URL Formats

- **GitHub Shorthand**: `owner/repo` (e.g. `dethz-live-tools/dethz-lib`)
- **HTTPS Git URL**: `https://github.com/owner/repo.git`
- **SSH Git URL**: `git@github.com:owner/repo.git`

### How Libraries Are Synchronized

When running `overlay sync` or booting with `--sync-libs`:
1. The server reads all `meta.yaml` files inside `static/`.
2. All declared libraries are downloaded into `static/libs/<lib-name>`.
3. If the library already exists, `git pull` updates it to the latest commit.
4. Libraries are deduplicated across overlays.

### Serving & Referencing Libraries in HTML

Libraries are served at `/static/libs/<lib-name>/*`. Include them directly in your overlay's `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <!-- Shared CSS from synchronized library -->
  <link rel="stylesheet" href="/static/libs/dethz-lib/styles.css" />
  <link rel="stylesheet" href="./src/style.css" />
</head>
<body>
  <div id="app"></div>

  <!-- Shared JS helpers from synchronized library -->
  <script src="/static/libs/dethz-lib/index.js"></script>
  <script src="./src/app.js"></script>
</body>
</html>
```

---

## ⚡ Connecting to the Real-Time WebSocket

Overlays subscribe to the server's WebSocket hub to receive real-time pub/sub updates.

### JavaScript Client Example

```javascript
// src/app.js

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const socketUrl = `${protocol}//${window.location.host}/ws`;

const socket = new WebSocket(socketUrl);

socket.addEventListener("open", () => {
  console.log("Connected to Stream Overlay Socket hub");
});

socket.addEventListener("message", (event) => {
  const message = event.data;

  // 1. Spotify Queue & Now-Playing Updates
  if (message.startsWith("spt: QUEUE ")) {
    const queueData = JSON.parse(message.replace("spt: QUEUE ", ""));
    updateNowPlaying(queueData);
  }

  // 2. TikTok Live Gifts
  else if (message.startsWith("tt: gift ")) {
    const giftData = JSON.parse(message.replace("tt: gift ", ""));
    triggerGiftAnimation(giftData);
  }

  // 3. Custom Extension Messages (e.g. from /api/extension/twitch)
  else if (message.startsWith("twitch: ")) {
    const twitchEvent = message.replace("twitch: ", "");
    console.log("Custom Twitch event:", twitchEvent);
  }
});

function updateNowPlaying(data) {
  const current = data.currently_playing;
  if (!current) return;

  document.getElementById("track-name").innerText = current.item.name;
  document.getElementById("artist-name").innerText = current.item.artists
    .map((a) => a.name)
    .join(", ");
  document.getElementById("album-art").src = current.item.album.images[0]?.url;
}
```

---

## 🛠 CLI Overlay Management

### 1. List Installed Overlays
```bash
bun run src/index.ts overlay list
# or
bun run overlay:list
```
Displays all detected overlay folders, their `meta.yaml` info, and required libraries.

### 2. Synchronize Libraries
```bash
# Sync libraries for all overlays
bun run src/index.ts overlay sync
# or
bun run overlay:sync

# Sync libraries for a specific overlay only
bun run src/index.ts overlay sync dethz-overlay-horizontal
```

### 3. Install a New Overlay from Git
```bash
bun run src/index.ts overlay install dethz-live-tools/dethz-overlay-vertical
```
This automatically:
- Clones the repository into `static/<repo-name>`.
- Inspects its `meta.yaml`.
- Clones/updates all declared libraries in `static/libs/`.
- Records installation timestamps in `static/overlay.config.json`.

---

## 🎬 OBS Studio Setup Guide

To embed your overlay into OBS Studio, Streamlabs Desktop, or Prism Live:

1. Start the overlay server:
   ```bash
   bun run dev
   # or
   bun run serve
   ```
2. Open OBS Studio.
3. In your active Scene, click **Sources (+)** → **Browser**.
4. Configure source properties:
   - **URL**: `http://localhost:3000/static/<your-overlay-name>/` (or `http://127.0.0.1:3000/static/<your-overlay-name>/index.html`)
   - **Width**: `1920` (or your stream canvas width)
   - **Height**: `1080` (or canvas height)
   - **Shutdown source when not visible**: Checked (recommended for performance)
   - **Refresh browser when scene becomes active**: Checked
5. Click **OK**. Your overlay is now live and synchronized!
