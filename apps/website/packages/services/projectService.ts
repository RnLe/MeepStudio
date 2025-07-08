// src/services/projectService.ts
import { nanoid } from "nanoid";
import { MeepProject, ProjectScene, ProjectCode, ProjectLattice, LengthUnit } from "../types/meepProjectTypes";
import { Lattice } from "../types/meepLatticeTypes";
import { getWasmModule } from "../utils/wasmLoader";

export type CreatableProjectFields = Omit<
  Partial<MeepProject>,
  "documentId" | "createdAt" | "updatedAt"
>;

export type CreatableLatticeFields = Omit<
  Partial<Lattice>,
  "documentId" | "createdAt" | "updatedAt"
>;

// Service interface
export interface ProjectService {
  // Projects
  fetchProjects: () => Promise<MeepProject[]>;
  createProject: (p: CreatableProjectFields) => Promise<MeepProject>;
  updateProject: (d: { documentId: string; project: Partial<MeepProject> }) => Promise<MeepProject | undefined>;
  deleteProject: (id: string) => Promise<void>;
  
  // Lattices
  fetchLattices: () => Promise<Lattice[]>;
  createLattice: (l: CreatableLatticeFields) => Promise<Lattice>;
  updateLattice: (d: { documentId: string; lattice: Partial<Lattice> }) => Promise<Lattice | undefined>;
  deleteLattice: (id: string) => Promise<void>;
}

// Helper functions
const nowISO = () => new Date().toISOString();

async function buildProject(p: CreatableProjectFields): Promise<MeepProject> {
  const timestamp = nowISO();
  
  const defaultScene: ProjectScene = {
    dimension: p.scene?.dimension ?? 0,
    rectWidth: p.scene?.rectWidth ?? 10,
    rectHeight: p.scene?.rectHeight ?? 10,
    resolution: p.scene?.resolution ?? 4,
    a: p.scene?.a ?? 1.0,
    unit: p.scene?.unit ?? LengthUnit.NM,
    geometries: p.scene?.geometries ?? [],
    sources: p.scene?.sources ?? [],
  };

  const defaultCode: ProjectCode | undefined = p.code ? {
    pythonCode: p.code.pythonCode ?? "",
    lastExecution: p.code.lastExecution,
    lastExecutionConsoleLogs: p.code.lastExecutionConsoleLogs,
    additionalFiles: p.code.additionalFiles ?? {},
  } : undefined;

  const defaultLattice: ProjectLattice | undefined = p.lattice ? {
    latticeIds: p.lattice.latticeIds,
    latticeData: p.lattice.latticeData,
  } : undefined;

  return {
    documentId: nanoid(),
    createdAt: timestamp,
    updatedAt: timestamp,
    title: p.title ?? "",
    description: p.description ?? "",
    scene: defaultScene,
    code: defaultCode,
    lattice: defaultLattice,
  };
}

async function buildLattice(l: CreatableLatticeFields): Promise<Lattice> {
  const timestamp = nowISO();
  
  const meepLattice = l.meepLattice ?? {
    basis1: { x: 1, y: 0, z: 0 },
    basis2: { x: 0, y: 1, z: 0 },
    basis3: { x: 0, y: 0, z: 1 },
    basis_size: { x: 1, y: 1, z: 1 }
  };
  
  // Ensure basis3 exists
  if (!meepLattice.basis3) {
    meepLattice.basis3 = { x: 0, y: 0, z: 1 };
  }
  
  // Calculate reciprocal basis and transformation matrices
  try {
    const wasm = await getWasmModule();
    
    // ...existing calculation code...
    
  } catch (error) {
    console.error("Failed to calculate reciprocal lattice:", error);
  }
  
  return {
    documentId: nanoid(),
    createdAt: timestamp,
    updatedAt: timestamp,
    title: l.title ?? "Untitled Lattice",
    description: l.description,
    latticeType: l.latticeType ?? "square",
    meepLattice,
    parameters: l.parameters ?? { a: 1, b: 1, alpha: 90 },
    displaySettings: l.displaySettings ?? {
      showWignerSeitz: false,
      showBrillouinZone: false,
      showHighSymmetryPoints: false,
      showReciprocal: false,
    },
    latticeData: l.latticeData,
  };
}

// Local storage service implementation
export const createLocalStorageService = (): ProjectService => {
  const STORAGE_KEY = 'meep-projects';
  
  // Get the store instance
  const getStore = () => {
    if (typeof window !== 'undefined') {
      const { useProjectsStore } = require('../stores/projects');
      return useProjectsStore.getState();
    }
    throw new Error('Store not available');
  };
  
  return {
    fetchProjects: async () => {
      const store = getStore();
      return store.projects;
    },
    
    createProject: async (p) => {
      const newProject = await buildProject(p);
      const store = getStore();
      store.setProjects([...store.projects, newProject]);
      return newProject;
    },
    
    updateProject: async ({ documentId, project }) => {
      const store = getStore();
      const existing = store.projects.find((p: MeepProject) => p.documentId === documentId);
      if (!existing) return undefined;
      const updated = {
        ...existing,
        ...project,
        updatedAt: nowISO(),
      };
      store.setProjects(
        store.projects.map((p: MeepProject) => p.documentId === documentId ? updated : p)
      );
      // Handle lattice syncing if scene was updated - do this asynchronously to avoid hook order issues
      if (project.scene?.lattices !== undefined) {
        // Use setTimeout to defer the sync call until after the current render cycle
        setTimeout(() => {
          const { useCanvasStore } = require('../providers/CanvasStore');
          const canvasStore = useCanvasStore.getState();
          canvasStore.syncLatticesFromProject(updated);
        }, 0);
      }
      return updated;
    },
    
    deleteProject: async (id) => {
      const store = getStore();
      store.setProjects(store.projects.filter((p: MeepProject) => p.documentId !== id));
    },
    
    fetchLattices: async () => {
      const store = getStore();
      return store.lattices;
    },
    
    createLattice: async (l) => {
      const newLattice = await buildLattice(l);
      const store = getStore();
      store.setLattices([...store.lattices, newLattice]);
      return newLattice;
    },
    
    updateLattice: async ({ documentId, lattice }) => {
      const store = getStore();
      if (store.isUpdatingLattice) {
        return undefined;
      }
      store.setIsUpdatingLattice(true);
      try {
        const existing = store.lattices.find((l: Lattice) => l.documentId === documentId);
        if (!existing) return undefined;
        const updated = {
          ...existing,
          ...lattice,
          updatedAt: nowISO(),
        };
        store.setLattices(
          store.lattices.map((l: Lattice) => l.documentId === documentId ? updated : l)
        );
        setTimeout(() => {
          store.syncCanvasLatticesWithFullLattice(documentId);
        }, 0);
        return updated;
      } finally {
        store.setIsUpdatingLattice(false);
      }
    },
    deleteLattice: async (id) => {
      const store = getStore();
      store.setLattices(store.lattices.filter((l: Lattice) => l.documentId !== id));
    },
  };
};

// Remote API service implementation
export const createRemoteService = (): ProjectService => {
  const wrapFetch = async <T>(url: string, init?: RequestInit) =>
    fetch(url, init).then((r) => r.json() as Promise<T>);
  
  return {
    fetchProjects: () => wrapFetch<MeepProject[]>("/api/projects"),
    createProject: (p) =>
      wrapFetch<MeepProject>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      }),
    updateProject: ({ documentId, project }) =>
      wrapFetch<MeepProject>(`/api/projects/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      }),
    deleteProject: (id) => 
      wrapFetch<void>(`/api/projects/${id}`, { method: "DELETE" }),
      
    // Lattice endpoints
    fetchLattices: () => wrapFetch<Lattice[]>("/api/lattices"),
    createLattice: (l) =>
      wrapFetch<Lattice>("/api/lattices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(l),
      }),
    updateLattice: ({ documentId, lattice }) =>
      wrapFetch<Lattice>(`/api/lattices/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lattice),
      }),
    deleteLattice: (id) => 
      wrapFetch<void>(`/api/lattices/${id}`, { method: "DELETE" }),
  };
};