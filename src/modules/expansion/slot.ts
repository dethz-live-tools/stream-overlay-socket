import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import type { ServerWebSocket } from "bun";
import { server } from "../../server";
import { systemTopic } from "../../routes/ws";
import { getCurrentAppVersion } from "../updater";
import type {
  ApiModule,
  ExpansionContext,
  LoadedApiModule,
} from "./types";

export class ApiExpansionSlot {
  private modules = new Map<string, LoadedApiModule>();
  private mountedRouter: Hono | null = null;
  private isInitialized = false;

  public get context(): ExpansionContext {
    return {
      broadcast: (message: string) => this.broadcast(message),
      systemTopic,
      serverVersion: getCurrentAppVersion(),
      getModule: (name: string) => this.get(name)?.module,
      listModules: () => this.list().map((m) => m.module.meta),
    };
  }

  /**
   * Broadcast message to all connected WebSocket clients on systemTopic
   */
  public broadcast(message: string): boolean {
    if (server && typeof (server as any).publish === "function") {
      (server as any).publish(systemTopic, message);
      return true;
    }
    return false;
  }

  /**
   * Register an API module into the expansion slot
   */
  public async register(
    module: ApiModule,
    source = "programmatic",
  ): Promise<LoadedApiModule> {
    const name = module.meta.name.trim().toLowerCase();
    if (!name) {
      throw new Error("Module must provide a valid meta.name");
    }

    // Clean up previous registration if re-registering
    if (this.modules.has(name)) {
      await this.unregister(name);
    }

    const routePath = module.routePath
      ? module.routePath.startsWith("/")
        ? module.routePath
        : `/${module.routePath}`
      : `/${name}`;

    let subRouter: Hono;
    if (typeof module.router === "function") {
      subRouter = new Hono();
      await module.router(subRouter, this.context);
    } else {
      subRouter = module.router;
    }

    if (module.onInit) {
      try {
        await module.onInit(this.context);
      } catch (err) {
        console.error(`[ExpansionSlot] Error initializing module "${name}":`, err);
      }
    }

    const fullMountedPath = `/api/extension${routePath}`;

    const loaded: LoadedApiModule = {
      module,
      mountedPath: fullMountedPath,
      router: subRouter,
      loadedAt: new Date(),
      source,
    };

    this.modules.set(name, loaded);
    console.log(
      `[ExpansionSlot] Registered module "${name}" (route: ${fullMountedPath})`,
    );

    return loaded;
  }

  /**
   * Unregister an API module
   */
  public async unregister(name: string): Promise<boolean> {
    const loaded = this.modules.get(name.toLowerCase());
    if (!loaded) return false;

    if (loaded.module.onDestroy) {
      try {
        await loaded.module.onDestroy();
      } catch (err) {
        console.error(`[ExpansionSlot] Error destroying module "${name}":`, err);
      }
    }

    this.modules.delete(name.toLowerCase());
    return true;
  }

  /**
   * Get loaded module by name
   */
  public get(name: string): LoadedApiModule | undefined {
    return this.modules.get(name.toLowerCase());
  }

  /**
   * List all registered modules
   */
  public list(): LoadedApiModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Mount expansion slot dispatcher onto extension Hono router (mounted at /api/extension)
   */
  public mount(extensionRouter: Hono): void {
    if (this.mountedRouter === extensionRouter) return;
    this.mountedRouter = extensionRouter;

    // Exact path match: /api/extension/:module
    extensionRouter.all("/:module", async (c, next) => {
      const modName = c.req.param("module")?.toLowerCase();
      if (modName === "list" || modName === "reload") return next();

      const loaded = this.get(modName);
      if (!loaded) return next();

      const url = new URL(c.req.url);
      const forwardUrl = new URL("/" + url.search, url.origin);
      return loaded.router.fetch(new Request(forwardUrl, c.req.raw));
    });

    // Subpath match: /api/extension/:module/*
    extensionRouter.all("/:module/*", async (c, next) => {
      const modName = c.req.param("module")?.toLowerCase();
      if (modName === "info") return next();

      const loaded = this.get(modName);
      if (!loaded) return next();

      const url = new URL(c.req.url);
      const prefixRegex = new RegExp(`^(/api)?/extension/${modName}`);
      const newPath = url.pathname.replace(prefixRegex, "") || "/";
      const forwardUrl = new URL(newPath + url.search, url.origin);
      return loaded.router.fetch(new Request(forwardUrl, c.req.raw));
    });

    console.log("[ExpansionSlot] Dynamic dispatcher mounted on /api/extension");
  }

  /**
   * Auto-discover and load modules from a directory (default: ./modules)
   */
  public async loadFromDirectory(dir = "modules"): Promise<number> {
    const resolvedDir = path.resolve(dir);
    if (!fs.existsSync(resolvedDir)) {
      try {
        fs.mkdirSync(resolvedDir, { recursive: true });
      } catch {
        return 0;
      }
      return 0;
    }

    const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
    let count = 0;

    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;

      const fullPath = path.join(resolvedDir, entry.name);
      let entryPoint: string | null = null;
      let extensionMeta: any = null;

      if (entry.isDirectory()) {
        // Read extensions.json metadata before doing anything
        extensionMeta = readExtensionMeta(fullPath);

        // If explicitly disabled in extensions.json, skip module
        if (extensionMeta && extensionMeta.enabled === false) {
          console.log(
            `[ExpansionSlot] Skipping disabled module "${extensionMeta.name || entry.name}" (extensions.json)`
          );
          continue;
        }

        const candidates = [
          path.join(fullPath, "index.ts"),
          path.join(fullPath, "index.js"),
          path.join(fullPath, "module.ts"),
          path.join(fullPath, "module.js"),
        ];

        for (const cand of candidates) {
          if (fs.existsSync(cand)) {
            entryPoint = cand;
            break;
          }
        }

        if (!entryPoint) {
          const pkgJson = path.join(fullPath, "package.json");
          if (fs.existsSync(pkgJson)) {
            try {
              const parsed = JSON.parse(fs.readFileSync(pkgJson, "utf-8"));
              if (parsed.main && fs.existsSync(path.join(fullPath, parsed.main))) {
                entryPoint = path.join(fullPath, parsed.main);
              }
            } catch {
              // ignore
            }
          }
        }
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))
      ) {
        entryPoint = fullPath;
      }

      if (entryPoint) {
        try {
          const imported = await import(entryPoint);
          const modCandidate = imported.default || imported.module || imported;

          if (isApiModule(modCandidate)) {
            if (extensionMeta) {
              modCandidate.meta = {
                ...extensionMeta,
                ...modCandidate.meta,
              };
              if (extensionMeta.routePath && !modCandidate.routePath) {
                modCandidate.routePath = extensionMeta.routePath;
              }
              if (extensionMeta.wsPrefix && !modCandidate.wsPrefix) {
                modCandidate.wsPrefix = extensionMeta.wsPrefix;
              }
            }
            await this.register(modCandidate, entryPoint);
            count++;
          } else if (
            modCandidate instanceof Hono ||
            typeof modCandidate === "function"
          ) {
            const baseName = extensionMeta?.name || entry.name.replace(/\.(ts|js)$/, "");
            const wrapped: ApiModule = {
              meta: {
                name: baseName,
                version: extensionMeta?.version || "1.0.0",
                description:
                  extensionMeta?.description || `Auto-loaded module from ${entry.name}`,
                author: extensionMeta?.author || "",
                tags: extensionMeta?.tags || [],
              },
              routePath: extensionMeta?.routePath || `/${baseName}`,
              wsPrefix: extensionMeta?.wsPrefix,
              router: modCandidate,
            };
            await this.register(wrapped, entryPoint);
            count++;
          }
        } catch (err) {
          console.error(`[ExpansionSlot] Failed to load module at "${entryPoint}":`, err);
        }
      }
    }

    return count;
  }

  /**
   * Dispatch incoming WebSocket message to registered modules
   * Returns true if message was handled by an expansion module
   */
  public async dispatchWsMessage(
    msg: string,
    ws: ServerWebSocket,
  ): Promise<boolean> {
    for (const loaded of this.modules.values()) {
      const { module } = loaded;
      if (!module.onWsMessage) continue;

      let matches = false;
      if (module.wsPrefix) {
        const prefixes = Array.isArray(module.wsPrefix)
          ? module.wsPrefix
          : [module.wsPrefix];
        matches = prefixes.some((p) => msg.startsWith(p));
      } else {
        matches = true;
      }

      if (matches) {
        try {
          const res = await module.onWsMessage(msg, ws, this.context);
          if (res === true) {
            return true;
          }
        } catch (err) {
          console.error(
            `[ExpansionSlot] Error in onWsMessage for "${module.meta.name}":`,
            err,
          );
        }
      }
    }
    return false;
  }

  /**
   * Initialize expansion slot: auto-load modules and mount them
   */
  public async init(apiRouter?: Hono, dir = "modules"): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (apiRouter) {
      this.mount(apiRouter);
    }

    const count = await this.loadFromDirectory(dir);
    if (count > 0) {
      console.log(
        `[ExpansionSlot] Auto-loaded ${count} API expansion module(s) from "${dir}"`,
      );
    }
  }
}

function isApiModule(obj: any): obj is ApiModule {
  return (
    obj &&
    typeof obj === "object" &&
    obj.meta &&
    typeof obj.meta.name === "string" &&
    (obj.router instanceof Hono || typeof obj.router === "function")
  );
}

/**
 * Locate extensions.json or extension.json in a directory
 */
export function findExtensionMetaFile(dirPath: string): string | null {
  const candidates = [
    path.join(dirPath, "extensions.json"),
    path.join(dirPath, "extension.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        if (fs.statSync(c).isFile()) return c;
      } catch {}
    }
  }
  return null;
}

/**
 * Read and parse extensions.json from a module directory
 */
export function readExtensionMeta(dirPath: string): any | null {
  const metaFile = findExtensionMetaFile(dirPath);
  if (!metaFile) return null;
  try {
    const content = fs.readFileSync(metaFile, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error(`[ExpansionSlot] Failed to parse meta file "${metaFile}":`, err);
    return null;
  }
}

export const expansionSlot = new ApiExpansionSlot();

