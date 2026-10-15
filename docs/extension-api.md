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

This creates a starter module at `modules/twitch/extensions.json` and `modules/twitch/index.ts`.

### 2. Module Directory Structure

```
modules/
└── twitch/
    ├── extensions.json # Module metadata & route configuration
    ├── meta.ts         # Metadata loader and configuration helpers
    ├── router.ts       # Hono routes and endpoint handlers
    ├── ws.ts           # WebSocket message handler
    ├── lifecycle.ts    # onInit and onDestroy lifecycle hooks
    └── index.ts        # Module composer and default export
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

Modules follow a function-per-file structure separating routes, WebSocket message handlers, and lifecycle hooks:

### 1. `extensions.json`
```json
{
  "name": "twitch",
  "version": "1.0.0",
  "description": "Twitch webhook and chat events integration",
  "author": "StreamerName",
  "tags": ["twitch", "chat", "webhooks"],
  "routePath": "/twitch",
  "wsPrefix": "twitch: ",
  "enabled": true
}
```

### 2. `meta.ts`
```typescript
import fs from "node:fs";
import path from "node:path";
import type { ApiModuleMeta } from "../../src/modules/expansion";

export interface ExtensionConfig extends ApiModuleMeta {
  routePath?: string;
  wsPrefix?: string;
}

export function loadMeta(dir: string = import.meta.dir): ExtensionConfig {
  const metaPath = path.resolve(dir, "extensions.json");
  if (!fs.existsSync(metaPath)) {
    throw new Error(`[twitch] Missing required metadata file: ${metaPath}`);
  }
  return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
}

export const meta = loadMeta();
```

### 3. `router.ts`
```typescript
import { Hono } from "hono";
import type { ExpansionContext } from "../../src/modules/expansion";
import { meta } from "./meta";

export function registerRoutes(router: Hono, context: ExpansionContext): void {
  // GET /api/extension/twitch
  router.get("/", (c) => {
    return c.json({
      module: meta.name,
      status: "active",
      version: context.serverVersion,
    });
  });

  // POST /api/extension/twitch/webhook
  router.post("/webhook", async (c) => {
    const payload = await c.req.json();
    context.broadcast(`twitch: event ${JSON.stringify(payload)}`);
    return c.json({ received: true });
  });
}
```

### 4. `ws.ts`
```typescript
import type { ServerWebSocket } from "bun";
import type { ExpansionContext } from "../../src/modules/expansion";
import { meta } from "./meta";

export function handleWsMessage(
  msg: string,
  ws: ServerWebSocket,
  context: ExpansionContext,
): boolean {
  const command = msg.replace(/^twitch:\s*/, "");
  if (command.startsWith("status")) {
    ws.send("twitch: status OK");
    return true; // Mark as handled
  }
  return false;
}
```

### 5. `lifecycle.ts`
```typescript
import type { ExpansionContext } from "../../src/modules/expansion";
import { meta } from "./meta";

export function onInit(context: ExpansionContext): void {
  console.log(`[${meta.name}] Initialized on server v${context.serverVersion}`);
}

export function onDestroy(): void {
  console.log(`[${meta.name}] Destroyed`);
}
```

### 6. `index.ts`
Composes the module definitions into a single [`defineApiModule`](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/src/modules/expansion/define.ts) export:

```typescript
import { defineApiModule } from "../../src/modules/expansion";
import { meta } from "./meta";
import { registerRoutes } from "./router";
import { handleWsMessage } from "./ws";
import { onInit, onDestroy } from "./lifecycle";

export default defineApiModule({
  meta,
  routePath: meta.routePath,
  wsPrefix: meta.wsPrefix,
  router: registerRoutes,
  onWsMessage: handleWsMessage,
  onInit,
  onDestroy,
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
| `config` | `Record<string, any>` | Global server configuration loaded from root `config.json` (via `src/modules/config.ts`). |
| `getModule` | `(name: string) => ApiModule \| undefined` | Look up another loaded module to call inter-module functions. |
| `listModules` | `() => ApiModuleMeta[]` | Returns an array of all loaded module metadata objects. |

### Accessing Server Configuration (`config.json` & `src/modules/config.ts`)

Outside modules can access global server credentials and custom module settings stored in root `config.json`:

```json
{
  "TEST_VALUE": "build success!",
  "SPOTIFY_CLIENT_ID": "8f9c0...",
  "SPOTIFY_CLIENT_SECRET": "2ec51...",
  "SPOTIFY_REDIRECT_URI": "http://localhost:3000/spotify/callback/",
  "expansion": {
    "simple-donate-expansion": {
      "SIMPLE_DONATE_URI": "https://moon.localhost"
    },
    "my-module": {
      "WEBHOOK_SECRET": "xyz123"
    }
  }
}
```

#### Resolution and Precedence:
When [`getModuleConfig(modName, sourceOrDir)`](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/src/modules/expansion/slot.ts#L136-L224) runs:
1. Locates the module folder in `./modules/` via [`findModuleFolder`](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/src/modules/expansion/slot.ts#L42-L80) using file path ancestry or `extensions.json` metadata name matching (e.g. maps module `simple-donate` to folder `simple-donate-expansion`).
2. Loads root `config.json`.
3. Reads module local `config.json` in the module directory if present.
4. Reads custom variables from `config.json` under `"expansion": { "<folder-name>": { ... } }` and `"expansion": { "<mod-name>": { ... } }`.
5. Merges variables so `expansion` custom variables override defaults.

#### Ways to Access Config:

1. **Via `context.config`**:
   Available directly inside `registerRoutes(router, context)`, `handleWsMessage(msg, ws, context)`, and `onInit(context)`:
   ```typescript
   export function registerRoutes(router: Hono, context: ExpansionContext): void {
     const testVal = context.config?.TEST_VALUE;
     const moduleUri = context.config?.SIMPLE_DONATE_URI;
   }
   ```

2. **Via `getModuleConfig`**:
   Automatically merges global `config.json`, module folder `expansion` variables, and local module `config.json`:
   ```typescript
   import { getModuleConfig } from "../../src/modules/expansion";
   const moduleConfig = getModuleConfig("simple-donate", import.meta.dir);
   console.log(moduleConfig.SIMPLE_DONATE_URI);
   ```

3. **Via Module Factory Function**:
   An outside module can export a factory function taking `(config, context)`:
   ```typescript
   export default defineApiModule((config, context) => ({
     meta,
     routePath: meta.routePath,
     router: registerRoutes,
   }));
   ```

4. **Via Direct Import**:
   ```typescript
   import { config } from "../../src/modules/expansion";
   ```

#### Managing Variables via Web UI (`/config`)
Streamers can manage custom module variables in real-time at `http://localhost:3000/config`:
- Discovers installed folders in `./modules/` automatically.
- Displays custom key-value tables per module.
- Adds or removes variables without manually formatting JSON.
- Saves changes directly to `config.json` and hot-reloads running modules.


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
