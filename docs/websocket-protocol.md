# WebSocket Protocol Reference

All real-time communication between the browser controller, OBS overlays, and expansion modules flows through the WebSocket hub located at:
```
ws://<host>:<port>/ws
```

---

## 🔌 Connection & Handshake

1. **Connection URL**: `ws://localhost:3000/ws`
2. **Auto-Subscription**: On connection, the client is automatically subscribed to the system topic:
   ```
   dethzon:system
   ```
3. **Greeting**: The server immediately sends an initial greeting:
   ```text
   server: hello from server!
   ```

---

## 🎵 Spotify Protocol (`spt: …`)

### Client → Server Commands

| Command | Payload Example | Description |
| :--- | :--- | :--- |
| `spt: SET TOKEN <json>` | `spt: SET TOKEN {"access_token":"...","expires_in":3600,...}` | Authenticates session with Spotify credentials. Starts a background 2.5-second polling loop. |
| `spt: pulling` | `spt: pulling` | Manually requests an immediate fetch and broadcast of the current player state and queue. |
| `spt: pull token` | `spt: pull token` | Requests active token broadcast to synchronize newly connected overlays. |
| `spt: search -- <query>` | `spt: search -- Bohemian Rhapsody` | Searches Spotify catalog for matching tracks. |
| `spt: player -- <cmd>` | `spt: player -- play` | Dispatches playback control action to Spotify Web API. Supported: `play`, `pause`, `next`, `previous`, `volume_up`, `volume_down`. |

### Server → Client Broadcasts

| Event | Direction | Description |
| :--- | :--- | :--- |
| `spt: QUEUE <json>` | Server → All | Broadcast on each polling cycle if playback state or track queue changes. Contains current track, artist, album art, device, and queued songs. |
| `spt: FOUND <json>` | Server → Sender | Response to `spt: search -- <query>` with list of matching track objects. |
| `spt: NEW TOKEN <json>` | Server → All | Broadcast when background worker automatically refreshes an expiring access token. |
| `spt: heartbeat` | Server → All | Periodic heartbeat ping sent every polling cycle. |

---

## 💬 TikTok Live Protocol (`tt: …`)

### Client → Server Commands

| Command | Example | Description |
| :--- | :--- | :--- |
| `tt: connect to <username>` | `tt: connect to streamer_user` | Connects server to the streamer's public TikTok Live room. |
| `tt: disconnect` | `tt: disconnect` | Terminates active TikTok Live connection. |

### Server → Client Events

| Event | Example Payload | Description |
| :--- | :--- | :--- |
| `tt: connected` | `tt: connected` | Confirms successful connection to TikTok Webcast room. |
| `tt: disconnected` | `tt: disconnected` | Confirms connection termination. |
| `tt: chat <json>` | `tt: chat {"userId":"...","comment":"Hello!"}` | Live viewer chat message containing username, badges, and comment text. |
| `tt: gift <json>` | `tt: gift {"giftName":"Rose","diamondCount":1,"repeatCount":50}` | Live gift event sent at combo conclusion, deduplicated across network bursts. |

---

## 🧩 Extension Modules Protocol

Custom expansion modules can define custom message prefixes using `wsPrefix`:

```typescript
wsPrefix: "myext: "
```

### Inbound Routing
1. A client sends:
   ```text
   myext: triggerAlert {"type":"fireworks"}
   ```
2. The server passes the string to the module's `onWsMessage(msg, ws, context)` handler.
3. If the handler returns `true`, message processing stops (handled).
4. If the handler returns `false` or `void`, the message falls through to the system topic broadcast.

### Outbound Broadcasting
Modules can broadcast messages at any time using `context.broadcast()`:
```typescript
context.broadcast("myext: updateState active");
```
All clients subscribed to `dethzon:system` receive this message.

---

## 📋 System Logs & Diagnostic Messages

The server emits system event logs prefixed with `log:`:

- **Success**: `log: success -- Connected to tiktok-live on room ID 12345`
- **Error**: `log: error -- Failed to connect`
- **Generic fallback**: Any unhandled message without a recognized prefix is broadcast verbatim to all clients on `dethzon:system`.
