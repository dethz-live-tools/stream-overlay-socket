import type { ApiModule, ApiModuleFactory } from "./types";

/**
 * Type-safe helper to define an API module for the expansion slot
 */
export function defineApiModule(
  module: ApiModule | ApiModuleFactory,
): ApiModule | ApiModuleFactory {
  return module;
}
