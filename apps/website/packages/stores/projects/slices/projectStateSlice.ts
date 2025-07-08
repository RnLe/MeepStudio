import { StateCreator } from 'zustand';
import { ProjectsStore, ProjectStateSlice } from '../types';
import { nanoid } from "nanoid";
import { MeepProject, ProjectScene, ProjectCode, ProjectLattice, LengthUnit } from '../../../types/meepProjectTypes';
import { Lattice } from 'packages/types/meepLatticeTypes';
import { getWasmModule } from '../../../utils/wasmLoader';

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
    runTime: p.scene?.runTime ?? 100,
    a: p.scene?.a ?? 1.0,
    unit: p.scene?.unit ?? LengthUnit.NM,
    material: p.scene?.material ?? "Vacuum",
    geometries: p.scene?.geometries ?? [],
    sources: p.scene?.sources ?? [],
    boundaries: p.scene?.boundaries ?? [],
    regions: p.scene?.regions ?? [],
    lattices: p.scene?.lattices ?? [],
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
  
  // Calculate reciprocal basis vectors using WASM
  try {
    const wasm = await getWasmModule();
    
    // Get scaled basis vectors
    const a1 = {
      x: meepLattice.basis1.x * meepLattice.basis_size.x,
      y: meepLattice.basis1.y * meepLattice.basis_size.y,
      z: meepLattice.basis1.z * meepLattice.basis_size.z
    };
    const a2 = {
      x: meepLattice.basis2.x * meepLattice.basis_size.x,
      y: meepLattice.basis2.y * meepLattice.basis_size.y,
      z: meepLattice.basis2.z * meepLattice.basis_size.z
    };
    
    // For 2D lattices, calculate reciprocal basis manually
    const det = a1.x * a2.y - a1.y * a2.x;
    if (Math.abs(det) > 1e-14) {
      const factor = 2 * Math.PI / det;
      meepLattice.reciprocal_basis1 = { 
        x: a2.y * factor, 
        y: -a2.x * factor,
        z: 0 
      };
      meepLattice.reciprocal_basis2 = { 
        x: -a1.y * factor, 
        y: a1.x * factor,
        z: 0 
      };
      meepLattice.reciprocal_basis3 = { x: 0, y: 0, z: 2 * Math.PI };
      
      // Calculate transformation matrices if available
      if (wasm.calculate_lattice_transformations) {
        try {
          const matrices = wasm.calculate_lattice_transformations(
            a1.x, a1.y,
            a2.x, a2.y,
            meepLattice.reciprocal_basis1.x, meepLattice.reciprocal_basis1.y,
            meepLattice.reciprocal_basis2.x, meepLattice.reciprocal_basis2.y
          );
          
          // Convert 2x2 matrices to 3x3
          const expandMatrix = (m: any): number[][] => {
            if (!m || !Array.isArray(m)) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            return [
              [m[0][0], m[0][1], 0],
              [m[1][0], m[1][1], 0],
              [0, 0, 1]
            ];
          };
          
          meepLattice.transformationMatrices = {
            MA: expandMatrix(matrices.MA),
            MA_inv: expandMatrix(matrices.MA_inv),
            MB: expandMatrix(matrices.MB),
            MB_inv: expandMatrix(matrices.MB_inv),
            realToReciprocal: expandMatrix(matrices.realToReciprocal),
            reciprocalToReal: expandMatrix(matrices.reciprocalToReal)
          };
        } catch (error) {
          console.warn("Failed to calculate transformation matrices:", error);
        }
      }
    } else {
      console.warn("Basis vectors are collinear - cannot build reciprocal lattice");
    }
  } catch (error) {
    console.warn("Failed to calculate reciprocal lattice:", error);
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
  isChangingLatticeType: false,
  
  setIsLoading: (isLoading) => {
    set({ isLoading });
  },
  
  setIsUpdatingLattice: (isUpdating) => {
    set({ isUpdatingLattice: isUpdating });
  },
  
  setIsChangingLatticeType: (isChanging) => {
    set({ isChangingLatticeType: isChanging });
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
      
      // Defer canvas sync to avoid loops - increased delay to ensure component updates complete
      setTimeout(() => {
        get().syncCanvasLatticesWithFullLattice(documentId);
      }, 200); // Increased from 0 to 200ms
      
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
