// src/api/meepProjectService.ts
//
// Local-file implementation. 100 % Promise-based → works with React-Query.

import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import {
  MeepProject,
  serializeMeepProject,
  deserializeMeepProject,
} from "../types/meepProjectTypes";
import { getStorageDir, projectDir, sanitizeProjectName } from "../utils/fileUtils";

/* ---------- READ ALL ---------- */
export async function fetchProjects(): Promise<MeepProject[]> {
  const root = await getStorageDir();
  const dirs = await fs.readdir(root, { withFileTypes: true });

  const projects: MeepProject[] = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    try {
      const raw = await fs.readFile(path.join(root, d.name, "project.json"), "utf8");
      projects.push(deserializeMeepProject(raw));
    } catch {
      /* Ignore stray folders that are missing /project.json */
    }
  }

  return projects.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/* ---------- CREATE ---------- */
export async function createProject(p: Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">): Promise<MeepProject> {
  const now = new Date().toISOString();
  const project: MeepProject = {
    ...p,
    documentId: nanoid(),
    createdAt: now,
    updatedAt: now,
  };

  const root = await getStorageDir();
  const dir = projectDir(project.documentId, project.title, root);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "project.json"), serializeMeepProject(project));

  return project;
}

/* ---------- UPDATE ---------- */
export async function updateProject({
  documentId,
  project,
}: {
  documentId: string;
  project: MeepProject;
}): Promise<MeepProject> {
  const root = await getStorageDir();
  const dirs = await fs.readdir(root);
  const currentFolder = dirs.find((d) => d.startsWith(`${documentId}_`));
  if (!currentFolder) throw new Error(`Project ${documentId} not found on disk`);

  const now = new Date().toISOString();
  const updated: MeepProject = { ...project, updatedAt: now };

  /* Rename folder if the visible title changed */
  const desiredFolder = `${documentId}_${sanitizeProjectName(updated.title)}`;
  const desiredPath = path.join(root, desiredFolder);
  const currentPath = path.join(root, currentFolder);

  if (currentFolder !== desiredFolder) await fs.rename(currentPath, desiredPath);

  await fs.writeFile(path.join(desiredPath, "project.json"), serializeMeepProject(updated));
  return updated;
}

/* ---------- DELETE ---------- */
export async function deleteProject(documentId: string): Promise<void> {
  const root = await getStorageDir();
  const dirs = await fs.readdir(root);
  const folder = dirs.find((d) => d.startsWith(`${documentId}_`));
  if (!folder) return; // already gone → idempotent

  await fs.rm(path.join(root, folder), { recursive: true, force: true });
}
