# stream-overlay-socket

A real-time WebSocket-driven stream overlay system for live broadcasts. The server handles Spotify integration, polling, and message broadcasting; the static server serves the overlay HTML pages that OBS (or any browser source) loads directly.

---

## Architecture

```
stream-overlay-socket/
├── server/          # Bun + Hono WebSocket & REST API server
└── static/          # Express static file server for overlay HTML pages
```

### How it works

1. **`server/`** — The backend. Exposes:
   - `GET /ws` — WebSocket endpoint. All overlays connect here.
   - `GET /api/spotify/auth` — Redirects to Spotify OAuth.
   - `POST /api/spotify/callback` — Exchanges auth code for a token.
   - Static overlay files served from `/public` (via `server/src/routes/static`).

2. **`static/`** — A lightweight Express server that serves the overlay HTML pages (`/landscape`, `/vertical`, etc.). Each overlay page opens a WebSocket connection to the backend server and renders data from incoming messages.

3. **Overlays connect** to the WebSocket server using a base64-encoded host address passed as the `?id=` query parameter.

---

## Features

- **Real-time Spotify now-playing** — Polls the Spotify API every 2.5 seconds and broadcasts queue/track changes to all connected overlays via WebSocket pub/sub.
- **Automatic token refresh** — Refreshes Spotify access tokens proactively (10 minutes before expiry) with silent rotation support.
- **Landscape & vertical layouts** — Two overlay variants (`/landscape`, `/vertical`) with windows for: Main Screen, Webcam, Playlist, Now Playing, Countdown, and Avatar.
- **Pub/sub broadcasting** — All WebSocket clients subscribe to the `dethzon:system` topic; server-side `publish()` fans out to every connected overlay simultaneously.
- **Search & playback control** — Overlays can send `spt: search -- <query>` and `spt: player -- <command>` messages to interact with Spotify playback.

---

## Prerequisites

- [Bun](https://bun.sh) `>= 1.x`
- A [Spotify Developer App](https://developer.spotify.com/dashboard) with the redirect URI set to `http://127.0.0.1:3000/spotify/callback/`

---

## Setup

### 1. Clone and install

```bash
# Install server dependencies
cd server
bun install

# Install static server dependencies
cd ../static
bun install
```

### 2. Configure environment variables

**`server/.env`**

```env
PORT=3000
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

**`static/.env`**

```env
PORT=4000
```

### 3. Start both servers

In separate terminals:

```bash
# Terminal 1 — WebSocket + API server
cd server
bun run dev
# → http://localhost:3000

# Terminal 2 — Overlay static server
cd static
bun run dev
# → http://localhost:4000
```

---

## Spotify Authentication Flow

1. Open `http://localhost:3000/api/spotify/auth?state=<your-state>` in a browser.
2. Authorize the app on Spotify.
3. The server exchanges the code for an access + refresh token pair via `POST /api/spotify/callback`.
4. Send `spt: SET TOKEN <json>` over the WebSocket to start the polling session for that connection.

**Required Spotify scopes:**

- `user-read-private`
- `user-read-email`
- `user-read-playback-state`
- `user-read-currently-playing`
- `user-modify-playback-state`

---

## WebSocket Protocol

Connect to: `ws://<server-host>/ws`

### Commands (client → server)

| Message                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `spt: SET TOKEN <json>`    | Register a Spotify token and start polling     |
| `spt: pulling`             | Request the latest cached queue data           |
| `spt: pull token`          | Broadcast the current token to all subscribers |
| `spt: search -- <query>`   | Search Spotify for tracks                      |
| `spt: player -- <command>` | Send a playback control command                |
| `<anything else>`          | Broadcast raw message to all subscribers       |

### Events (server → client)

| Message                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `spt: QUEUE <json>`         | Current Spotify queue + now-playing data |
| `spt: NEW TOKEN <json>`     | Rotated/refreshed access token           |
| `spt: CURRENT TOKEN <json>` | Currently active token                   |
| `spt: FOUND <json>`         | Search results                           |
| `spt: heartbeat`            | Polling keepalive (emitted every 2.5 s)  |
| `error: <reason>`           | Error message                            |

---

## Overlay Pages

Load these in OBS as browser sources (served by the `static/` server):

| Path         | Description                                                                          |
| ------------ | ------------------------------------------------------------------------------------ |
| `/landscape` | Landscape overlay — Screen, Webcam, Playlist, Now Playing, Countdown, Avatar windows |
| `/vertical`  | Vertical overlay — same windows in a portrait layout                                 |

**URL format:**

```
http://localhost:4000/landscape?id=<base64(server-host:port)>
```

Example — if the server runs on `localhost:3000`:

```
http://localhost:4000/landscape?id=bG9jYWxob3N0OjMwMDA=
```

---

## Production Build

The server can be compiled to a self-contained binary:

```bash
cd server
bun run build:binary
./server
```

---

## Tech Stack

| Layer            | Technology                            |
| ---------------- | ------------------------------------- |
| Runtime          | [Bun](https://bun.sh)                 |
| Server framework | [Hono](https://hono.dev)              |
| WebSockets       | Bun native (`Bun.serve` + `hono/bun`) |
| Static server    | HTML CSS JS                           |
| Language         | TypeScript                            |
| External API     | Spotify Web API                       |
