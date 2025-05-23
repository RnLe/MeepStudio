// src/stores/ghPagesProjectsStore.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { nanoid } from "nanoid";
import { MeepProject } from "../types/meepProjectTypes";

/* ---------- Helpers ---------- */
const nowISO = () => new Date().toISOString();

/** Only the fields that can be supplied from outside are allowed in addProject. */
type CreatableFields = Omit<
  Partial<MeepProject>,
  "documentId" | "createdAt" | "updatedAt"
>;

/** Constructs a fully‑typed MeepProject object from a partial. */
function buildProject(p: CreatableFields): MeepProject {
  const timestamp = nowISO();
  return {
    documentId: nanoid(),
    createdAt: timestamp,
    updatedAt: timestamp,
    title: p.title ?? "",
    dimension: p.dimension ?? 0,
    rectWidth: p.rectWidth ?? 10,
    rectHeight: p.rectHeight ?? 10,
    description: p.description ?? "",
    lastExecution: p.lastExecution,
    lastExecutionConsoleLogs: p.lastExecutionConsoleLogs,
    pythonCode: p.pythonCode ?? "",
    geometries: p.geometries ?? [], // <-- Fix: always provide geometries
  };
}

/* ---------- Store definition ---------- */
type StoreState = {
  projects: MeepProject[];

  // CRUD operations
  addProject: (p: CreatableFields) => MeepProject;
  updateProject: (d: { documentId: string; project: Partial<MeepProject> }) => MeepProject | undefined;
  deleteProject: (id: string) => void;

  // Utility
  clear: () => void;
};

/** Zustand store persisted to localStorage (GH Pages) or simply memory (Electron) */
export const useGhPagesProjectsStore = create<StoreState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        projects: [],

        addProject: (p) => {
          const newProject = buildProject(p);
          set((s) => ({ projects: [...s.projects, newProject] }));
          return newProject;
        },

        updateProject: ({ documentId, project }) => {
          let updated: MeepProject | undefined;
          set((s) => ({
            projects: s.projects.map((pr) =>
              pr.documentId === documentId
                ? ((updated = {
                    ...pr,
                    ...project,
                    updatedAt: nowISO(),
                  }),
                  updated)
                : pr,
            ),
          }));
          return updated;
        },

        deleteProject: (id) =>
          set((s) => ({ projects: s.projects.filter((pr) => pr.documentId !== id) })),

        clear: () => set({ projects: [] }),
      }),
      {
        name: "meep-projects", // localStorage key
        version: 1,
        // Disable persistence automatically when Electron injects its own api
        skipHydration: typeof window !== "undefined" && !!window.api,
      },
    ),
  ),
);

/* ---------- Service shim (matches Svc in useMeepProjects.ts) ---------- */
export const ghPagesSvc = {
  fetchProjects: async () => useGhPagesProjectsStore.getState().projects,
  createProject: async (p: CreatableFields) =>
    useGhPagesProjectsStore.getState().addProject(p),
  updateProject: async (d: { documentId: string; project: Partial<MeepProject> }) =>
    useGhPagesProjectsStore.getState().updateProject(d),
  deleteProject: async (id: string) =>
    useGhPagesProjectsStore.getState().deleteProject(id),
};
