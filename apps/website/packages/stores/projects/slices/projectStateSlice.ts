import { StateCreator } from 'zustand';
import { ProjectsStore, ProjectStateSlice } from '../types';
import { nanoid } from "nanoid";
import { MeepProject, ProjectScene, ProjectCode, ProjectLattice, LengthUnit } from '../../../types/meepProjectTypes';
import { Lattice } from 'packages/types/meepLatticeTypes';

// Storage keys
const PROJECTS_STORAGE_KEY = 'meep-projects';
const LATTICES_STORAGE_KEY = 'meep-lattices';

// Helper functions
const nowISO = () => new Date().toISOString();

async function buildProject(p: Partial<MeepProject>): Promise<MeepProject> {
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

async function buildLattice(l: Partial<Lattice>): Promise<Lattice> {
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

export const createProjectStateSlice: StateCreator<
  ProjectsStore,
  [],
  [],
  ProjectStateSlice
> = (set, get) => ({
  projects: [],
  lattices: [],
  isLoading: false,
  isUpdatingLattice: false,
  
  setIsLoading: (isLoading) => {
    set({ isLoading });
  },
  
  setIsUpdatingLattice: (isUpdating) => {
    set({ isUpdatingLattice: isUpdating });
  },
  
  setProjects: (projects) => {
    set({ projects });
  },
  
  setLattices: (lattices) => {
    set({ lattices });
  },
  
  createProject: async (p) => {
    const newProject = await buildProject(p);
    const projects = [...get().projects, newProject];
    
    // Update local state - persistence handled by Zustand middleware
    set({ projects });
    
    return newProject;
  },
  
  updateProject: async ({ documentId, project }) => {
    const existing = get().projects.find(p => p.documentId === documentId);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...project,
      updatedAt: nowISO(),
    };
    
    const projects = get().projects.map(p => 
      p.documentId === documentId ? updated : p
    );
    set({ projects });
    
    // Handle lattice syncing if scene was updated - do this asynchronously to avoid hook order issues
    if (project.scene?.lattices !== undefined) {
      // Use setTimeout to defer the sync call until after the current render cycle
      setTimeout(() => {
        const { useCanvasStore } = require('../../../providers/CanvasStore');
        const canvasStore = useCanvasStore.getState();
        canvasStore.syncLatticesFromProject(updated);
      }, 0);
    }
    
    return updated;
  },
  
  deleteProject: async (id) => {
    const projects = get().projects.filter(p => p.documentId !== id);
    set({ projects });
  },
  
  createLattice: async (l) => {
    const newLattice = await buildLattice(l);
    const lattices = [...get().lattices, newLattice];
    set({ lattices });
    return newLattice;
  },
  
  updateLattice: async ({ documentId, lattice }) => {
    const { isUpdatingLattice } = get();
    if (isUpdatingLattice) {
      console.log('⚠️ Skipping recursive updateLattice call');
      return undefined;
    }
    
    set({ isUpdatingLattice: true });
    
    try {
      const existing = get().lattices.find(l => l.documentId === documentId);
      if (!existing) return undefined;
      
      const updated = {
        ...existing,
        ...lattice,
        updatedAt: nowISO(),
      };
      
      const lattices = get().lattices.map(l => 
        l.documentId === documentId ? updated : l
      );
      set({ lattices });
      
      // Defer canvas sync to avoid loops
      setTimeout(() => {
        get().syncCanvasLatticesWithFullLattice(documentId);
      }, 0);
      
      return updated;
    } finally {
      set({ isUpdatingLattice: false });
    }
  },
  
  deleteLattice: async (id) => {
    const lattices = get().lattices.filter(l => l.documentId !== id);
    set({ lattices });
  },
  
  getProjectsUsingLattice: (latticeId) => {
    const { projects } = get();
    return projects.filter(project => {
      const canvasLattices = project.scene?.lattices || [];
      return canvasLattices.some((l: any) => l.latticeDocumentId === latticeId);
    });
  },
  
  getProjectById: (id) => {
    return get().projects.find(p => p.documentId === id);
  },
});
