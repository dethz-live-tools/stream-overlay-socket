import { Hono } from "hono";
import {
  checkAllUpdates,
  checkForAppUpdate,
  checkForUpdate,
  downloadAndExtractCore,
  getCurrentAppVersion,
  getCurrentCoreVersion,
} from "../../modules/updater";

const update = new Hono();

// GET /api/update/version - Get currently installed app and core versions
update.get("/version", (c) => {
  const coreVersion = getCurrentCoreVersion();
  const appVersion = getCurrentAppVersion();
  return c.json({
    appVersion,
    coreVersion,
    currentVersion: coreVersion,
  });
});

// GET /api/update/app - Check for app updates
update.get("/app", async (c) => {
  try {
    const result = await checkForAppUpdate();
    return c.json(result);
  } catch (error: any) {
    return c.json(
      {
        error: "Failed to check for app updates",
        details: error?.message || String(error),
      },
      500,
    );
  }
});

// GET /api/update/all - Check updates for both app and core lib
update.get("/all", async (c) => {
  try {
    const result = await checkAllUpdates();
    return c.json(result);
  } catch (error: any) {
    return c.json(
      {
        error: "Failed to check for all updates",
        details: error?.message || String(error),
      },
      500,
    );
  }
});

// GET /api/update/check - Check for available core updates from GitHub
update.get("/check", async (c) => {
  try {
    const coreResult = await checkForUpdate();
    const appResult = await checkForAppUpdate().catch(() => null);
    return c.json({
      ...coreResult,
      core: coreResult,
      app: appResult,
    });
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
