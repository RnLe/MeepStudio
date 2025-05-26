// src/stores/ghPagesProjectsStore.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { nanoid } from "nanoid";
import { MeepProject, ProjectScene, ProjectCode, ProjectLattice, Lattice } from "../types/meepProjectTypes";
import { reciprocalBasis, calculateTransformationMatrices } from "../utils/latticeCalculations";

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
function buildLattice(l: CreatableLatticeFields): Lattice {
  const timestamp = nowISO();
  
  const meepLattice = l.meepLattice ?? {
    basis1: { x: 1, y: 0, z: 0 },
    basis2: { x: 0, y: 1, z: 0 },
    basis_size: { x: 1, y: 1, z: 1 }
  };
  
  // Calculate reciprocal basis and transformation matrices
  try {
    const { b1, b2 } = reciprocalBasis(meepLattice.basis1, meepLattice.basis2);
    meepLattice.reciprocal_basis1 = b1;
    meepLattice.reciprocal_basis2 = b2;
    
    const transformationMatrices = calculateTransformationMatrices(
      meepLattice.basis1,
      meepLattice.basis2
    );
    meepLattice.transformationMatrices = transformationMatrices;
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
    parameters: l.parameters ?? { a: 1, b: 1, alpha: 90 }, // Changed gamma to alpha
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

  // CRUD operations for lattices
  addLattice: (l: CreatableLatticeFields) => Lattice;
  updateLattice: (d: { documentId: string; lattice: Partial<Lattice> }) => Lattice | undefined;
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

        addLattice: (l) => {
          const newLattice = buildLattice(l);
          set((s) => ({ lattices: [...s.lattices, newLattice] }));
          return newLattice;
        },

        updateLattice: ({ documentId, lattice }) => {
          let updated: Lattice | undefined;
          set((s) => ({
            lattices: s.lattices.map((lat) => {
              if (lat.documentId === documentId) {
                const updatedLattice = {
                  ...lat,
                  ...lattice,
                  updatedAt: nowISO(),
                };
                
                // Recalculate reciprocal vectors if basis vectors changed
                if (lattice.meepLattice && (lattice.meepLattice.basis1 || lattice.meepLattice.basis2)) {
                  const basis1 = lattice.meepLattice.basis1 || lat.meepLattice.basis1;
                  const basis2 = lattice.meepLattice.basis2 || lat.meepLattice.basis2;
                  
                  try {
                    const { b1, b2 } = reciprocalBasis(basis1, basis2);
                    updatedLattice.meepLattice.reciprocal_basis1 = b1;
                    updatedLattice.meepLattice.reciprocal_basis2 = b2;
                    
                    const transformationMatrices = calculateTransformationMatrices(basis1, basis2);
                    updatedLattice.meepLattice.transformationMatrices = transformationMatrices;
                  } catch (error) {
                    console.error("Failed to calculate reciprocal lattice:", error);
                  }
                }
                
                updated = updatedLattice;
                return updated;
              }
              return lat;
            }),
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
