import path from "node:path";
import fs from "node:fs";
import {
  syncAllStaticLibs,
  syncOverlayLibs,
  installOverlay,
  readMetaYaml,
} from "../../overlay/libs";

export async function runInstallCLI(args: string[] = process.argv.slice(2)) {
  const target = args[0]?.trim();

  console.log("──────────────────────────────────────────");
  console.log("📦 Overlay & Library Sync Tool");
  console.log("──────────────────────────────────────────");

  if (!target) {
    // No target provided -> Sync all libraries across all static overlays
    console.log("→ Scanning static/ directory for overlay metadata...");
    const results = await syncAllStaticLibs();

    if (results.length === 0) {
      console.log("ℹ No overlay libraries found in meta.yaml across static/ overlays.");
      return;
    }

    console.log(`\nFound ${results.length} unique libraries to check:`);
    for (const res of results) {
      if (res.success) {
        console.log(`  ✓ ${res.lib.name} [${res.action}] (${res.lib.cloneUrl})`);
      } else {
        console.error(`  ✗ ${res.lib.name} [failed]: ${res.error}`);
      }
    }
    console.log("\n✓ All libraries processed.");
    return;
  }

  // Check if target is an existing local overlay directory in static/ or absolute/relative
  const possiblePaths = [
    target,
    path.join("static", target),
    path.resolve(target),
  ];

  const existingDir = possiblePaths.find(
    (p) => fs.existsSync(p) && fs.statSync(p).isDirectory(),
  );

  if (existingDir) {
    // Target is a local overlay directory
    console.log(`→ Reading meta.yaml from "${existingDir}"...`);
    const meta = await readMetaYaml(existingDir);

    if (!meta) {
      console.error(`✗ No valid meta.yaml or meta.yml found in "${existingDir}".`);
      return;
    }

    console.log(`  Overlay: ${meta.name} (author: ${meta.author || "unknown"})`);
    console.log(`  Libs required: ${meta.libs?.length ? meta.libs.join(", ") : "none"}`);

    const syncRes = await syncOverlayLibs(existingDir);
    for (const res of syncRes.libs) {
      if (res.success) {
        console.log(`  ✓ ${res.lib.name} [${res.action}]`);
      } else {
        console.error(`  ✗ ${res.lib.name} [failed]: ${res.error}`);
      }
    }

    console.log("\n✓ Overlay libraries synced.");
    return;
  }

  // Otherwise treat target as a Git repository URL or shorthand (e.g. dethz-live-tools/dethz-overlay-horizontal)
  console.log(`→ Installing overlay from Git: "${target}"...`);
  try {
    const { overlayDir, syncResult } = await installOverlay(target);
    console.log(`✓ Overlay cloned/updated into "${overlayDir}".`);

    if (syncResult.meta) {
      console.log(`  Overlay: ${syncResult.meta.name}`);
      console.log(
        `  Libs required: ${syncResult.meta.libs?.length ? syncResult.meta.libs.join(", ") : "none"}`,
      );
    }

    for (const res of syncResult.libs) {
      if (res.success) {
        console.log(`  ✓ ${res.lib.name} [${res.action}]`);
      } else {
        console.error(`  ✗ ${res.lib.name} [failed]: ${res.error}`);
      }
    }

    console.log("\n✓ Installation and library sync complete.");
  } catch (err: any) {
    console.error(`✗ Failed to install overlay: ${err?.message || err}`);
    process.exit(1);
  }
}

// Run CLI directly if invoked from command line
if (import.meta.main) {
  runInstallCLI().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
