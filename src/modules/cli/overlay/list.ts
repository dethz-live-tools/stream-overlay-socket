import fs from "node:fs";
import path from "node:path";
import { readMetaYaml } from "../../overlay/libs";

export async function runOverlayListCLI(staticDir = "static") {
  const resolved = path.resolve(staticDir);

  console.log("──────────────────────────────────────────");
  console.log("📦 Installed Overlays");
  console.log("──────────────────────────────────────────");

  if (!fs.existsSync(resolved)) {
    console.log(`No "${staticDir}" directory found.`);
    return;
  }

  const entries = fs.readdirSync(resolved, { withFileTypes: true });
  const overlayDirs = entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        entry.name !== "libs" &&
        !entry.name.startsWith("."),
    )
    .map((e) => e.name);

  if (overlayDirs.length === 0) {
    console.log("No overlays installed in static/");
    return;
  }

  for (const dirName of overlayDirs) {
    const fullDir = path.join(resolved, dirName);
    const meta = await readMetaYaml(fullDir);

    console.log(`\n• ${dirName}`);
    if (meta) {
      console.log(`  Name:        ${meta.name || dirName}`);
      if (meta.author) console.log(`  Author:      ${meta.author}`);
      if (meta.description) console.log(`  Description: ${meta.description}`);
      const libs =
        meta.libs && meta.libs.length > 0 ? meta.libs.join(", ") : "none";
      console.log(`  Libraries:   ${libs}`);
    } else {
      console.log(`  (No meta.yaml found)`);
    }
  }

  console.log("\n──────────────────────────────────────────");
}
