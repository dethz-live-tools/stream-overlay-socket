import { Hono } from "hono";

import fs from "node:fs";
import path from "node:path";

import controller from "./controller";
import spotify from "./spotify";
import source from "./source";
import staticPath from "./static";
import { downloadAndExtractCore } from "../../modules/updater";

export const mainHandler = async (routes: Hono) => {
  // dir check - auto download core if missing
  const corePath = path.resolve("core");
  if (!fs.existsSync(corePath) || fs.readdirSync(corePath).length === 0) {
    console.log(
      "[MainHandler] core directory missing or empty. Auto-downloading core...",
    );
    try {
      await downloadAndExtractCore();
    } catch (err) {
      console.error("[MainHandler] Failed to auto-download core:", err);
    }
  }

  routes.route("/controller", controller);
  routes.route("/spotify", spotify);
  routes.route("/core", source);

  routes.route("/static", staticPath);
};
