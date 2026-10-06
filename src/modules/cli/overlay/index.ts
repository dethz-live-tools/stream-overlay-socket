import { runInstallCLI } from "./install";
import { runOverlayListCLI } from "./list";

export async function runOverlayCLI(args: string[] = []) {
  const sub = args[0]?.toLowerCase();

  switch (sub) {
    case "list":
    case "ls":
      await runOverlayListCLI();
      break;

    case "sync":
      await runInstallCLI(args.slice(1));
      break;

    case "install":
    case "add":
      if (!args[1]) {
        console.error("✗ Please provide an overlay repository to install.");
        console.error(
          "  Example: bun run src/index.ts overlay install dethz-live-tools/dethz-overlay-horizontal",
        );
        process.exit(1);
      }
      await runInstallCLI([args[1]]);
      break;

    case "--help":
    case "-h":
    case "help":
      printOverlayHelp();
      break;

    default:
      if (!sub) {
        printOverlayHelp();
      } else {
        // Fallback: run install/sync directly on provided target
        await runInstallCLI(args);
      }
      break;
  }
}

function printOverlayHelp() {
  console.log("──────────────────────────────────────────");
  console.log("📦 Overlay Management CLI");
  console.log("──────────────────────────────────────────");
  console.log("Usage: server overlay <command> [options]\n");
  console.log("Commands:");
  console.log("  list, ls           List all installed overlays and metadata");
  console.log("  sync [name]        Sync libraries for all overlays or a specific overlay");
  console.log("  install <repo>     Clone/pull an overlay from Git and pull its required libs");
  console.log("  help               Show this help message\n");
}

export * from "./install";
export * from "./list";
