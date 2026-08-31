import { Hono } from "hono";
import {
  checkForUpdate,
  downloadAndExtractCore,
  getCurrentCoreVersion,
} from "../../modules/updater";

const update = new Hono();

// GET /api/update/version - Get currently installed core version
update.get("/version", (c) => {
  const version = getCurrentCoreVersion();
  return c.json({
    currentVersion: version,
  });
});

// GET /api/update/check - Check for available core updates from GitHub
update.get("/check", async (c) => {
  try {
    const result = await checkForUpdate();
    return c.json(result);
  } catch (error: any) {
    return c.json(
      {
        error: "Failed to check for updates",
        details: error?.message || String(error),
      },
      500,
    );
  }
});

// POST /api/update/download - Download core zip and extract into ./core
update.post("/download", async (c) => {
  try {
    let targetTagOrUrl: string | undefined;

    const contentType = c.req.header("content-type");
    if (contentType && contentType.includes("application/json")) {
      const body = await c.req.json().catch(() => ({}));
      targetTagOrUrl = body.url || body.tag;
    }

    if (!targetTagOrUrl) {
      targetTagOrUrl = c.req.query("url") || c.req.query("tag");
    }

    const result = await downloadAndExtractCore(targetTagOrUrl);
    return c.json(result);
  } catch (error: any) {
    return c.json(
      {
        error: "Failed to download and extract core",
        details: error?.message || String(error),
      },
      500,
    );
  }
});

export default update;
