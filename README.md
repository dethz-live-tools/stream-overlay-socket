# stream-overlay-socket

Bun + Hono WebSocket server for stream overlay control. Bridges a browser controller with live overlays via pub/sub WebSocket, with Spotify and TikTok Live integrations.

## Setup

```sh
bun install
cp .env.example .env   # set PORT (default 3000)
bun run dev            # hot reload at http://localhost:3000
```

Spotify credentials live in `src/modules/config.ts` (copied from `config.example.ts`, git-ignored).

## Scripts

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `bun run dev`          | Dev server with hot reload                        |
| `bun run build:all`    | Binaries for linux-x64, macos-arm64, windows-x64  |
| `bun run build:box`    | Same + zips each binary with `public/` and `.env` |
| `bun run build:binary` | Quick single binary for current OS                |

## Routes

| Method | Path                    | Description                  |
| ------ | ----------------------- | ---------------------------- |
| `GET`  | `/`                     | Health check                 |
| `GET`  | `/controller/*`         | Control panel UI             |
| `GET`  | `/spotify/*`            | Spotify overlay UI           |
| `GET`  | `/api/spotify/auth`     | Redirect to Spotify OAuth    |
| `POST` | `/api/spotify/callback` | Exchange auth code for token |
| `WS`   | `/ws`                   | WebSocket endpoint           |

## WebSocket Protocol

All messages are plain text with a prefix.

**Spotify (`spt: …`)**

| Message                  | Direction       | Description                              |
| ------------------------ | --------------- | ---------------------------------------- |
| `spt: SET TOKEN <json>`  | → server        | Authenticate; starts 2.5 s queue polling |
| `spt: pulling`           | → server        | Force-push current queue to all clients  |
| `spt: pull token`        | → server        | Broadcast active token to all clients    |
| `spt: search -- <query>` | → server        | Search; replies with `spt: FOUND <json>` |
| `spt: player -- <cmd>`   | → server        | Player controls (play/pause/skip…)       |
| `spt: QUEUE <json>`      | server → all    | Queue/now-playing update                 |
| `spt: NEW TOKEN <json>`  | server → client | After silent token refresh               |
| `spt: heartbeat`         | server → all    | Each polling cycle                       |

**TikTok (`tt: …`)** — not working currently.

Any unrecognised message is broadcast to all clients via the `dethzon:system` topic.

## Spotify OAuth Flow

1. `GET /api/spotify/auth?state=<random>` → browser redirects to Spotify consent
2. Spotify redirects back → client POSTs code to `POST /api/spotify/callback` → gets token JSON
3. Client sends `spt: SET TOKEN <json>` over WS → server starts polling
4. Server auto-refreshes token when within 10 min of expiry
