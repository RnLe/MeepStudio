// src/utils/fileUtils.ts
//
// Cross-platform helpers for a clean, deterministic data directory.

import path from "path";
import os from "os";
import { promises as fs } from "fs";

/** Ensure and return the MeepStudio root folder (…/AppData/Local/MeepStudio or ~/.local/share/MeepStudio). */
export async function getStorageDir(): Promise<string> {
  const base =
    process.platform === "win32"
      ? path.join(
          // Electron's app.getPath("appData") returns Roaming → replace with Local
          (process.env.APPDATA ?? "").replace(/\\Roaming$/, "\\Local") ||
            path.join(os.homedir(), "AppData", "Local"),
          "MeepStudio"
        )
      : path.join(os.homedir(), ".local", "share", "MeepStudio");

  await fs.mkdir(base, { recursive: true });
  return base;
}

/** Replace characters that are illegal or awkward in folder names. */
export function sanitizeProjectName(name: string): string {
  return name.replace(/[^a-z0-9_\- ]/gi, "_").replace(/\s+/g, "_");
}

/** Build the on-disk folder path for a given project. */
export function projectDir(documentId: string, title: string, root: string): string {
  return path.join(root, `${documentId}_${sanitizeProjectName(title)}`);
}
