import { Hono } from "hono";
import type { ServerWebSocket } from "bun";

export interface ApiModuleMeta {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  tags?: string[];
  enabled?: boolean;
}

export interface ExpansionContext {
  /**
   * Broadcast message to all connected WebSocket clients subscribed to systemTopic
   */
  broadcast: (message: string) => boolean;
  /**
   * System WebSocket topic identifier
   */
  systemTopic: string;
  /**
   * Current server/app version
   */
  serverVersion: string;
  /**
   * Global configuration loaded from config.ts
   */
  config: Record<string, any>;
  /**
   * Retrieve another loaded module by name
   */
  getModule: (name: string) => ApiModule | undefined;
  /**
   * List all registered module metadata
   */
  listModules: () => ApiModuleMeta[];
}

export type RouterFactory = (
  router: Hono,
  context: ExpansionContext,
) => void | Promise<void>;

export type ApiModuleFactory = (
  config: Record<string, any>,
  context: ExpansionContext,
) => ApiModule | Promise<ApiModule>;

export interface ApiModule {
  meta: ApiModuleMeta;
  /**
   * Route prefix under /api (e.g., "/twitch" or defaults to `/${meta.name}`)
   */
  routePath?: string;
  /**
   * Hono router instance, or factory function receiving (router, context)
   */
  router: Hono | RouterFactory;
  /**
   * Optional WebSocket message prefix (e.g. "twitch: " or ["obs: ", "scene: "])
   */
  wsPrefix?: string | string[];
  /**
   * Optional WebSocket message handler.
   * Return true (or Promise<true>) to mark message as handled and prevent default pub/sub.
   */
  onWsMessage?: (
    msg: string,
    ws: ServerWebSocket,
    context: ExpansionContext,
  ) => boolean | Promise<boolean | void> | void;
  /**
   * Lifecycle hook called when module is registered/mounted
   */
  onInit?: (context: ExpansionContext) => void | Promise<void>;
  /**
   * Lifecycle hook called on shutdown or reload
   */
  onDestroy?: () => void | Promise<void>;
}

export interface LoadedApiModule {
  module: ApiModule;
  mountedPath: string;
  router: Hono;
  loadedAt: Date;
  source?: string;
}
