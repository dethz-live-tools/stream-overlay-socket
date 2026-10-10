# CLI Command Reference

The Stream Overlay Socket provides a unified CLI dispatcher executable via Bun during development or as a standalone compiled binary in production.

---

## 🚀 Execution Methods

```bash
# Development (via Bun)
bun run src/index.ts <command> [options]

# Via package.json helper scripts
bun run <script-name>

# Production (via compiled binary)
./server <command> [options]
```

---

## 📋 Command Groups

### 1. `serve` (Server Operations)

Start the HTTP and WebSocket server. This is the default command when invoked without arguments.

```bash
bun run src/index.ts serve [options]
```

#### Options

| Option | Flag | Description | Default |
| :--- | :--- | :--- | :--- |
| `--port` | `-p` | Network port to listen on. | `3000` (or `PORT` from `.env`) |
| `--host` | `-h` | Hostname to bind to. | `0.0.0.0` |
| `--sync-libs` | | Automatically clone/pull overlay Git libraries before starting. | `false` |

---

### 2. `overlay` (Overlay & Static Library Operations)

Manage overlays and external Git dependencies declared in `meta.yaml`.

```bash
# 1. List all installed overlays and dependencies
bun run src/index.ts overlay list

# 2. Sync Git libraries for all overlays
bun run src/index.ts overlay sync

# 3. Sync Git libraries for a single overlay
bun run src/index.ts overlay sync dethz-overlay-horizontal

# 4. Install a new overlay from Git and pull its libraries
bun run src/index.ts overlay install dethz-live-tools/dethz-overlay-vertical
```

---

### 3. `module` (API Expansion Slot Operations)

Manage modular API plugins installed in `./modules`.

```bash
# 1. List all active expansion modules
bun run src/index.ts module list

# 2. Scaffold a new module from starter template
bun run src/index.ts module create <module-name>

# 3. Display detailed metadata for a module
bun run src/index.ts module info <module-name>
```

---

### 4. `update` (Core Updates)

Manage upstream updates for the socket core UI components.

```bash
# 1. Show currently installed core version
bun run src/index.ts update version

# 2. Check GitHub for new releases
bun run src/index.ts update check

# 3. Download and extract the latest core release archive
bun run src/index.ts update download
```

---

## 📦 Package.json Script Shortcuts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `bun run --hot src/index.ts` | Start dev server with hot code reloading. |
| `serve` | `bun run src/index.ts serve` | Start server using CLI dispatcher. |
| `cli` | `bun run src/index.ts` | Run root CLI dispatcher. |
| `overlay:sync` | `bun run src/index.ts overlay sync` | Sync Git libraries across all overlays. |
| `overlay:list` | `bun run src/index.ts overlay list` | List installed overlays. |
| `module:list` | `bun run src/index.ts module list` | List expansion modules. |
| `module:create` | `bun run src/index.ts module create` | Scaffold new expansion module template. |
| `update:check` | `bun run src/index.ts update check` | Check GitHub for core updates. |
| `update:core` | `bun run src/index.ts update download` | Download latest core release. |
| `rules:sync` | `bunx dethz-crawler sync` | Synchronize AI agent rules from GitHub. |
| `build:all` | `bun run build.ts` | Cross-compile binaries for Linux, macOS, and Windows. |
| `build:box` | `bun run build-box.ts` | Cross-compile binaries and package with `.env` in ZIP archives. |
| `build:binary` | `bun build --compile ...` | Compile single binary for host OS. |
