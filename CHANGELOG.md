# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-06

### Added
- **CLI Interface**:
  - `serve`: Command to launch Hono and WebSocket server with `-p`/`--port`, `-h`/`--host`, and `--sync-libs` flags.
  - `overlay list`: Inspect installed overlays in `static/` and view metadata and dependencies.
  - `overlay sync`: Automatically read `meta.yaml` from overlays and pull/clone libraries into `static/libs/`.
  - `overlay install <repo>`: Clone/pull overlay Git repository and automatically pull its dependencies.
  - `update check` & `update download`: Check for and download core updates directly from GitHub.
  - Central command router in `src/modules/cli/index.ts` and root entry point in `src/index.ts`.
- **Overlay Library Git Module**:
  - `src/modules/overlay/libs.ts`: YAML parser for `meta.yaml` / `meta.yml`, Git URL resolver, and pull/clone runner using Bun native shell.
  - TypeScript interfaces for overlays and libraries in `src/modules/interfaces/overlay.interface.ts`.
- **Scripts in `package.json`**:
  - Added `serve`, `cli`, `overlay:sync`, and `overlay:list`.

### Changed
- Decoupled server initialization into `src/server.ts` to prevent circular imports during WebSocket topic initialization and test execution.
- Updated `staticPage.ts` metadata interface to include `libs?: string[]`.
- Updated Spotify WebSocket module to publish topics safely with fallback options.

### Fixed
- Fixed circular dependency preventing `routes` from initializing during standalone test execution.
