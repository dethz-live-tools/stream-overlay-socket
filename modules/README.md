# API Expansion Modules Slot

This directory (`./modules`) is an **expansion slot** for installing and loading modular API extensions into the Stream Overlay Socket server.

---

## ⚡ Quick Start

### 1. Scaffold a New Module
```bash
bun run src/index.ts module create <module-name>
# or
bun run module:create <module-name>
```
This generates a starter template in `modules/<module-name>/extensions.json` and `modules/<module-name>/index.ts`.

### 2. List Installed Modules
```bash
bun run src/index.ts module list
# or
bun run module:list
```

### 3. Inspect a Module
```bash
bun run src/index.ts module info <module-name>
```

---

## 🛠 Anatomy of an API Module

Modules follow a function-per-file pattern for maintainability:

```
modules/<module-name>/
├── extensions.json # Module metadata & route configuration
├── meta.ts         # Metadata loader and configuration helpers
├── router.ts       # Hono routes and endpoint handlers
├── ws.ts           # WebSocket message handler
├── lifecycle.ts    # onInit and onDestroy lifecycle hooks
└── index.ts        # Module composer and default export
```

### 1. `extensions.json`
```json
{
  "name": "sample",
  "version": "1.0.0",
  "description": "Expansion API module for sample",
  "author": "Streamer",
  "tags": ["custom", "overlay"],
  "routePath": "/sample",
  "wsPrefix": "sample: ",
  "enabled": true
}
```

### 2. `index.ts`
Composes the modular functions:
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

### 3. `router.ts`
Registers HTTP routes:
```typescript
import { Hono } from "hono";
import type { ExpansionContext } from "../../src/modules/expansion";
import { meta } from "./meta";

export function registerRoutes(router: Hono, context: ExpansionContext): void {
  router.get("/", (c) => c.json({ status: "active", module: meta.name }));
  router.post("/trigger", async (c) => {
    const data = await c.req.json().catch(() => ({}));
    context.broadcast(JSON.stringify({ event: `${meta.name}:trigger`, data }));
    return c.json({ success: true, broadcasted: true });
  });
}
```

### 4. `ws.ts`
Handles WebSocket messages matching `wsPrefix`:
```typescript
import type { ServerWebSocket } from "bun";
import type { ExpansionContext } from "../../src/modules/expansion";
import { meta } from "./meta";

export function handleWsMessage(msg: string, ws: ServerWebSocket, context: ExpansionContext): boolean {
  console.log(`[${meta.name}] Received:`, msg);
  return true; // Return true to consume message
}
```

### 5. `lifecycle.ts`
Manages setup and teardown:
```typescript
import type { ExpansionContext } from "../../src/modules/expansion";
import { meta } from "./meta";

export function onInit(context: ExpansionContext): void {
  console.log(`[${meta.name}] Initialized!`);
}

export function onDestroy(): void {
  console.log(`[${meta.name}] Destroyed!`);
}
```

---

## 🌐 Endpoints Provided by Expansion Slot

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/extension` | List all active expansion modules and routes |
| `GET` | `/api/extension/info/:name` | Inspect details for a specific module |
| `POST` | `/api/extension/reload` | Reload modules dynamically without restart |
| `ANY` | `/api/extension/<module>/*` | Access routes defined by installed modules |

---

## 📡 WebSocket Integration

Modules can:
1. **Broadcast to Overlays**: Call `context.broadcast(message)` to send any payload over `dethzon:system` to all connected overlay browsers.
2. **Handle Incoming WebSocket Messages**: Define `wsPrefix: "prefix: "` and `onWsMessage(msg, ws, context)` to intercept messages before default pub/sub.

---

## ⚙️ Accessing Server Configuration (`config.json` & `config.ts`)

Outside modules can access global server credentials and custom module settings from root `config.json`:

```json
{
  "TEST_VALUE": "build success!",
  "SPOTIFY_CLIENT_ID": "...",
  "expansion": {
    "simple-donate-expansion": {
      "SIMPLE_DONATE_URI": "https://moon.localhost"
    }
  }
}
```

### Methods:
- **Via `context.config`**: Available directly in `registerRoutes(router, context)`, `onWsMessage(msg, ws, context)`, and `onInit(context)`. Automatically includes custom variables configured under `expansion[<folder-name>]`.
- **Via `getModuleConfig`**:
  ```typescript
  import { getModuleConfig } from "../../src/modules/expansion";
  const moduleConfig = getModuleConfig("simple-donate", import.meta.dir);
  console.log(moduleConfig.SIMPLE_DONATE_URI);
  ```
  Merges root `config.json`, module local `config.json`, and `config.expansion[folderName]`. Folder name is automatically resolved from `./modules/` using directory ancestry or `extensions.json` `name`.
- **Via Module Factory Export**: `export default defineApiModule((config, context) => ({ ... }))`.
- **Via Direct Import**: `import { config } from "../../src/modules/expansion";`.

### 🖥 Web Configuration UI (`/config`)
Streamers can visually edit and add module variables at `http://localhost:3000/config`:
1. Scans and lists all folder names in `./modules/`.
2. Shows key-value tables for custom variables under `"expansion": { "<module-folder>": { ... } }`.
3. Allows adding and removing variables without manual JSON edits.
4. Hot-reloads modules automatically on save.


