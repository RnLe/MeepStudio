// src/stores/ghPagesProjectsStore.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { nanoid } from "nanoid";
import { MeepProject, ProjectScene, ProjectCode, ProjectLattice, Lattice } from "../types/meepProjectTypes";
import { getWasmModule } from "../utils/wasmLoader";

/* ---------- Helpers ---------- */
const nowISO = () => new Date().toISOString();

/** Only the fields that can be supplied from outside are allowed in addProject. */
type CreatableProjectFields = Omit<
  Partial<MeepProject>,
  "documentId" | "createdAt" | "updatedAt"
>;

type CreatableLatticeFields = Omit<
  Partial<Lattice>,
  "documentId" | "createdAt" | "updatedAt"
>;

/** Constructs a fully‑typed MeepProject object from a partial. */
function buildProject(p: CreatableProjectFields): MeepProject {
  const timestamp = nowISO();
  
  // Build default scene
  const defaultScene: ProjectScene = {
    dimension: p.scene?.dimension ?? 0,
    rectWidth: p.scene?.rectWidth ?? 10,
    rectHeight: p.scene?.rectHeight ?? 10,
    resolution: p.scene?.resolution ?? 4,
    geometries: p.scene?.geometries ?? [],
  };

  // Build default code (optional)
  const defaultCode: ProjectCode | undefined = p.code ? {
    pythonCode: p.code.pythonCode ?? "",
    lastExecution: p.code.lastExecution,
    lastExecutionConsoleLogs: p.code.lastExecutionConsoleLogs,
    additionalFiles: p.code.additionalFiles ?? {},
  } : undefined;

  // Build default lattice (optional)
  const defaultLattice: ProjectLattice | undefined = p.lattice ? {
    latticeId: p.lattice.latticeId,
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

/** Constructs a fully‑typed Lattice object from a partial. */
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
  
  // Calculate reciprocal basis and transformation matrices using WASM
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
    const a3 = {
      x: meepLattice.basis3.x * meepLattice.basis_size.x,
      y: meepLattice.basis3.y * meepLattice.basis_size.y,
      z: meepLattice.basis3.z * meepLattice.basis_size.z
    };
    
    // For 2D lattices, calculate reciprocal basis manually
    if (Math.abs(a1.z) < 1e-10 && Math.abs(a2.z) < 1e-10) {
      // Calculate 2D reciprocal basis
      const det = a1.x * a2.y - a1.y * a2.x;
      if (Math.abs(det) < 1e-14) {
        throw new Error("Basis vectors are collinear - cannot build reciprocal lattice.");
      }
      
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
      meepLattice.reciprocal_basis3 = { x: 0, y: 0, z: 2 * Math.PI / a3.z };
    }
    
    // Check if we have the 3D function, otherwise skip
    if (wasm.calculate_lattice_transformations_3d) {
      const matrices = wasm.calculate_lattice_transformations_3d(
        a1.x, a1.y, a1.z,
        a2.x, a2.y, a2.z,
        a3.x, a3.y, a3.z,
        meepLattice.reciprocal_basis1!.x, meepLattice.reciprocal_basis1!.y, meepLattice.reciprocal_basis1!.z,
        meepLattice.reciprocal_basis2!.x, meepLattice.reciprocal_basis2!.y, meepLattice.reciprocal_basis2!.z,
        meepLattice.reciprocal_basis3!.x, meepLattice.reciprocal_basis3!.y, meepLattice.reciprocal_basis3!.z
      );
      
      meepLattice.transformationMatrices = matrices;
    } else if (wasm.calculate_lattice_transformations) {
      // Fallback to 2D version if 3D is not available
      const matrices2d = wasm.calculate_lattice_transformations(
        a1.x, a1.y,
        a2.x, a2.y,
        meepLattice.reciprocal_basis1!.x, meepLattice.reciprocal_basis1!.y,
        meepLattice.reciprocal_basis2!.x, meepLattice.reciprocal_basis2!.y
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
        MA: expandMatrix(matrices2d.MA),
        MA_inv: expandMatrix(matrices2d.MA_inv),
        MB: expandMatrix(matrices2d.MB),
        MB_inv: expandMatrix(matrices2d.MB_inv),
        realToReciprocal: expandMatrix(matrices2d.realToReciprocal),
        reciprocalToReal: expandMatrix(matrices2d.reciprocalToReal)
      };
    }
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

/* ---------- Store definition ---------- */
type StoreState = {
  projects: MeepProject[];
  lattices: Lattice[];

  // CRUD operations for projects
  addProject: (p: CreatableProjectFields) => MeepProject;
  updateProject: (d: { documentId: string; project: Partial<MeepProject> }) => MeepProject | undefined;
  deleteProject: (id: string) => void;

  // CRUD operations for lattices - make these async
  addLattice: (l: CreatableLatticeFields) => Promise<Lattice>;
  updateLattice: (d: { documentId: string; lattice: Partial<Lattice> }) => Promise<Lattice | undefined>;
  deleteLattice: (id: string) => void;

  // Utility
  clear: () => void;
};

/** Zustand store persisted to localStorage (GH Pages) or simply memory (Electron) */
export const useGhPagesProjectsStore = create<StoreState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        projects: [],
        lattices: [],

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

        addLattice: async (l) => {
          const newLattice = await buildLattice(l);
          set((s) => ({ lattices: [...s.lattices, newLattice] }));
          return newLattice;
        },

        updateLattice: async ({ documentId, lattice }) => {
          let updated: Lattice | undefined;
          
          // Get current lattice
          const currentLattice = get().lattices.find(lat => lat.documentId === documentId);
          if (!currentLattice) return undefined;
          
          // Merge update
          const merged = {
            ...currentLattice,
            ...lattice,
            updatedAt: nowISO(),
          };
          
          // Ensure basis3 exists
          if (merged.meepLattice && !merged.meepLattice.basis3) {
            merged.meepLattice.basis3 = { x: 0, y: 0, z: 1 };
          }
          
          // Recalculate if basis vectors changed
          if (lattice.meepLattice && (lattice.meepLattice.basis1 || lattice.meepLattice.basis2 || lattice.meepLattice.basis3)) {
            const basis1 = lattice.meepLattice.basis1 || currentLattice.meepLattice.basis1;
            const basis2 = lattice.meepLattice.basis2 || currentLattice.meepLattice.basis2;
            const basis3 = lattice.meepLattice.basis3 || currentLattice.meepLattice.basis3 || { x: 0, y: 0, z: 1 };
            const basis_size = lattice.meepLattice.basis_size || currentLattice.meepLattice.basis_size;
            
            try {
              const wasm = await getWasmModule();
              
              // Get scaled basis vectors
              const a1 = {
                x: basis1.x * basis_size.x,
                y: basis1.y * basis_size.y,
                z: basis1.z * basis_size.z
              };
              const a2 = {
                x: basis2.x * basis_size.x,
                y: basis2.y * basis_size.y,
                z: basis2.z * basis_size.z
              };
              const a3 = {
                x: basis3.x * basis_size.x,
                y: basis3.y * basis_size.y,
                z: basis3.z * basis_size.z
              };
              
              // For 2D lattices, calculate reciprocal basis manually
              if (Math.abs(a1.z) < 1e-10 && Math.abs(a2.z) < 1e-10) {
                // Calculate 2D reciprocal basis
                const det = a1.x * a2.y - a1.y * a2.x;
                if (Math.abs(det) < 1e-14) {
                  throw new Error("Basis vectors are collinear - cannot build reciprocal lattice.");
                }
                
                const factor = 2 * Math.PI / det;
                merged.meepLattice.reciprocal_basis1 = { 
                  x: a2.y * factor, 
                  y: -a2.x * factor,
                  z: 0 
                };
                merged.meepLattice.reciprocal_basis2 = { 
                  x: -a1.y * factor, 
                  y: a1.x * factor,
                  z: 0 
                };
                merged.meepLattice.reciprocal_basis3 = { x: 0, y: 0, z: 2 * Math.PI / a3.z };
              }
              
              // Check if we have the 3D function
              if (wasm.calculate_lattice_transformations_3d) {
                const matrices = wasm.calculate_lattice_transformations_3d(
                  a1.x, a1.y, a1.z,
                  a2.x, a2.y, a2.z,
                  a3.x, a3.y, a3.z,
                  merged.meepLattice.reciprocal_basis1!.x, merged.meepLattice.reciprocal_basis1!.y, merged.meepLattice.reciprocal_basis1!.z,
                  merged.meepLattice.reciprocal_basis2!.x, merged.meepLattice.reciprocal_basis2!.y, merged.meepLattice.reciprocal_basis2!.z,
                  merged.meepLattice.reciprocal_basis3!.x, merged.meepLattice.reciprocal_basis3!.y, merged.meepLattice.reciprocal_basis3!.z
                );
                
                merged.meepLattice.transformationMatrices = matrices;
              } else if (wasm.calculate_lattice_transformations) {
                // Fallback to 2D version
                const matrices2d = wasm.calculate_lattice_transformations(
                  a1.x, a1.y,
                  a2.x, a2.y,
                  merged.meepLattice.reciprocal_basis1!.x, merged.meepLattice.reciprocal_basis1!.y,
                  merged.meepLattice.reciprocal_basis2!.x, merged.meepLattice.reciprocal_basis2!.y
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
                
                merged.meepLattice.transformationMatrices = {
                  MA: expandMatrix(matrices2d.MA),
                  MA_inv: expandMatrix(matrices2d.MA_inv),
                  MB: expandMatrix(matrices2d.MB),
                  MB_inv: expandMatrix(matrices2d.MB_inv),
                  realToReciprocal: expandMatrix(matrices2d.realToReciprocal),
                  reciprocalToReal: expandMatrix(matrices2d.reciprocalToReal)
                };
              }
            } catch (error) {
              console.error("Failed to calculate reciprocal lattice:", error);
            }
          }
          
          updated = merged;
          
          set((s) => ({
            lattices: s.lattices.map((lat) => 
              lat.documentId === documentId ? updated! : lat
            ),
          }));
          
          return updated;
        },

        deleteLattice: (id) =>
          set((s) => ({ lattices: s.lattices.filter((lat) => lat.documentId !== id) })),

        clear: () => set({ projects: [], lattices: [] }),
      }),
      {
        name: "meep-projects", // localStorage key
        version: 2, // Bump version to migrate data structure
        // Disable persistence automatically when Electron injects its own api
        skipHydration: typeof window !== "undefined" && !!window.api,
      },
    ),
  ),
);

/* ---------- Service shim (matches Svc in useMeepProjects.ts) ---------- */
export const ghPagesSvc = {
  // Projects
  fetchProjects: async () => useGhPagesProjectsStore.getState().projects,
  createProject: async (p: CreatableProjectFields) =>
    useGhPagesProjectsStore.getState().addProject(p),
  updateProject: async (d: { documentId: string; project: Partial<MeepProject> }) =>
    useGhPagesProjectsStore.getState().updateProject(d),
  deleteProject: async (id: string) =>
    useGhPagesProjectsStore.getState().deleteProject(id),
    
  // Lattices
  fetchLattices: async () => useGhPagesProjectsStore.getState().lattices,
  createLattice: async (l: CreatableLatticeFields) =>
    useGhPagesProjectsStore.getState().addLattice(l),
  updateLattice: async (d: { documentId: string; lattice: Partial<Lattice> }) =>
    useGhPagesProjectsStore.getState().updateLattice(d),
  deleteLattice: async (id: string) =>
    useGhPagesProjectsStore.getState().deleteLattice(id),
};
