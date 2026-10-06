import { startServer } from "../../server";
import { syncAllStaticLibs } from "../overlay/libs";

export interface ServeCLIOptions {
  port?: number;
  hostname?: string;
  syncLibs?: boolean;
}

export function parseServeArgs(args: string[]): ServeCLIOptions {
  const options: ServeCLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--port" || arg === "-p") {
      const val = Number(args[++i]);
      if (!isNaN(val)) options.port = val;
    } else if (arg.startsWith("--port=")) {
      const val = Number(arg.split("=")[1]);
      if (!isNaN(val)) options.port = val;
    } else if (arg === "--host" || arg === "-h") {
      options.hostname = args[++i];
    } else if (arg.startsWith("--host=")) {
      options.hostname = arg.split("=")[1];
    } else if (arg === "--sync-libs") {
      options.syncLibs = true;
    }
  }

  return options;
}

export async function runServeCLI(args: string[] = []) {
  const options = parseServeArgs(args);

  console.log("──────────────────────────────────────────");
  console.log("🚀 Stream Overlay Server");
  console.log("──────────────────────────────────────────");

  if (options.syncLibs) {
    console.log("→ Auto-syncing overlay libraries...");
    try {
      const syncResults = await syncAllStaticLibs();
      for (const res of syncResults) {
        console.log(`  ✓ ${res.lib.name} [${res.action}]`);
      }
    } catch (err: any) {
      console.warn("  ⚠ Warning: Failed to sync libraries:", err?.message || err);
    }
  }

  const s = startServer(options);

  console.log(`✓ Server running at: http://${s.hostname}:${s.port}`);
  console.log(`  - Overlays:   http://${s.hostname}:${s.port}/static`);
  console.log(`  - WebSocket:  ws://${s.hostname}:${s.port}/ws`);
  console.log(`  - Controller: http://${s.hostname}:${s.port}/controller`);
  console.log("──────────────────────────────────────────");
}
