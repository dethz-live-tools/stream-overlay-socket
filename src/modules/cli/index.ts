import { runServeCLI } from "./serve";
import { runOverlayCLI } from "./overlay";
import { runUpdateCLI } from "./update";

export async function runCLI(args: string[] = process.argv.slice(2)) {
  const command = args[0]?.toLowerCase();

  switch (command) {
    case "serve":
    case "start":
      await runServeCLI(args.slice(1));
      break;

    case "overlay":
      await runOverlayCLI(args.slice(1));
      break;

    case "update":
      await runUpdateCLI(args.slice(1));
      break;

    case "--help":
    case "-h":
    case "help":
      printMainHelp();
      break;

    default:
      if (!command) {
        // Default action when run with no arguments: start the overlay server
        await runServeCLI([]);
      } else {
        console.error(`✗ Unknown command: "${command}"\n`);
        printMainHelp();
        process.exit(1);
      }
      break;
  }
}

function printMainHelp() {
  console.log("──────────────────────────────────────────");
  console.log("📡 Stream Overlay Socket CLI");
  console.log("──────────────────────────────────────────");
  console.log("Usage: server <command> [options]\n");
  console.log("Commands:");
  console.log("  serve [options]       Start overlay server (default)");
  console.log("    -p, --port <number> Specify port to listen on (default: 3000)");
  console.log("    -h, --host <string> Specify hostname to bind to");
  console.log("    --sync-libs         Auto-sync libraries before starting\n");
  console.log("  overlay <subcommand>  Manage overlays and static libraries");
  console.log("    overlay list        List all installed overlays");
  console.log("    overlay sync [name] Sync libraries in meta.yaml");
  console.log("    overlay install <url> Clone/pull overlay and sync its libs\n");
  console.log("  update <subcommand>   Manage socket core updates");
  console.log("    update check        Check for core updates from GitHub");
  console.log("    update download     Download and extract latest core\n");
  console.log("  help, -h, --help      Display this help menu\n");
}

export * from "./serve";
export * from "./overlay";
export * from "./update";

if (import.meta.main) {
  runCLI().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
