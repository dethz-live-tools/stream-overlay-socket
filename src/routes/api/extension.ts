import { Hono } from "hono";
import { expansionSlot } from "../../modules/expansion";

const extensionRouter = new Hono();

// Formatter for module listing
const getModuleList = () => {
  return expansionSlot.list().map((m) => ({
    name: m.module.meta.name,
    version: m.module.meta.version || "1.0.0",
    description: m.module.meta.description || "",
    author: m.module.meta.author || "",
    tags: m.module.meta.tags || [],
    route: m.mountedPath,
    wsPrefix: m.module.wsPrefix || null,
    source: m.source || "local",
    loadedAt: m.loadedAt.toISOString(),
  }));
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
