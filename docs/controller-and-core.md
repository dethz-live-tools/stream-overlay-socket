# Controller & Socket Core Guide

The `core/` directory contains the browser-based control dashboard, Spotify authentication views, shared frontend UI components, and socket client libraries.

---

## 🎛 The Stream Controller Dashboard

The primary user interface for streamers is hosted at:
```
http://localhost:3000/controller
```

### Key Capabilities

1. **Real-Time WebSocket Link**:
   - Automatic connection to `ws://<host>/ws`.
   - Live visual status badge (🟢 Online / 🔴 Offline) with automatic reconnection.

2. **Spotify Management**:
   - Initiates OAuth 2.0 PKCE / server callback authentication.
   - Live now-playing visualizer with album art, artist credits, playback progress, and volume.
   - Playback controls: Play/Pause, Next Track, Previous Track, Volume adjustments.
   - Queue inspector displaying upcoming 10 tracks with live refresh buttons.
   - Instant track search (`spt: search -- <query>`) and enqueueing.

3. **TikTok Live Stream Management**:
   - Connects to public TikTok Live streams via streamer username.
   - Live chat feed with viewer avatars, badges, and roles.
   - Aggregated gift feed suppressing intermediate combo streak spam.

4. **Event Console & Diagnostics**:
   - Live event log showing timestamps, success messages, and error states.
   - UI preferences (panel collapse states) persist locally via `localStorage`.

---

## 🔄 Core Versioning & Automated Updates

The `core` client is independently versioned from the socket server engine, allowing UI updates to be deployed from GitHub without requiring a full server recompile.

### Version Detection Order
The server inspects core version from:
1. `core/.version`
2. `core/VERSION`
3. `core/package.json` (`version` field)

### Upstream GitHub Repository
- **Core Repository**: `dethz-live-tools/dethz-socket-core`

### Automatic Recovery
If the server boots and finds the `./core` directory missing or empty, `downloadAndExtractCore()` runs automatically to fetch and extract the latest release archive.

---

## 🛠 Managing Updates via CLI

```bash
# Check currently installed core version
bun run src/index.ts update version

# Query GitHub for available updates
bun run src/index.ts update check

# Download and extract the latest core release into ./core
bun run src/index.ts update download
```

---

## 🌐 Managing Updates via REST API

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/update/version` | Returns currently installed core version. |
| `GET` | `/api/update/check` | Queries GitHub API and compares installed version against latest release. |
| `POST` | `/api/update/download` | Downloads latest release zip and extracts it into `./core`. |

### Example Response: `/api/update/check`
```json
{
  "hasUpdate": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.1.0",
  "zipUrl": "https://github.com/dethz-live-tools/dethz-socket-core/archive/refs/tags/v1.1.0.zip",
  "releaseUrl": "https://github.com/dethz-live-tools/dethz-socket-core/releases/tag/v1.1.0"
}
```
