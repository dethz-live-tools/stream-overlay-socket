# stream-overlay-socket · server

A lightweight **Bun + Hono** WebSocket server that powers the stream overlay control panel. It bridges a browser-based controller with live overlays via a pub/sub WebSocket channel, and integrates with the **Spotify** and **TikTok Live** APIs.

---

## Stack

| Layer          | Tech                                                                          |
| -------------- | ----------------------------------------------------------------------------- |
| Runtime        | [Bun](https://bun.sh)                                                         |
| HTTP / Routing | [Hono](https://hono.dev)                                                      |
| WebSocket      | Bun native WS + Hono adapter                                                  |
| Spotify        | Web API (OAuth 2.0 + PKCE)                                                    |
| TikTok Live    | [tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector) |

---

## Getting Started

### 1. Install dependencies

```sh
bun install
```

### 2. Configure credentials

Copy the config template and fill in your values:

```sh
cp src/modules/config.example.ts src/modules/config.ts
```

Edit `src/modules/config.ts`:

```ts
export const TEST_VALUE = "build success!"; // just a test value ignore it :3

export const SPOTIFY_CLIENT_ID = "your_spotify_client_id";
export const SPOTIFY_CLIENT_SECRET = "your_spotify_client_secret";
export const SPOTIFY_REDIRECT_URI = "http://127.0.0.1:3000/spotify/callback/";
```

> `config.ts` is git-ignored — never commit it.

### 3. Run (dev mode with hot reload)

```sh
bun run dev
```

Server starts at **http://localhost:3000**

---

## Scripts

| Command                | Description                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `bun run dev`          | Start with hot reload                                                                    |
| `bun run build:all`    | Compile self-contained binaries for all platforms                                        |
| `bun run build:box`    | Same as `build:all` but also zips each binary with `public/` and `.env` for distribution |
| `bun run build:binary` | Quick single-target binary (current OS)                                                  |

### Build output (`build/`)

`build:all` produces three standalone executables — no Bun or Node required on the target machine:

```
build/
├── server-linux-x64
├── server-macos-arm64
└── server-windows-x64.exe
```

`build:box` produces the same binaries, each bundled into a `.zip` together with the `public/` assets and `.env`.

---

## Routes

### HTTP

| Method | Path            | Description                              |
| ------ | --------------- | ---------------------------------------- |
| `GET`  | `/`             | Health check — returns `"server loaded"` |
| `GET`  | `/controller/*` | Serves static control panel UI           |
| `GET`  | `/spotify/*`    | Serves static Spotify overlay UI         |
| `GET`  | `/src/*`        | Serves shared static assets              |

### REST API (`/api`)

| Method | Path                          | Description                             |
| ------ | ----------------------------- | --------------------------------------- |
| `GET`  | `/api/spotify/auth?state=<s>` | Redirects to Spotify OAuth consent page |
| `POST` | `/api/spotify/callback`       | Exchanges auth code for an access token |

### WebSocket (`/ws`)

Connect at `ws://localhost:3000/ws`.

All messages are plain text and follow a prefix convention:

#### Spotify (`spt: …`)

| Message                  | Direction       | Description                                                           |
| ------------------------ | --------------- | --------------------------------------------------------------------- |
| `spt: SET TOKEN <json>`  | Client → Server | Authenticate with a Spotify token; starts queue polling (every 2.5 s) |
| `spt: pulling`           | Client → Server | Force-push current queue to all subscribers                           |
| `spt: pull token`        | Client → Server | Broadcast the active token to all subscribers                         |
| `spt: search -- <query>` | Client → Server | Search Spotify; result sent back as `spt: FOUND <json>`               |
| `spt: player -- <cmd>`   | Client → Server | Player controls (play, pause, skip, etc.)                             |
| `spt: QUEUE <json>`      | Server → All    | Published when the queue or currently-playing track changes           |
| `spt: NEW TOKEN <json>`  | Server → Client | Sent after a silent token refresh                                     |
| `spt: heartbeat`         | Server → All    | Emitted each polling cycle                                            |

#### TikTok (`tt: …`) // Not working at this moment!

| Message     | Direction       | Description                                       |
| ----------- | --------------- | ------------------------------------------------- |
| `tt: <cmd>` | Client → Server | TikTok Live commands forwarded to `tiktokHandler` |

#### Other

Any message that doesn't match a prefix is published to the `dethzon:system` topic (broadcast to all connected clients).

---

## Project Structure

```
server/
├── src/
│   ├── index.ts                  # Bun.serve entry point
│   ├── routes/
│   │   ├── index.ts              # Top-level router
│   │   ├── api/
│   │   │   └── spotify/          # Spotify REST endpoints
│   │   ├── ws/
│   │   │   ├── index.ts          # WebSocket upgrade handler
│   │   │   └── modules/
│   │   │       ├── greet.ts      # Connection greeting message
│   │   │       ├── spotify/      # Spotify WS handler + polling logic
│   │   │       └── tiktok/       # TikTok Live WS handler
│   │   └── static/               # Static file serving
│   └── modules/
│       ├── config.example.ts     # Config template (commit this)
│       ├── config.ts             # Your credentials (git-ignored)
│       ├── spotify/              # Spotify OAuth, token refresh, callbacks
│       ├── tiktok/               # TikTok Live connector
│       └── interfaces/           # Shared TypeScript interfaces
├── public/                       # Static assets served at runtime
├── build.ts                      # Cross-platform binary builder
├── build-box.ts                  # Builder + zip packager for distribution
└── package.json
```

---

## Spotify OAuth Flow

1. **Initiate** — call `GET /api/spotify/auth?state=<random>` from the control panel; browser is redirected to Spotify consent.
2. **Callback** — Spotify redirects back; the client POSTs the `code` and `state` to `POST /api/spotify/callback`, which returns a token JSON.
3. **Activate** — the control panel sends `spt: SET TOKEN <json>` over WebSocket; the server starts polling every **2.5 seconds**.
4. **Auto-refresh** — the server transparently refreshes the token when it's within 10 minutes of expiry.
