import { Hono } from "hono";
import { getConfig, resolveConfigPath, saveConfig } from "../../modules/config";
import { expansionSlot } from "../../modules/expansion";

const configApi = new Hono();

configApi.get("/", (c) => {
  const current = getConfig();
  const configPath = resolveConfigPath();
  return c.json({
    status: 1,
    path: configPath,
    config: current,
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

export default configApi;
