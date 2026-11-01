import { ServerWebSocket } from "bun";
import { reloadConfig, getConfig } from "../../../modules/config";
import { expansionSlot } from "../../../modules/expansion";
import { systemTopic } from "../index";

// ponytail: broadcast config update event to all active WebSocket clients on systemTopic
export const broadcastConfigUpdated = (source = "server") => {
  const cfg = reloadConfig();
  try {
    expansionSlot.reloadConfig();
  } catch {}

  try {
    const { server } = require("../../../server");
    if (server && typeof server.publish === "function") {
      server.publish(systemTopic, "config: updated");
      server.publish(
        systemTopic,
        `log: success -- Config updated and re-read (${source})`,
      );
    }
  } catch {}

  return cfg;
};

// ponytail: handle inbound WS commands like `config: reload` or `config: pull`
export const configWsHandler = async (msg: string, ws: ServerWebSocket) => {
  const cmd = msg.replace(/^config:\s*/, "").trim();

  if (
    cmd === "reload" ||
    cmd === "re-read" ||
    cmd === "read" ||
    cmd === "update"
  ) {
    const reloaded = reloadConfig();
    try {
      expansionSlot.reloadConfig();
    } catch {}

    ws.send("config: reloaded");
    ws.publish(systemTopic, "config: updated");
    ws.publish(systemTopic, "log: success -- Config re-read from disk");
  } else if (cmd === "pull" || cmd === "get") {
    const cfg = getConfig();
    ws.send(`config: DATA ${JSON.stringify(cfg)}`);
  } else {
    ws.send(`config: unknown command -- ${msg}`);
  }
};
