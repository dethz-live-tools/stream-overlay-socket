import {
  checkForUpdate,
  downloadAndExtractCore,
  getCurrentCoreVersion,
} from "../updater";

export async function runUpdateCLI(args: string[] = []) {
  const sub = args[0]?.toLowerCase();

  switch (sub) {
    case "version": {
      const ver = getCurrentCoreVersion();
      console.log(`Current core version: ${ver || "none"}`);
      break;
    }

    case "check": {
      console.log("──────────────────────────────────────────");
      console.log("🔄 Checking for Core Updates");
      console.log("──────────────────────────────────────────");
      const res = await checkForUpdate();
      console.log(`  Installed: ${res.currentVersion || "none"}`);
      console.log(`  Latest:    ${res.latestVersion}`);
      if (res.hasUpdate) {
        console.log(`\n★ New update available! Run "update download" to install.`);
      } else {
        console.log("\n✓ Core is up to date.");
      }
      break;
    }

    case "download":
    case "install": {
      const target = args[1];
      console.log("──────────────────────────────────────────");
      console.log(`⬇ Downloading Core ${target || "latest"}...`);
      console.log("──────────────────────────────────────────");
      const res = await downloadAndExtractCore(target);
      if (res.success) {
        console.log(
          `\n✓ Core successfully updated to ${res.version} (${res.extractedCount} files extracted into ${res.targetDir})`,
        );
      } else {
        console.error("\n✗ Failed to download core.");
        process.exit(1);
      }
      break;
    }

    default:
      console.log("──────────────────────────────────────────");
      console.log("🔄 Core Update CLI");
      console.log("──────────────────────────────────────────");
      console.log("Usage: server update <command>\n");
      console.log("Commands:");
      console.log("  check              Check for available core updates");
      console.log("  download [version] Download and extract core files");
      console.log("  version            Show currently installed core version\n");
      break;
  }
}
