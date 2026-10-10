# API Extension System Guide

The **Expansion Slot** engine allows third-party features, custom webhook receivers, hardware integrations, or streamer widgets to be plugged into the Stream Overlay Socket server without modifying core source code.

All expansion modules live in `./modules/<module-name>/` and automatically register HTTP endpoints under:
```
/api/extension/<module-name>/*
```

---

## 🌟 Key Concepts

1. **Self-Contained Modules**: Each folder in `./modules/` represents an isolated module containing an `index.ts` entrypoint.
2. **Auto-Discovery on Startup**: When `startServer()` executes, `expansionSlot.loadFromDirectory("modules")` dynamically imports all enabled modules.
3. **Unified Routing**: Module endpoints mount dynamically through the master extension router at `/api/extension/<name>`.
4. **WebSocket Pub/Sub Bridge**: Modules can intercept or broadcast messages through the server's WebSocket pub/sub bus using prefix filtering.
5. **Hot Reloading**: Modules can be reloaded at runtime without restarting the process via `POST /api/extension/reload`.

---

## 🚀 Quick Start

### 1. Scaffold a New Module

Use the CLI scaffolding command:
```bash
# Via bun run directly
bun run src/index.ts module create twitch

# Or via npm script
bun run module:create twitch
```

This creates a starter module at `modules/twitch/index.ts`.

### 2. Module Directory Structure

```
modules/
└── twitch/
    ├── index.ts        # Module entrypoint (exports default defineApiModule)
    ├── package.json    # Optional local metadata
    └── helpers.ts      # Optional helper utilities
```

### 3. List Installed Modules

```bash
bun run src/index.ts module list
# or
bun run module:list
```

### 4. Inspect Module Metadata

```bash
bun run src/index.ts module info twitch
```

---

## 🛠 Anatomy of an Extension Module

An extension module must provide a default export using [`defineApiModule`](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/src/modules/expansion/define.ts):

```typescript
import { Hono } from "hono";
import { defineApiModule } from "../../src/modules/expansion";

export default defineApiModule({
  // 1. Module Metadata
  meta: {
    name: "twitch",
    version: "1.0.0",
    description: "Twitch webhook and chat events integration",
    author: "StreamerName",
    tags: ["twitch", "chat", "webhooks"],
    enabled: true, // Set to false to disable loading
  },

  // 2. HTTP Sub-route (Defaults to "/<name>")
  // Mounted at: /api/extension/twitch
  routePath: "/twitch",

  // 3. WebSocket message filter
  // Intercepts messages starting with "twitch: "
  wsPrefix: "twitch: ",

  // 4. HTTP Router Configuration (Hono)
  router: (router: Hono, context) => {
    // GET /api/extension/twitch
    router.get("/", (c) => {
      return c.json({
        module: "twitch",
        status: "active",
        version: context.serverVersion,
      });
    });

    // POST /api/extension/twitch/webhook
    router.post("/webhook", async (c) => {
      const payload = await c.req.json();
      
      // Broadcast update to all overlay WebSocket clients
      context.broadcast(`twitch: event ${JSON.stringify(payload)}`);
      
      return c.json({ received: true });
    });
  },

  // 5. WebSocket Inbound Message Handler
  onWsMessage: async (msg, ws, context) => {
    // msg contains full string starting with "twitch: "
    const command = msg.replace(/^twitch:\s*/, "");

    if (command.startsWith("status")) {
      ws.send("twitch: status OK");
      return true; // Return true to mark as handled (prevents pub/sub echo)
    }

    return false; // Return false to broadcast to systemTopic
  },

  // 6. Lifecycle Hooks
  onInit: async (context) => {
    console.log(`[TwitchModule] Initialized on server v${context.serverVersion}`);
  },

  onDestroy: async () => {
    console.log("[TwitchModule] Destroyed/Reloaded");
  },
});
```

---

## 🌐 HTTP Endpoint Routing

### Extension Slot System Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/extension` | List all installed and active extension modules. |
| `GET` | `/api/extension/list` | Alias for listing active modules. |
| `GET` | `/api/extension/info/:name` | Retrieve detailed metadata for a specific module. |
| `POST` | `/api/extension/reload` | Re-scan the `./modules` directory and hot-reload all modules. |

### Module Endpoints

Any subpaths defined inside your module's Hono router are automatically accessible under:
```
/api/extension/<module-name>/<subpath>
```

#### Example:
If module `obs` defines:
```typescript
router.get("/scene", (c) => c.text("BRB"));
router.post("/transition", (c) => c.json({ switched: true }));
```

Clients access:
- `GET http://localhost:3000/api/extension/obs/scene`
- `POST http://localhost:3000/api/extension/obs/transition`

*(Note: For backward compatibility, `/api/modules/<name>` is also routed to `/api/extension/<name>`)*.

---

## 📡 WebSocket Pub/Sub Integration

Expansion modules can hook directly into the real-time WebSocket server (`ws://<host>/ws`).

### 1. Prefix Filtering (`wsPrefix`)
Specify a single prefix string or array of prefixes:
```typescript
wsPrefix: ["obs: ", "scene: "]
```
When an incoming message starts with any configured prefix, the server forwards the raw message to your module's `onWsMessage` handler.

### 2. Message Handling (`onWsMessage`)
```typescript
onWsMessage: (msg, ws, context) => {
  if (msg.startsWith("obs: setScene ")) {
    const scene = msg.replace("obs: setScene ", "");
    // Notify all other clients
    context.broadcast(`obs: activeScene ${scene}`);
    return true; // Consume message
  }
  return false; // Let server broadcast to dethzon:system topic
}
```

### 3. Broadcasting to Connected Overlays
Use `context.broadcast(payload)` to send messages to all clients subscribed to the `dethzon:system` topic:
```typescript
context.broadcast("obs: alert New follower joined!");
```

---

## 🧰 The `ExpansionContext` API

When routes and lifecycle hooks run, the engine supplies an `ExpansionContext` object:

| Property | Type | Description |
| :--- | :--- | :--- |
| `broadcast` | `(message: string) => boolean` | Broadcasts message to all connected clients on `systemTopic`. |
| `systemTopic` | `string` | The default pub/sub topic identifier (`dethzon:system`). |
| `serverVersion` | `string` | Currently running server semantic version. |
| `getModule` | `(name: string) => ApiModule \| undefined` | Look up another loaded module to call inter-module functions. |
| `listModules` | `() => ApiModuleMeta[]` | Returns an array of all loaded module metadata objects. |

---

## 🔄 Dynamic Reloading Workflow

You can modify an extension file in `./modules/<module-name>/index.ts` while the server is running. To reload without restarting the server:

```bash
curl -X POST http://localhost:3000/api/extension/reload
```

Response:
```json
{
  "success": true,
  "loadedCount": 2,
  "totalActive": 2
}
```
Existing module `onDestroy` hooks fire before new modules initialize, ensuring clean teardown of timers, sockets, or open resources.
