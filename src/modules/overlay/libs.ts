import fs from "node:fs";
import path from "node:path";
import { $ } from "bun";
import { parse } from "yaml";
import type {
  OverlayMeta,
  LibRepoInfo,
  GitActionType,
  SyncLibResult,
  SyncOverlayResult,
} from "../interfaces/overlay.interface";

/**
 * Locate meta.yaml or meta.yml given an overlay directory or direct file path.
 */
export function findMetaFile(targetPath: string): string | null {
  const candidates = [
    targetPath,
    path.join(targetPath, "meta.yaml"),
    path.join(targetPath, "meta.yml"),
    path.join("static", targetPath, "meta.yaml"),
    path.join("static", targetPath, "meta.yml"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) {
          return candidate;
        }
      } catch {
        // ignore error and check next candidate
      }
    }
  }

  return null;
}

/**
 * Read and parse meta.yaml or meta.yml from an overlay directory or file path.
 */
export async function readMetaYaml(
  dirOrFilePath: string,
): Promise<OverlayMeta | null> {
  const metaPath = findMetaFile(dirOrFilePath);
  if (!metaPath) {
    return null;
  }

  try {
    const file = Bun.file(metaPath);
    const content = await file.text();
    const parsed = parse(content) as OverlayMeta;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    // Normalize libs field
    if (typeof parsed.libs === "string") {
      parsed.libs = [parsed.libs];
    } else if (!Array.isArray(parsed.libs)) {
      parsed.libs = [];
    }

    return parsed;
  } catch (err) {
    console.error(`[OverlayLib] Failed to read/parse meta file "${metaPath}":`, err);
    return null;
  }
}

/**
 * Parse a library string from meta.yaml into repo details and target directory.
 * Supports:
 * - Shorthand: "owner/repo" (e.g. "dethz-live-tools/dethz-lib")
 * - HTTP(S) URL: "https://github.com/owner/repo.git"
 * - SSH URL: "git@github.com:owner/repo.git"
 */
export function parseLibRepo(
  raw: string,
  libsBaseDir = "static/libs",
): LibRepoInfo {
  const trimmed = raw.trim();
  let cloneUrl = trimmed;
  let repoName = "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("git@")
  ) {
    cloneUrl = trimmed;
    // Strip trailing .git and extract the last segment
    const clean = trimmed.replace(/\.git$/, "");
    const parts = clean.split(/[/:]/);
    repoName = parts[parts.length - 1];
  } else if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    // GitHub shorthand: owner/repo
    cloneUrl = `https://github.com/${trimmed}.git`;
    repoName = trimmed.split("/")[1];
  } else {
    repoName = trimmed.replace(/[^a-zA-Z0-9_.-]/g, "_");
    cloneUrl = `https://github.com/${trimmed}.git`;
  }

  // Ensure cloneUrl ends with .git if standard https github url
  if (cloneUrl.startsWith("https://github.com/") && !cloneUrl.endsWith(".git")) {
    cloneUrl = `${cloneUrl}.git`;
  }

  const targetDir = path.join(libsBaseDir, repoName);

  return {
    raw: trimmed,
    name: repoName,
    cloneUrl,
    targetDir,
  };
}

/**
 * Pull updates if repository exists, or clone it if it does not exist.
 */
export async function pullOrCloneRepo(
  cloneUrl: string,
  targetDir: string,
): Promise<{ action: GitActionType; output: string }> {
  const resolvedTarget = path.resolve(targetDir);
  const gitDir = path.join(resolvedTarget, ".git");

  if (fs.existsSync(gitDir)) {
    // Repository already exists -> git pull
    const proc = await $`git pull`.cwd(resolvedTarget).quiet().nothrow();
    const stdout = proc.stdout.toString().trim();
    const stderr = proc.stderr.toString().trim();
    const output = [stdout, stderr].filter(Boolean).join("\n");

    if (proc.exitCode !== 0) {
      throw new Error(
        `git pull failed in "${targetDir}" (exit ${proc.exitCode}): ${output}`,
      );
    }

    const isUpToDate =
      stdout.toLowerCase().includes("already up to date") ||
      stdout.toLowerCase().includes("already up-to-date");

    return {
      action: isUpToDate ? "up-to-date" : "pulled",
      output,
    };
  } else {
    // Target directory does not exist or has no .git -> git clone
    const parentDir = path.dirname(resolvedTarget);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const proc = await $`git clone ${cloneUrl} ${resolvedTarget}`.quiet().nothrow();
    const stdout = proc.stdout.toString().trim();
    const stderr = proc.stderr.toString().trim();
    const output = [stdout, stderr].filter(Boolean).join("\n");

    if (proc.exitCode !== 0) {
      throw new Error(
        `git clone failed for "${cloneUrl}" (exit ${proc.exitCode}): ${output}`,
      );
    }

    return {
      action: "cloned",
      output,
    };
  }
}

/**
 * Pull or clone a single library dependency by raw string (e.g. "dethz-live-tools/dethz-lib").
 */
export async function pullLib(
  rawLib: string,
  libsBaseDir = "static/libs",
): Promise<SyncLibResult> {
  const libInfo = parseLibRepo(rawLib, libsBaseDir);
  try {
    const res = await pullOrCloneRepo(libInfo.cloneUrl, libInfo.targetDir);
    return {
      lib: libInfo,
      action: res.action,
      success: true,
      output: res.output,
    };
  } catch (err: any) {
    return {
      lib: libInfo,
      action: "skipped",
      success: false,
      error: err?.message || String(err),
    };
  }
}

/**
 * Read meta.yaml for a specific overlay directory and pull/clone all libraries listed in `libs`.
 */
export async function syncOverlayLibs(
  overlayDirOrMetaPath: string,
  libsBaseDir = "static/libs",
): Promise<SyncOverlayResult> {
  const metaPath = findMetaFile(overlayDirOrMetaPath);
  const overlayName = metaPath
    ? path.basename(path.dirname(path.resolve(metaPath)))
    : path.basename(overlayDirOrMetaPath);

  const meta = await readMetaYaml(overlayDirOrMetaPath);
  if (!meta) {
    return {
      overlay: overlayName,
      metaPath: null,
      meta: null,
      libs: [],
    };
  }

  const libs = meta.libs || [];
  const results: SyncLibResult[] = [];

  for (const rawLib of libs) {
    const res = await pullLib(rawLib, libsBaseDir);
    results.push(res);
  }

  return {
    overlay: overlayName,
    metaPath,
    meta,
    libs: results,
  };
}

/**
 * Scan all overlay directories inside staticDir (excluding 'libs' and hidden folders),
 * collect all unique libraries from their meta.yaml, and pull/clone them.
 */
export async function syncAllStaticLibs(
  staticDir = "static",
  libsBaseDir = "static/libs",
): Promise<SyncLibResult[]> {
  const resolvedStatic = path.resolve(staticDir);
  if (!fs.existsSync(resolvedStatic)) {
    return [];
  }

  const entries = fs.readdirSync(resolvedStatic, { withFileTypes: true });
  const overlayDirs = entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        entry.name !== "libs" &&
        !entry.name.startsWith("."),
    )
    .map((entry) => path.join(resolvedStatic, entry.name));

  const libMap = new Map<string, LibRepoInfo>();

  for (const dir of overlayDirs) {
    const meta = await readMetaYaml(dir);
    if (meta && Array.isArray(meta.libs)) {
      for (const rawLib of meta.libs) {
        const info = parseLibRepo(rawLib, libsBaseDir);
        // Deduplicate by target directory name
        if (!libMap.has(info.name)) {
          libMap.set(info.name, info);
        }
      }
    }
  }

  const results: SyncLibResult[] = [];
  for (const libInfo of libMap.values()) {
    try {
      const res = await pullOrCloneRepo(libInfo.cloneUrl, libInfo.targetDir);
      results.push({
        lib: libInfo,
        action: res.action,
        success: true,
        output: res.output,
      });
    } catch (err: any) {
      results.push({
        lib: libInfo,
        action: "skipped",
        success: false,
        error: err?.message || String(err),
      });
    }
  }

  return results;
}

/**
 * Install an overlay via Git repository and automatically pull all libraries specified in its meta.yaml.
 */
export async function installOverlay(
  overlayRepoUrl: string,
  staticDir = "static",
  libsBaseDir = "static/libs",
): Promise<{ overlayDir: string; syncResult: SyncOverlayResult }> {
  const repoInfo = parseLibRepo(overlayRepoUrl, staticDir);
  const overlayDir = repoInfo.targetDir;

  // 1. Pull or clone overlay repository
  await pullOrCloneRepo(repoInfo.cloneUrl, overlayDir);

  // 2. Read meta.yaml and sync all its required libraries
  const syncResult = await syncOverlayLibs(overlayDir, libsBaseDir);

  return {
    overlayDir,
    syncResult,
  };
}
