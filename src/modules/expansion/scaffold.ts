import fs from "node:fs";
import path from "node:path";

export function createModuleTemplate(
  name: string,
  targetDir = "modules",
): { modDir: string; filePath: string; metaPath: string } {
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!cleanName) {
    throw new Error("Invalid module name provided.");
  }

  const modDir = path.resolve(targetDir, cleanName);

  if (!fs.existsSync(modDir)) {
    fs.mkdirSync(modDir, { recursive: true });
  }

  const jsonPath = path.join(modDir, "extensions.json");
  const indexPath = path.join(modDir, "index.ts");
  const metaFilePath = path.join(modDir, "meta.ts");
  const routerFilePath = path.join(modDir, "router.ts");
  const wsFilePath = path.join(modDir, "ws.ts");
  const lifecycleFilePath = path.join(modDir, "lifecycle.ts");

  if (fs.existsSync(indexPath) || fs.existsSync(jsonPath)) {
    throw new Error(`Module files already exist in: ${modDir}`);
  }

  // 1. Create extensions.json metadata
  const metaContent = JSON.stringify(
    {
      name: cleanName,
      version: "1.0.0",
      description: `Expansion API module for ${cleanName}`,
      author: "Streamer",
      tags: ["custom", "overlay"],
      routePath: `/${cleanName}`,
      wsPrefix: `${cleanName}: `,
      enabled: true,
    },
    null,
    2,
  );
  fs.writeFileSync(jsonPath, metaContent, "utf-8");

  // 2. Create meta.ts
  const metaCode = `import fs from "node:fs";
import path from "node:path";
import type { ApiModuleMeta } from "../../src/modules/expansion";

export interface ExtensionConfig extends ApiModuleMeta {
  routePath?: string;
  wsPrefix?: string;
}

/**
 * Load and parse extensions.json metadata
 */
export function loadMeta(dir: string = import.meta.dir): ExtensionConfig {
  const candidates = [
    path.resolve(dir, "extensions.json"),
    path.resolve(dir, "..", "extensions.json"),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      return JSON.parse(fs.readFileSync(cand, "utf-8"));
    }
  }
  throw new Error(\`[${cleanName}] Missing required metadata file: \${candidates[0]}\`);
}

export const meta = loadMeta();
`;
  fs.writeFileSync(metaFilePath, metaCode, "utf-8");

  // 3. Create router.ts
  const routerCode = `import { Hono } from "hono";
import type { ExpansionContext } from "../../src/modules/expansion";
import { meta } from "./meta";

/**
 * Register HTTP routes on Hono router
 */
export function registerRoutes(router: Hono, context: ExpansionContext): void {
  // GET /api/extension/${cleanName}
  router.get("/", (c) => {
    return c.json({
      module: meta.name,
      status: "active",
      timestamp: new Date().toISOString(),
    });
  });

  // POST /api/extension/${cleanName}/trigger - Broadcast to overlay clients
  router.post("/trigger", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const payload = JSON.stringify({
      event: \`\${meta.name}:trigger\`,
      data: body,
    });

    // Broadcast to WebSocket clients on system topic
    context.broadcast(payload);

    return c.json({
      success: true,
      broadcasted: true,
    });
  });
}
`;
  fs.writeFileSync(routerFilePath, routerCode, "utf-8");

  // 4. Create ws.ts
  const wsCode = `import type { ServerWebSocket } from "bun";
import type { ExpansionContext } from "../../src/modules/expansion";
import { meta } from "./meta";

/**
 * Handle incoming WebSocket messages with module prefix
 */
export function handleWsMessage(
  msg: string,
  ws: ServerWebSocket,
  context: ExpansionContext,
): boolean {
  console.log(\`[\${meta.name}] Received WS message:\`, msg);
  // Return true to mark as handled
  return true;
}
`;
  fs.writeFileSync(wsFilePath, wsCode, "utf-8");

  // 5. Create lifecycle.ts
  const lifecycleCode = `import type { ExpansionContext } from "../../src/modules/expansion";
import { meta } from "./meta";

/**
 * Lifecycle hook invoked on module initialization
 */
export function onInit(context: ExpansionContext): void {
  console.log(\`[\${meta.name}] Module initialized!\`);
}

/**
 * Lifecycle hook invoked on module teardown / reload
 */
export function onDestroy(): void {
  console.log(\`[\${meta.name}] Module destroyed!\`);
}
`;
  fs.writeFileSync(lifecycleFilePath, lifecycleCode, "utf-8");

  // 6. Create index.ts composing all function files
  const indexCode = `import { defineApiModule } from "../../src/modules/expansion";
import { meta } from "./meta";
import { registerRoutes } from "./router";
import { handleWsMessage } from "./ws";
import { onInit, onDestroy } from "./lifecycle";

/**
 * API Module: ${cleanName}
 */
export default defineApiModule({
  meta: {
    name: meta.name,
    version: meta.version || "1.0.0",
    description: meta.description || "",
    author: meta.author || "",
    tags: meta.tags || [],
    enabled: meta.enabled ?? true,
  },

  // Route subpath under /api/extension (defaults to "/${cleanName}")
  routePath: meta.routePath || \`/\${meta.name}\`,

  // WebSocket message prefix filter (optional)
  wsPrefix: meta.wsPrefix || \`\${meta.name}: \`,

  // Setup Hono routes
  router: registerRoutes,

  // Optional WebSocket incoming message handler
  onWsMessage: handleWsMessage,

  // Lifecycle hooks
  onInit,
  onDestroy,
});

export * from "./meta";
export * from "./router";
export * from "./ws";
export * from "./lifecycle";
`;
  fs.writeFileSync(indexPath, indexCode, "utf-8");

  return { modDir, filePath: indexPath, metaPath: jsonPath };
}
