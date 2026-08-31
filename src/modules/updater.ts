import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

export const GITHUB_REPO = "dethz-tools/dethz-socket-core";
export const DEFAULT_TAG = "v.1.0.0";
export const DEFAULT_ZIP_URL = `https://github.com/${GITHUB_REPO}/archive/refs/tags/${DEFAULT_TAG}.zip`;

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string | null;
  latestVersion: string;
  zipUrl: string;
  releaseUrl: string;
  releaseNotes?: string;
  publishedAt?: string;
}

export interface DownloadResult {
  success: boolean;
  targetDir: string;
  extractedCount: number;
  version: string;
  zipUrl: string;
}

/**
 * Get current installed core version from core/.version or core/package.json
 */
export function getCurrentCoreVersion(coreDir = "core"): string | null {
  const resolvedDir = path.resolve(coreDir);
  const versionFilePath = path.join(resolvedDir, ".version");
  const pkgPath = path.join(resolvedDir, "package.json");

  if (fs.existsSync(versionFilePath)) {
    return fs.readFileSync(versionFilePath, "utf-8").trim();
  }

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.version) {
        return pkg.version.startsWith("v") ? pkg.version : `v.${pkg.version}`;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  return null;
}

/**
 * Check for updates from GitHub releases/tags for dethz-socket-core
 */
export async function checkForUpdate(
  repo = GITHUB_REPO,
  currentCoreDir = "core",
): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentCoreVersion(currentCoreDir);

  try {
    // 1. Try fetching latest release from GitHub API
    const res = await fetch(
      `https://api.github.com/repos/${repo}/releases/latest`,
      {
        headers: {
          "User-Agent": "dethz-socket-server",
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (res.ok) {
      const data = (await res.json()) as {
        tag_name?: string;
        html_url?: string;
        body?: string;
        published_at?: string;
        zipball_url?: string;
      };

      const latestVersion = data.tag_name || DEFAULT_TAG;
      const zipUrl =
        data.zipball_url ||
        `https://github.com/${repo}/archive/refs/tags/${latestVersion}.zip`;
      const releaseUrl =
        data.html_url ||
        `https://github.com/${repo}/releases/tag/${latestVersion}`;

      const hasUpdate =
        !currentVersion ||
        currentVersion.toLowerCase() !== latestVersion.toLowerCase();

      return {
        hasUpdate,
        currentVersion,
        latestVersion,
        zipUrl,
        releaseUrl,
        releaseNotes: data.body,
        publishedAt: data.published_at,
      };
    }

    // 2. Fallback: try tags endpoint if no releases endpoint response
    const tagsRes = await fetch(`https://api.github.com/repos/${repo}/tags`, {
      headers: {
        "User-Agent": "dethz-socket-server",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (tagsRes.ok) {
      const tags = (await tagsRes.json()) as Array<{ name: string }>;
      if (tags.length > 0) {
        const latestVersion = tags[0].name;
        const zipUrl = `https://github.com/${repo}/archive/refs/tags/${latestVersion}.zip`;
        const releaseUrl = `https://github.com/${repo}/releases/tag/${latestVersion}`;
        const hasUpdate =
          !currentVersion ||
          currentVersion.toLowerCase() !== latestVersion.toLowerCase();

        return {
          hasUpdate,
          currentVersion,
          latestVersion,
          zipUrl,
          releaseUrl,
        };
      }
    }
  } catch (error) {
    console.error("Error checking for update:", error);
  }

  // Fallback default response if offline or GitHub API rate limited
  const hasUpdate = currentVersion !== DEFAULT_TAG;
  return {
    hasUpdate,
    currentVersion,
    latestVersion: DEFAULT_TAG,
    zipUrl: DEFAULT_ZIP_URL,
    releaseUrl: `https://github.com/${repo}/releases/tag/${DEFAULT_TAG}`,
  };
}

/**
 * Unzips zip buffer into target directory, stripping top-level directory if present.
 */
export function unzipBuffer(
  zipBuffer: Buffer,
  targetDir: string,
  stripTopLevelDir = true,
): number {
  let eocdOffset = -1;
  for (let i = zipBuffer.length - 22; i >= 0; i--) {
    if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error(
      "Invalid ZIP file: End of Central Directory signature not found.",
    );
  }

  const entryCount = zipBuffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = zipBuffer.readUInt32LE(eocdOffset + 16);

  let cursor = cdOffset;
  const entries: Array<{
    fileName: string;
    compMethod: number;
    compSize: number;
    uncompSize: number;
    localHeaderOffset: number;
  }> = [];

  for (let i = 0; i < entryCount; i++) {
    if (
      cursor + 46 > zipBuffer.length ||
      zipBuffer.readUInt32LE(cursor) !== 0x02014b50
    ) {
      throw new Error(`Invalid Central Directory header at index ${i}`);
    }

    const compMethod = zipBuffer.readUInt16LE(cursor + 10);
    const compSize = zipBuffer.readUInt32LE(cursor + 20);
    const uncompSize = zipBuffer.readUInt32LE(cursor + 24);
    const nameLen = zipBuffer.readUInt16LE(cursor + 28);
    const extraLen = zipBuffer.readUInt16LE(cursor + 30);
    const commentLen = zipBuffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(cursor + 42);

    const fileName = zipBuffer.toString(
      "utf-8",
      cursor + 46,
      cursor + 46 + nameLen,
    );

    entries.push({
      fileName,
      compMethod,
      compSize,
      uncompSize,
      localHeaderOffset,
    });

    cursor += 46 + nameLen + extraLen + commentLen;
  }

  // Find top-level folder prefix inside archive to strip
  let topLevelPrefix = "";
  if (stripTopLevelDir && entries.length > 0) {
    const firstPath = entries[0].fileName;
    const slashIdx = firstPath.indexOf("/");
    if (slashIdx !== -1) {
      const candidate = firstPath.substring(0, slashIdx + 1);
      if (entries.every((e) => e.fileName.startsWith(candidate))) {
        topLevelPrefix = candidate;
      }
    }
  }

  for (const entry of entries) {
    let relPath = entry.fileName;
    if (topLevelPrefix && relPath.startsWith(topLevelPrefix)) {
      relPath = relPath.substring(topLevelPrefix.length);
    }

    if (!relPath || relPath.endsWith("/")) {
      if (relPath) {
        fs.mkdirSync(path.join(targetDir, relPath), { recursive: true });
      }
      continue;
    }

    const localHeaderPos = entry.localHeaderOffset;
    if (zipBuffer.readUInt32LE(localHeaderPos) !== 0x04034b50) {
      throw new Error(`Invalid local file header for ${entry.fileName}`);
    }

    const localNameLen = zipBuffer.readUInt16LE(localHeaderPos + 26);
    const localExtraLen = zipBuffer.readUInt16LE(localHeaderPos + 28);
    const fileDataOffset = localHeaderPos + 30 + localNameLen + localExtraLen;

    const compData = zipBuffer.subarray(
      fileDataOffset,
      fileDataOffset + entry.compSize,
    );
    let decompressed: Buffer;

    if (entry.compMethod === 0) {
      decompressed = compData;
    } else if (entry.compMethod === 8) {
      decompressed = zlib.inflateRawSync(compData);
    } else {
      throw new Error(
        `Unsupported compression method ${entry.compMethod} for ${entry.fileName}`,
      );
    }

    const destPath = path.join(targetDir, relPath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, decompressed);
  }

  return entries.length;
}

/**
 * Download zip from GitHub (or input URL) and extract into core directory
 */
export async function downloadAndExtractCore(
  tagOrUrl?: string,
  targetDir = "core",
): Promise<DownloadResult> {
  let downloadUrl = DEFAULT_ZIP_URL;
  let version = DEFAULT_TAG;

  if (tagOrUrl) {
    if (tagOrUrl.startsWith("http://") || tagOrUrl.startsWith("https://")) {
      downloadUrl = tagOrUrl;
      // Extract tag if present in GitHub URL
      const tagMatch =
        tagOrUrl.match(/\/refs\/tags\/(.+)\.zip$/) ||
        tagOrUrl.match(/\/tag\/(.+)$/);
      if (tagMatch) {
        version = tagMatch[1];
      }
    } else {
      version = tagOrUrl;
      downloadUrl = `https://github.com/${GITHUB_REPO}/archive/refs/tags/${tagOrUrl}.zip`;
    }
  }

  console.log(`[CoreUpdater] Downloading core from: ${downloadUrl}`);

  const res = await fetch(downloadUrl, {
    headers: {
      "User-Agent": "dethz-socket-server",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to download core from ${downloadUrl}: HTTP ${res.status} ${res.statusText}`,
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const resolvedTarget = path.resolve(targetDir);
  if (!fs.existsSync(resolvedTarget)) {
    fs.mkdirSync(resolvedTarget, { recursive: true });
  }

  const extractedCount = unzipBuffer(buffer, resolvedTarget, true);

  // Write version file so we can track installed version
  fs.writeFileSync(path.join(resolvedTarget, ".version"), version, "utf-8");

  console.log(
    `[CoreUpdater] Successfully extracted ${extractedCount} files into ${resolvedTarget}`,
  );

  return {
    success: true,
    targetDir: resolvedTarget,
    extractedCount,
    version,
    zipUrl: downloadUrl,
  };
}
