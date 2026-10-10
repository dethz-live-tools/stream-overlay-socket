# Stream Overlay Socket Documentation

Welcome to the **Stream Overlay Socket** documentation directory. This folder contains in-depth documentation covering architecture, extension APIs, overlay authoring, WebSocket protocols, and CLI operations.

---

## 📚 Documentation Index

| Guide | Description |
| :--- | :--- |
| [**Architecture & System Overview**](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/docs/architecture.md) | High-level system topology, lifecycle boot sequence, request flow, and directory layout. |
| [**API Extension Guide**](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/docs/extension-api.md) | Guide to building, registering, and routing modular expansion slot plugins under `/api/extension/<module>`. |
| [**Overlay Authoring Guide**](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/docs/overlay-guide.md) | How to build live stream overlays, declare `meta.yaml` configurations, sync Git libraries, and subscribe to WebSocket streams. |
| [**WebSocket Protocol Reference**](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/docs/websocket-protocol.md) | Detailed protocol specifications for Spotify, TikTok Live, system broadcasts, and custom module prefixes. |
| [**Controller & Core Client**](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/docs/controller-and-core.md) | Architecture of the `/controller` dashboard, static asset pipelines, and automated core updates. |
| [**CLI Command Reference**](file:///Users/george/repo/dethz-tools/live-tools/stream-overlay-socket/docs/cli-reference.md) | Complete reference for all CLI commands (`serve`, `overlay`, `module`, `update`) and binary compilation workflows. |

---

## 🧭 Repository Layout

```
stream-overlay-socket/
├── core/                   # Updateable browser controller UI & static assets
│   ├── controller/         # Web dashboard (/controller)
│   ├── spotify/            # Spotify OAuth web views
│   └── src/                # Shared frontend CSS, JS modules, and socket clients
├── docs/                   # Developer documentation and guides
├── modules/                # Local expansion slot directory for custom API modules
│   └── sample/             # Reference starter module
├── src/                    # Backend server source code (Bun + Hono)
│   ├── index.ts            # Entrypoint and CLI dispatcher
│   ├── server.ts           # Bun.serve and Hono app bootstrap
│   ├── routes/             # HTTP & WebSocket route handlers
│   │   ├── api/            # REST API (/api/spotify, /api/update, /api/extension)
│   │   ├── static/         # Static file delivery (/static, /controller, /core)
│   │   └── ws/             # WebSocket pub/sub engine (/ws)
│   └── modules/            # Core backend subsystems
│       ├── cli/            # CLI subcommands (serve, overlay, module, update)
│       ├── expansion/      # Dynamic expansion slot engine & module loaders
│       ├── overlay/        # Git library synchronization & meta.yaml parser
│       ├── spotify/        # Spotify Web API client & polling engine
│       ├── tiktok/         # TikTok Live connector client
│       └── updater.ts      # Core & app GitHub release updater
└── static/                 # Installed stream overlays & shared Git libraries
    ├── libs/               # Auto-cloned Git libraries (e.g. dethz-lib)
    ├── <overlay-name>/     # Individual overlay directories with meta.yaml
    └── overlay.config.json # Auto-managed registry of overlays and libraries
```

---

## 🛠 Guidelines for Future Development

When extending or maintaining this project:

1. **Runtime & Tooling**:
   - Always execute scripts and tests with **Bun** (`bun <file>`, `bun run <script>`, `bun test`, `bun build`).
   - Do not use Node.js, npm, or pnpm.

2. **Expansion Module Routing**:
   - Expansion modules must mount their HTTP routes under `/api/extension/<module-name>`.
   - Backward-compatibility aliases exist at `/api/modules/<module-name>`, but new code should target `/api/extension`.

3. **Overlay Independence**:
   - Overlays in `static/` must be self-contained HTML/CSS/JS applications.
   - Shared client logic belongs in `static/libs/<lib-name>` managed via `meta.yaml` `libs` declarations.

4. **Git Protection**:
   - Never commit sensitive Spotify tokens or credentials (`src/modules/config.ts` is git-ignored; use `src/modules/config.example.ts`).
   - Do not commit cloned dependency repos in `static/libs/` or submodules directly.
