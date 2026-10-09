import {
  checkAllUpdates,
  checkForAppUpdate,
  checkForUpdate,
  downloadAndExtractCore,
  getCurrentAppVersion,
  getCurrentCoreVersion,
} from "../updater";

export async function runUpdateCLI(args: string[] = []) {
  const sub = args[0]?.toLowerCase();

  switch (sub) {
    case "version": {
      const appVer = getCurrentAppVersion();
      const coreVer = getCurrentCoreVersion();
      console.log("──────────────────────────────────────────");
      console.log("📌 Installed Versions");
      console.log("──────────────────────────────────────────");
      console.log(`  App:      ${appVer}`);
      console.log(`  Core lib: ${coreVer || "none"}`);
      break;
    }

    case "check": {
      const target = args[1]?.toLowerCase();
      console.log("──────────────────────────────────────────");
      console.log("🔄 Checking for Updates");
      console.log("──────────────────────────────────────────");

      if (target === "core") {
        const res = await checkForUpdate();
        console.log(`[Core Lib]`);
        console.log(`  Installed: ${res.currentVersion || "none"}`);
        console.log(`  Latest:    ${res.latestVersion}`);
        if (res.hasUpdate) {
          console.log(`\n★ Core update available! Run "update download" to install.`);
        } else {
          console.log(`\n✓ Core lib is up to date.`);
        }
      } else if (target === "app") {
        const res = await checkForAppUpdate();
        console.log(`[App]`);
        console.log(`  Installed: ${res.currentVersion || "none"}`);
        console.log(`  Latest:    ${res.latestVersion}`);
        if (res.hasUpdate) {
          console.log(`\n★ App update available: ${res.releaseUrl}`);
        } else {
          console.log(`\n✓ App is up to date.`);
        }
      } else {
        const { app, core } = await checkAllUpdates();
        console.log(`[App]`);
        console.log(`  Installed: ${app.currentVersion || "none"}`);
        console.log(`  Latest:    ${app.latestVersion}`);
        console.log(`  Status:    ${app.hasUpdate ? "★ Update available" : "✓ Up to date"}`);

        console.log(`\n[Core Lib]`);
        console.log(`  Installed: ${core.currentVersion || "none"}`);
        console.log(`  Latest:    ${core.latestVersion}`);
        console.log(`  Status:    ${core.hasUpdate ? "★ Update available" : "✓ Up to date"}`);

        if (core.hasUpdate) {
          console.log(`\n→ Run "update download" or use controller dashboard to install core update.`);
        }
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
      console.log("🔄 Update CLI");
      console.log("──────────────────────────────────────────");
      console.log("Usage: server update <command>\n");
      console.log("Commands:");
      console.log("  check [app|core]   Check for available updates (app and core lib)");
      console.log("  download [version] Download and extract core files");
      console.log("  version            Show currently installed app and core versions\n");
      break;
  }
}
