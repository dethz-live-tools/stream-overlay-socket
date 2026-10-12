import type { ApiModule } from "./types";

/**
 * Type-safe helper to define an API module for the expansion slot
 */
export function defineApiModule(module: ApiModule): ApiModule {
  return module;
}
