# stream-overlay-socket

Bun + Hono WebSocket server for stream overlay control. Bridges a browser controller with live overlays via pub/sub WebSocket, with Spotify and TikTok Live integrations, static overlay hosting, and automated Git library synchronization.

## Setup

```sh
bun install
cp .env.example .env   # set PORT (default 3000)
bun run dev            # hot reload at http://localhost:3000
```

## Development & Rules

- **Use Bun**: Always use Bun as the runtime and package manager (`bun <file>`, `bun run <script>`, `bun test`, `bun install`, `bun build`). Do not use Node.js, npm, pnpm, yarn, or vite (see `.agent/rules/use-bun.md`).
- **Submodules Protection**: Agents must not edit files inside Git submodules or external checkouts (see `.agent/rules/keep-submodules.md`).
- **Formatting**: 2-space indentation with spaces enforced (see `.vscode/settings.json`).
- **Credentials**: Spotify credentials live in `src/modules/config.ts` (copied from `config.example.ts`, git-ignored).
- **Rule Syncing with `dethz-crawler`**: AI agent rules in `.agent/rules/` are git-ignored and synchronized from GitHub via [dethz-crawler](https://github.com/dethMastery/dethz-crawler) using `.agentrc.json` (source: `kizuna-inc/kz-rule`).
  ```sh
  # Sync / re-pull installed agent rules
  bun run rules:sync
  # or directly
  bunx dethz-crawler sync
  ```
  Synchronized rules:
  - `keep-submodules`: Protects Git submodule files from unintended edits.
  - `use-bun`: Enforces Bun APIs, runtime, and shell tools.
  - `release-note`: Formats release documentation and notes.
  - `version-bump`: Semantic version bumping workflow.

## Documentation

Comprehensive guides and technical documentation are available in the [`docs/`](docs/README.md) directory:

- [**System Architecture & Flow**](docs/architecture.md) — Boot sequence, routing pipeline, and runtime layout.
- [**API Extension Guide**](docs/extension-api.md) — Building and mounting modular plugins under `/api/extension/<module>`.
- [**Overlay Authoring Guide**](docs/overlay-guide.md) — Building overlays, `meta.yaml` specification, Git libraries, and OBS setup.
- [**WebSocket Protocol Reference**](docs/websocket-protocol.md) — Real-time messaging specification for Spotify, TikTok, and modules.
- [**Controller & Socket Core**](docs/controller-and-core.md) — Web controller dashboard and automated core update mechanism.
- [**CLI Command Reference**](docs/cli-reference.md) — Complete command-line manual and packaging instructions.

## Scripts

| Command                 | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `bun run dev`           | Start dev server with hot reload                            |
| `bun run serve`         | Start overlay server via CLI command                        |
| `bun run cli`           | Run CLI root dispatcher                                     |
| `bun run overlay:list`  | List all installed overlays and their metadata/libs         |
| `bun run overlay:sync`  | Sync and pull/clone libraries declared in `meta.yaml`       |
| `bun run module:list`   | List all installed expansion modules                        |
| `bun run module:create` | Scaffold a new expansion module in `./modules/<name>`       |
| `bun run update:check`  | Check GitHub for socket core updates                        |
| `bun run update:core`   | Download and extract socket core update                     |
| `bun run rules:sync`    | Sync AI agent rules from GitHub with `dethz-crawler`        |
| `bun test`              | Run test suites with Bun's native test runner               |
| `bun run build:all`     | Compile binaries for linux-x64, macos-arm64, windows-x64    |
| `bun run build:box`     | Same + pack each binary with static assets and `.env` (zip) |
| `bun run build:binary`  | Compile single binary for current OS                        |

## CLI Commands

The server includes a unified CLI dispatcher that can be invoked via `bun run src/index.ts <command>` or via the compiled binary `./server <command>`:

### 1. Server (`serve`)
```sh
# Start server (default: port 3000)
bun run src/index.ts serve

# Start server on custom port and host
bun run src/index.ts serve -p 8080 -h 0.0.0.0

# Start server and auto-sync overlay libraries before boot
bun run src/index.ts serve --sync-libs
```

### 2. Overlays & Libraries (`overlay`)
```sh
# List all installed overlays and dependencies
bun run src/index.ts overlay list

# Sync libraries for all overlays in static/
bun run src/index.ts overlay sync

# Sync libraries for a specific overlay
bun run src/index.ts overlay sync dethz-overlay-horizontal

# Install an overlay from Git and automatically clone its libraries
bun run src/index.ts overlay install dethz-live-tools/dethz-overlay-horizontal
```

### 3. API Expansion Modules (`module`)
```sh
# List installed expansion modules
bun run src/index.ts module list

# Scaffold a new module template in modules/<name>
bun run src/index.ts module create <module-name>

# Inspect details of an expansion module
bun run src/index.ts module info <module-name>
```

### 4. Core Updates (`update`)
```sh
# Show currently installed core version
bun run src/index.ts update version

# Check GitHub releases for available core updates
bun run src/index.ts update check

# Download and extract latest core archive into ./core
bun run src/index.ts update download
```

## Overlays & `meta.yaml` Specification

Each static overlay lives inside `static/<overlay-name>/` and can define a `meta.yaml` (or `meta.yml`):

```yaml
name: "deth'z overlay horizontal"
description: "just another simple overlay on deth'z live stream"
image: "src/background.png"
author: "dethMastery"
libs:
  - dethz-live-tools/dethz-lib
```

When `overlay sync` or `overlay install` runs:
1. `libs` entries are parsed (supports `owner/repo` shorthand, HTTPS git URLs, and SSH URLs).
2. The library is cloned into `static/libs/<lib-name>` or updated via `git pull` if already present.
3. Libraries are deduplicated across overlays and served under `/static/libs/<lib-name>`.
4. Detailed documentation is in [`docs/overlay-guide.md`](docs/overlay-guide.md).

## Routes

| Method | Path                        | Description                                |
| ------ | --------------------------- | ------------------------------------------ |
| `GET`  | `/`                         | Health check                               |
| `GET`  | `/static`                   | Visual directory listing of all overlays   |
| `GET`  | `/static/*`                 | Static overlay files and shared libraries  |
| `GET`  | `/controller/*`             | Control panel UI                           |
| `GET`  | `/spotify/*`                | Spotify overlay UI                         |
| `GET`  | `/core/*`                   | Core assets and modules                    |
| `GET`  | `/api/spotify/auth`         | Redirect to Spotify OAuth                  |
| `POST` | `/api/spotify/callback`     | Exchange auth code for token               |
| `GET`  | `/api/update/version`       | Get current installed core version         |
| `GET`  | `/api/update/check`         | Check GitHub for socket core updates       |
| `POST` | `/api/update/download`      | Download and extract socket core           |
| `GET`  | `/api/extension`            | List installed expansion modules           |
| `GET`  | `/api/extension/info/:name` | Get specific expansion module metadata     |
| `POST` | `/api/extension/reload`     | Reload all expansion modules from disk     |
| `*`    | `/api/extension/:module/*`  | Routed directly to extension module router |
| `WS`   | `/ws`                       | WebSocket endpoint                         |

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