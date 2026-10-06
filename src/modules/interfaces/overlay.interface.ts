export interface OverlayMeta {
  name: string;
  description?: string;
  image?: string;
  author?: string;
  libs?: string[];
  [key: string]: unknown;
}

export interface LibRepoInfo {
  /** Original raw string from meta.yaml, e.g. "dethz-live-tools/dethz-lib" */
  raw: string;
  /** Extracted library/repo name, e.g. "dethz-lib" */
  name: string;
  /** Git clone URL, e.g. "https://github.com/dethz-live-tools/dethz-lib.git" */
  cloneUrl: string;
  /** Local target path, e.g. "static/libs/dethz-lib" */
  targetDir: string;
}

export type GitActionType = "cloned" | "pulled" | "up-to-date" | "skipped";

export interface SyncLibResult {
  lib: LibRepoInfo;
  action: GitActionType;
  success: boolean;
  output?: string;
  error?: string;
}

export interface SyncOverlayResult {
  overlay: string;
  metaPath: string | null;
  meta: OverlayMeta | null;
  libs: SyncLibResult[];
}
