// electron/preload.ts

import { contextBridge, ipcRenderer } from "electron";
import type { MeepProject } from "../../frontend/app/types/meepProjectTypes";

contextBridge.exposeInMainWorld("api", {
  fetchProjects: () => ipcRenderer.invoke("projects:fetch"),
  createProject: (p: MeepProject)   => ipcRenderer.invoke("projects:create", p),
  updateProject: (d: { documentId: string; project: MeepProject }) =>
    ipcRenderer.invoke("projects:update", d),
  deleteProject: (id: string)       => ipcRenderer.invoke("projects:delete", id),
});
