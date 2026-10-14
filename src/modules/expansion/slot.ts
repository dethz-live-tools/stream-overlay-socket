import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import type { ServerWebSocket } from "bun";
import { getCurrentAppVersion } from "../updater";
import type {
  ApiModule,
  ApiModuleFactory,
  ExpansionContext,
  LoadedApiModule,
} from "./types";

export const DEFAULT_SYSTEM_TOPIC = "dethzon:system";

// ponytail: load config from config.ts with fallback to config.example.ts
let currentConfig: Record<string, any> = {};

export function loadConfig(): Record<string, any> {
  try {
    delete require.cache[require.resolve("../config")];
  } catch {}
  try {
    const raw = require("../config");
    currentConfig = raw?.default ? { ...raw.default, ...raw } : raw;
  } catch {
    try {
      const fallback = require("../config.example");
      currentConfig = fallback?.default ? { ...fallback.default, ...fallback } : fallback;
    } catch {
      currentConfig = {};
    }
  }
  return currentConfig;
}

loadConfig();
export { currentConfig as config };

/**
 * Find folder name under modules/ matching a module name or file path
 */
export function findModuleFolder(
  modName?: string,
  sourceOrDir?: string,
  modulesDir = "modules",
): string | null {
  const resolvedModules = path.resolve(modulesDir);

  if (sourceOrDir) {
    const resolvedPath = path.resolve(sourceOrDir);
    const rel = path.relative(resolvedModules, resolvedPath);
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
      const seg = rel.split(path.sep)[0];
      if (seg && fs.existsSync(path.join(resolvedModules, seg))) {
        return seg;
      }
    }
  }

  if (fs.existsSync(resolvedModules)) {
    try {
      const entries = fs.readdirSync(resolvedModules, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name.startsWith("_")) {
          continue;
        }

        if (modName && entry.name.toLowerCase() === modName.toLowerCase()) {
          return entry.name;
        }

        const meta = readExtensionMeta(path.join(resolvedModules, entry.name));
        if (meta?.name && modName && meta.name.toLowerCase() === modName.toLowerCase()) {
          return entry.name;
        }
      }
    } catch {}
  }

  return null;
}

/**
 * List folder names in modules/ directory
 */
export function listModuleFolderNames(dir = "modules"): string[] {
  const resolvedDir = path.resolve(dir);
  if (!fs.existsSync(resolvedDir)) return [];
  try {
    const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("_"))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export interface DiscoveredModuleFolder {
  folderName: string;
  name: string;
  version?: string;
  description?: string;
  enabled?: boolean;
}

/**
 * List discovered modules with their folder name and extensions.json metadata
 */
export function listDiscoveredModuleFolders(
  dir = "modules",
): DiscoveredModuleFolder[] {
  const resolvedDir = path.resolve(dir);
  if (!fs.existsSync(resolvedDir)) return [];
  try {
    const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
    const result: DiscoveredModuleFolder[] = [];
    for (const entry of entries) {
      if (
        !entry.isDirectory() ||
        entry.name.startsWith(".") ||
        entry.name.startsWith("_")
      ) {
        continue;
      }
      const fullPath = path.join(resolvedDir, entry.name);
      const meta = readExtensionMeta(fullPath);
      result.push({
        folderName: entry.name,
        name: meta?.name || entry.name,
        version: meta?.version,
        description: meta?.description,
        enabled: meta?.enabled ?? true,
      });
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Load merged configuration for a specific expansion module.
 * Combines global host config, module-specific section in host config, expansion key, and local module config.json.
 */
export function getModuleConfig(
  modName: string,
  sourceOrDir?: string,
): Record<string, any> {
  const globalConfig = loadConfig();
  let localConfig: Record<string, any> = {};

  const folderName = findModuleFolder(modName, sourceOrDir);

  if (sourceOrDir) {
    try {
      const dir =
        fs.existsSync(sourceOrDir) && fs.statSync(sourceOrDir).isDirectory()
          ? sourceOrDir
          : path.dirname(sourceOrDir);

      const localCandidates = [
        path.join(dir, "config.json"),
        path.join(dir, "..", "config.json"),
      ];
      for (const cand of localCandidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          const parsed = JSON.parse(fs.readFileSync(cand, "utf-8"));
          localConfig = { ...localConfig, ...parsed };
          break;
        }
      }
    } catch {}
  } else if (folderName) {
    const defaultModDir = path.resolve("modules", folderName);
    const cand = path.join(defaultModDir, "config.json");
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
      try {
        localConfig = JSON.parse(fs.readFileSync(cand, "utf-8"));
      } catch {}
    }
  } else {
    // Check default modules/<modName>/config.json
    const defaultModDir = path.resolve("modules", modName);
    const cand = path.join(defaultModDir, "config.json");
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
      try {
        localConfig = JSON.parse(fs.readFileSync(cand, "utf-8"));
      } catch {}
    }
  }

  // Section in global config.json
  const sectionConfig =
    (modName ? globalConfig[modName] : undefined) ||
    (folderName ? globalConfig[folderName] : undefined) ||
    (modName ? globalConfig.modules?.[modName] : undefined) ||
    (folderName ? globalConfig.modules?.[folderName] : undefined) ||
    (modName ? globalConfig.extensions?.[modName] : undefined) ||
    (folderName ? globalConfig.extensions?.[folderName] : undefined) ||
    {};

  // Read variables from expansion key in config.json
  const expansionSection = {
    ...(folderName && globalConfig.expansion?.[folderName]
      ? globalConfig.expansion[folderName]
      : {}),
    ...(modName && globalConfig.expansion?.[modName]
      ? globalConfig.expansion[modName]
      : {}),
  };

  return {
    ...globalConfig,
    ...sectionConfig,
    ...localConfig,
    ...expansionSection,
  };
}

export class ApiExpansionSlot {
  private modules = new Map<string, LoadedApiModule>();
  private mountedRouter: Hono | null = null;
  private isInitialized = false;

  public get config(): Record<string, any> {
    return currentConfig;
  }

  public reloadConfig(): Record<string, any> {
    return loadConfig();
  }

  public get context(): ExpansionContext {
    return {
      broadcast: (message: string) => this.broadcast(message),
      systemTopic: DEFAULT_SYSTEM_TOPIC,
      serverVersion: getCurrentAppVersion(),
      config: this.config,
      getModule: (name: string) => this.get(name)?.module,
      listModules: () => this.list().map((m) => m.module.meta),
    };
  }

  /**
   * Broadcast message to all connected WebSocket clients on systemTopic
   */
  public broadcast(message: string): boolean {
    try {
      const { server } = require("../../server");
      if (server && typeof server.publish === "function") {
        server.publish(DEFAULT_SYSTEM_TOPIC, message);
        return true;
      }
    } catch {}
    return false;
  }

  /**
   * Register an API module into the expansion slot
   */
  public async register(
    moduleOrFactory: ApiModule | ApiModuleFactory,
    source = "programmatic",
  ): Promise<LoadedApiModule> {
    const initialName =
      (typeof moduleOrFactory === "object" && moduleOrFactory.meta?.name) ||
      (typeof moduleOrFactory === "function" && (moduleOrFactory as any).name) ||
      "";
    const initialConfig = initialName ? getModuleConfig(initialName, source) : this.config;
    const initialContext: ExpansionContext = {
      ...this.context,
      config: initialConfig,
    };

    const module =
      typeof moduleOrFactory === "function" && !isApiModule(moduleOrFactory)
        ? await moduleOrFactory(initialConfig, initialContext)
        : moduleOrFactory;

    const name = module.meta?.name?.trim().toLowerCase();
    if (!name) {
      throw new Error("Module must provide a valid meta.name");
    }

    const resolvedConfig = getModuleConfig(name, source);
    const resolvedContext: ExpansionContext = {
      ...this.context,
      config: resolvedConfig,
    };

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
      await module.router(subRouter, resolvedContext);
    } else {
      subRouter = module.router;
    }

    if (module.onInit) {
      try {
        await module.onInit(resolvedContext);
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
    loadConfig();
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
          let modCandidate = imported.default || imported.module || imported;

          const baseName =
            extensionMeta?.name || entry.name.replace(/\.(ts|js)$/, "");
          const moduleConfig = getModuleConfig(
            baseName,
            entry.isDirectory() ? fullPath : undefined,
          );
          const moduleContext: ExpansionContext = {
            ...this.context,
            config: moduleConfig,
          };

          // ponytail: allow outside modules to export factory function receiving (config, context)
          if (typeof modCandidate === "function" && !isApiModule(modCandidate)) {
            try {
              const produced = await modCandidate(moduleConfig, moduleContext);
              if (isApiModule(produced)) {
                modCandidate = produced;
              }
            } catch {
              // continue to standard router wrapping
            }
          }

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
          const modContext: ExpansionContext = {
            ...this.context,
            config: getModuleConfig(module.meta.name, loaded.source),
          };
          const res = await module.onWsMessage(msg, ws, modContext);
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

