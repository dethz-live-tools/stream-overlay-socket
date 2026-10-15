import { Hono } from "hono";
import fs from "node:fs";

import ws from "./ws";
import api from "./api";
import { staticListingPage } from "./staticPage";
import { mainHandler } from "./static";
import { saveConfig } from "../modules/config";
import { expansionSlot } from "../modules/expansion";

const routes = new Hono();

routes.get("/", (c) => {
  return c.text("server loaded");
});

routes.get("/static", (c) => {
  // Directory Listing
  const dirList = fs.readdirSync("static");

  return c.html(staticListingPage(dirList));
});

routes.post("/config", async (c) => {
  const contentType = c.req.header("content-type") || "";
  let updates: Record<string, any> = {};

  if (contentType.includes("application/json")) {
    const json = await c.req.json();
    updates = json.config ?? json.updates ?? json;
  } else {
    // Form data submission fallback
    const formData = await c.req.parseBody();
    updates = { ...formData };
    if (typeof updates.expansion_json === "string") {
      try {
        updates.expansion = JSON.parse(updates.expansion_json);
      } catch {}
      delete updates.expansion_json;
    }
  }

  saveConfig(updates);
  try {
    expansionSlot.reloadConfig();
  } catch {}

  if (c.req.header("accept")?.includes("application/json")) {
    return c.json({ status: 1, message: "Configuration saved successfully" });
  }

  return c.redirect("/config?saved=true");
});

mainHandler(routes);

routes.route("/api", api);
routes.route("/ws", ws);

export default routes;
