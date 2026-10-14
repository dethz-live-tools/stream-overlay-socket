import fs from "node:fs";
import path from "node:path";

export interface AppConfig {
  TEST_VALUE: string;
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_REDIRECT_URI: string;
  expansion?: Record<string, Record<string, any>>;
  [key: string]: any;
}

export const DEFAULT_CONFIG: AppConfig = {
  TEST_VALUE: "build success!",
  SPOTIFY_CLIENT_ID: "",
  SPOTIFY_CLIENT_SECRET: "",
  SPOTIFY_REDIRECT_URI: "",
  expansion: {},
};

/**
 * Locate the path to config.json in the repository or current execution context.
 */
export function resolveConfigPath(): string {
  const candidateDirs = [
    process.cwd(),
    path.resolve(__dirname, "../../"),
    path.dirname(process.execPath),
  ];

  for (const dir of candidateDirs) {
    const configPath = path.resolve(dir, "config.json");
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  // If no config.json exists yet, locate root by checking for package.json or config.example.json
  for (const dir of candidateDirs) {
    if (
      fs.existsSync(path.resolve(dir, "package.json")) ||
      fs.existsSync(path.resolve(dir, "config.example.json"))
    ) {
      return path.resolve(dir, "config.json");
    }
  }

  // Fallback to process.cwd()
  return path.resolve(process.cwd(), "config.json");
}

/**
 * Check if config.json exists. If not, create template file and load it.
 */
export function loadConfig(customConfigPath?: string): AppConfig {
  const configPath = customConfigPath ?? resolveConfigPath();

  if (!fs.existsSync(configPath)) {
    let template = JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n";
    const examplePath = path.resolve(
      path.dirname(configPath),
      "config.example.json",
    );
    if (fs.existsSync(examplePath)) {
      try {
        template = fs.readFileSync(examplePath, "utf-8");
      } catch {
        // fallback to DEFAULT_CONFIG
      }
    }

    try {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      fs.writeFileSync(configPath, template, "utf-8");
      console.log(`[config] Created default config template at ${configPath}`);
    } catch (err) {
      console.error(`[config] Failed to create ${configPath}:`, err);
    }
  }

  let loaded: AppConfig = { ...DEFAULT_CONFIG };
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    loaded = { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    console.error(`[config] Error reading ${configPath}:`, err);
  }

  return loaded;
}

const currentConfig: AppConfig = loadConfig();

export let TEST_VALUE = currentConfig.TEST_VALUE;
export let SPOTIFY_CLIENT_ID = currentConfig.SPOTIFY_CLIENT_ID;
export let SPOTIFY_CLIENT_SECRET = currentConfig.SPOTIFY_CLIENT_SECRET;
export let SPOTIFY_REDIRECT_URI = currentConfig.SPOTIFY_REDIRECT_URI;

export const config = currentConfig;

export function getConfig(): AppConfig {
  return loadConfig();
}

/**
 * Save updated configuration to config.json and reload in-memory exports.
 */
export function saveConfig(
  updates: Record<string, any>,
  customConfigPath?: string,
): AppConfig {
  const configPath = customConfigPath ?? resolveConfigPath();
  const existing = loadConfig(configPath);
  const merged = { ...existing, ...updates };

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");

  Object.assign(currentConfig, merged);
  TEST_VALUE = currentConfig.TEST_VALUE;
  SPOTIFY_CLIENT_ID = currentConfig.SPOTIFY_CLIENT_ID;
  SPOTIFY_CLIENT_SECRET = currentConfig.SPOTIFY_CLIENT_SECRET;
  SPOTIFY_REDIRECT_URI = currentConfig.SPOTIFY_REDIRECT_URI;

  return merged;
}

export default currentConfig;
