import { Hono } from "hono";
import { getConfig, resolveConfigPath, saveConfig } from "../../modules/config";
import { expansionSlot, listDiscoveredModuleFolders } from "../../modules/expansion";

const configApi = new Hono();

configApi.get("/", (c) => {
  const current = getConfig();
  const configPath = resolveConfigPath();
  const modules = listDiscoveredModuleFolders("modules");
  return c.json({
    status: 1,
    path: configPath,
    config: current,
    modules,
  });
});

configApi.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const updates = body.config ?? body.updates ?? body;

    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return c.json(
        {
          status: 0,
          message: "Invalid configuration payload: must be a JSON object",
        },
        400,
      );
    }

    const saved = saveConfig(updates);

    // Refresh expansion slot cache so dynamic modules receive updated configuration
    try {
      expansionSlot.reloadConfig();
    } catch {
      // Ignore if expansion slot reloadConfig not implemented
    }

    return c.json({
      status: 1,
      message: "Configuration saved successfully",
      config: saved,
    });
  } catch (err: any) {
    return c.json(
      {
        status: 0,
        message: err?.message || "Failed to parse JSON body",
      },
      400,
    );
  }
});

// Dedicated Core configuration endpoints
configApi.get("/core", (c) => {
  const current = getConfig();
  const { expansion, ...coreConfig } = current;
  return c.json({
    status: 1,
    config: coreConfig,
  });
});

configApi.post("/core", async (c) => {
  try {
    const body = await c.req.json();
    const updates = body.config ?? body.updates ?? body;

    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return c.json(
        {
          status: 0,
          message: "Invalid configuration payload: must be a JSON object",
        },
        400,
      );
    }

    const current = getConfig();
    const toSave = { ...updates, expansion: current.expansion };
    const saved = saveConfig(toSave);

    try {
      expansionSlot.reloadConfig();
    } catch {}

    const { expansion, ...savedCore } = saved;
    return c.json({
      status: 1,
      message: "Core configuration saved successfully",
      config: savedCore,
    });
  } catch (err: any) {
    return c.json(
      {
        status: 0,
        message: err?.message || "Failed to parse JSON body",
      },
      400,
    );
  }
});

// Single expansion module config endpoints
const handleGetModuleConfig = (c: any) => {
  const mod = c.req.param("module");
  const current = getConfig();
  const modConfig = current.expansion?.[mod] || {};
  const modules = listDiscoveredModuleFolders("modules");
  const meta = modules.find((m) => m.folderName === mod || m.name === mod);

  return c.json({
    status: 1,
    module: mod,
    meta: meta || null,
    config: modConfig,
  });
};

const handlePostModuleConfig = async (c: any) => {
  try {
    const mod = c.req.param("module");
    const body = await c.req.json();
    const modVars = body.config ?? body.variables ?? body.updates ?? body;

    if (!modVars || typeof modVars !== "object" || Array.isArray(modVars)) {
      return c.json(
        {
          status: 0,
          message: "Invalid configuration payload: must be a JSON object",
        },
        400,
      );
    }

    const current = getConfig();
    const currentExp = { ...(current.expansion || {}) };
    currentExp[mod] = modVars;

    const saved = saveConfig({ expansion: currentExp });

    try {
      expansionSlot.reloadConfig();
    } catch {}

    return c.json({
      status: 1,
      message: `Configuration for module "${mod}" saved successfully`,
      module: mod,
      config: saved.expansion?.[mod] || {},
    });
  } catch (err: any) {
    return c.json(
      {
        status: 0,
        message: err?.message || "Failed to parse JSON body",
      },
      400,
    );
  }
};

configApi.get("/expansion/:module", handleGetModuleConfig);
configApi.post("/expansion/:module", handlePostModuleConfig);
configApi.get("/module/:module", handleGetModuleConfig);
configApi.post("/module/:module", handlePostModuleConfig);

export default configApi;
