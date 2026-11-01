import { Hono } from "hono";
import { expansionSlot, listDiscoveredModuleFolders } from "../../modules/expansion";

const extensionRouter = new Hono();

// Formatter for module listing (including enabled / active status)
const getModuleList = () => {
  const discovered = listDiscoveredModuleFolders("modules");
  const registered = expansionSlot.list();

  return discovered.map((d) => {
    const activeMod = registered.find(
      (r) =>
        r.module.meta.name.toLowerCase() === d.name.toLowerCase() ||
        r.module.meta.name.toLowerCase() === d.folderName.toLowerCase(),
    );
    const isEnabled = expansionSlot.isEnabled(d.folderName || d.name);

    return {
      name: d.name,
      folderName: d.folderName,
      version: d.version || "1.0.0",
      description: d.description || "",
      enabled: isEnabled,
      active: activeMod !== undefined,
      route: activeMod?.mountedPath || `/api/extension/${d.name}`,
      wsPrefix: activeMod?.module.wsPrefix || null,
      source: activeMod?.source || "local",
      loadedAt: activeMod ? activeMod.loadedAt.toISOString() : null,
    };
  });
};

// GET /api/extension & GET /api/extension/list - List all installed extension modules
extensionRouter.get("/", (c) => {
  const modules = getModuleList();
  return c.json({
    total: modules.length,
    modules,
  });
});

extensionRouter.get("/list", (c) => {
  const modules = getModuleList();
  return c.json({
    total: modules.length,
    modules,
  });
});

// Control endpoints: turn expansion on / off or toggle
extensionRouter.post("/:module/toggle", async (c) => {
  const mod = c.req.param("module");
  try {
    const newStatus = await expansionSlot.toggle(mod);
    return c.json({
      success: true,
      module: mod,
      enabled: newStatus,
      active: expansionSlot.get(mod) !== undefined,
    });
  } catch (err: any) {
    return c.json(
      { error: err?.message || "Failed to toggle module" },
      500,
    );
  }
});

extensionRouter.post("/:module/enable", async (c) => {
  const mod = c.req.param("module");
  try {
    const status = await expansionSlot.setEnabled(mod, true);
    return c.json({
      success: true,
      module: mod,
      enabled: status,
      active: expansionSlot.get(mod) !== undefined,
    });
  } catch (err: any) {
    return c.json(
      { error: err?.message || "Failed to enable module" },
      500,
    );
  }
});

extensionRouter.post("/:module/disable", async (c) => {
  const mod = c.req.param("module");
  try {
    const status = await expansionSlot.setEnabled(mod, false);
    return c.json({
      success: true,
      module: mod,
      enabled: status,
      active: expansionSlot.get(mod) !== undefined,
    });
  } catch (err: any) {
    return c.json(
      { error: err?.message || "Failed to disable module" },
      500,
    );
  }
});

// GET /api/extension/info/:name - Get info for a specific module
extensionRouter.get("/info/:name", (c) => {
  const name = c.req.param("name")?.toLowerCase();
  const found = expansionSlot.get(name);

  if (!found) {
    return c.json({ error: `Extension module "${name}" not found.` }, 404);
  }

  return c.json({
    name: found.module.meta.name,
    version: found.module.meta.version || "1.0.0",
    description: found.module.meta.description || "",
    author: found.module.meta.author || "",
    tags: found.module.meta.tags || [],
    route: found.mountedPath,
    wsPrefix: found.module.wsPrefix || null,
    source: found.source || "local",
    loadedAt: found.loadedAt.toISOString(),
  });
});

// POST /api/extension/reload - Reload modules from disk
extensionRouter.post("/reload", async (c) => {
  try {
    const loadedCount = await expansionSlot.loadFromDirectory("modules");
    return c.json({
      success: true,
      loadedCount,
      totalActive: expansionSlot.list().length,
    });
  } catch (err: any) {
    return c.json(
      {
        error: "Failed to reload extension modules",
        details: err?.message || String(err),
      },
      500,
    );
  }
});

// Mount dynamic extension module routing (/api/extension/:module and /api/extension/:module/*)
expansionSlot.mount(extensionRouter);

export default extensionRouter;
