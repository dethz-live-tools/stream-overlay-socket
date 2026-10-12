import {
  createModuleTemplate,
  expansionSlot,
} from "../expansion";

export async function runModuleCLI(args: string[] = []) {
  const sub = args[0]?.toLowerCase();

  switch (sub) {
    case "list":
    case "ls": {
      await expansionSlot.loadFromDirectory("modules");
      const list = expansionSlot.list();

      console.log("──────────────────────────────────────────");
      console.log("🧩 Installed API Expansion Modules");
      console.log("──────────────────────────────────────────");

      if (list.length === 0) {
        console.log("  No expansion modules found in ./modules.");
        console.log("  Run \"server module create <name>\" to scaffold a new one.\n");
        return;
      }

      for (const item of list) {
        const meta = item.module.meta;
        console.log(`• ${meta.name} (v${meta.version || "1.0.0"})`);
        console.log(`  Route:       ${item.mountedPath}`);
        if (meta.description) {
          console.log(`  Description: ${meta.description}`);
        }
        if (item.module.wsPrefix) {
          const prefixes = Array.isArray(item.module.wsPrefix)
            ? item.module.wsPrefix.join(", ")
            : item.module.wsPrefix;
          console.log(`  WS Prefix:   ${prefixes}`);
        }
        console.log(`  Source:      ${item.source || "local"}`);
        console.log("");
      }
      break;
    }

    case "create":
    case "new": {
      const name = args[1];
      if (!name) {
        console.error("✗ Please provide a module name.");
        console.error("  Usage: server module create <name>");
        console.error("  Example: bun run src/index.ts module create twitch");
        process.exit(1);
      }

      try {
        const { modDir, filePath, metaPath } = createModuleTemplate(name, "modules");
        console.log("──────────────────────────────────────────");
        console.log(`✨ Created API Expansion Module: "${name}"`);
        console.log("──────────────────────────────────────────");
        console.log(`  Directory: ${modDir}`);
        console.log(`  Metadata:  ${metaPath}`);
        console.log(`  File:      ${filePath}`);
        console.log(`  Endpoint:  /api/extension/${name.toLowerCase()}`);
        console.log("\n→ The server will automatically mount this module upon start.\n");
      } catch (err: any) {
        console.error(`✗ Failed to create module:`, err?.message || err);
        process.exit(1);
      }
      break;
    }

    case "info": {
      const name = args[1]?.toLowerCase();
      if (!name) {
        console.error("✗ Please provide a module name.");
        console.error("  Usage: server module info <name>");
        process.exit(1);
      }

      await expansionSlot.loadFromDirectory("modules");
      const found = expansionSlot.get(name);

      if (!found) {
        console.error(`✗ Module "${name}" not found in ./modules.`);
        process.exit(1);
      }

      const meta = found.module.meta;
      console.log("──────────────────────────────────────────");
      console.log(`ℹ Module Info: ${meta.name}`);
      console.log("──────────────────────────────────────────");
      console.log(`  Version:     ${meta.version || "1.0.0"}`);
      console.log(`  Route:       ${found.mountedPath}`);
      console.log(`  Description: ${meta.description || "none"}`);
      console.log(`  Author:      ${meta.author || "none"}`);
      console.log(`  WS Prefix:   ${found.module.wsPrefix || "none"}`);
      console.log(`  Source:      ${found.source || "local"}`);
      console.log(`  Loaded At:   ${found.loadedAt.toLocaleString()}`);
      console.log("");
      break;
    }

    case "--help":
    case "-h":
    case "help":
    default: {
      console.log("──────────────────────────────────────────");
      console.log("🧩 API Expansion Slot Management CLI");
      console.log("──────────────────────────────────────────");
      console.log("Usage: server module <command> [options]\n");
      console.log("Commands:");
      console.log("  list, ls           List all installed API expansion modules");
      console.log("  create <name>      Scaffold a new expansion module template in ./modules");
      console.log("  info <name>        Inspect details and route paths of a module");
      console.log("  help               Display this help menu\n");
      break;
    }
  }
}
