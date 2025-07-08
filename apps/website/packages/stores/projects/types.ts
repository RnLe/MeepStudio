import { MeepProject, ProjectScene, ProjectCode, ProjectLattice } from "../../types/meepProjectTypes";
import { Lattice } from "../../types/meepLatticeTypes";

// State slice for projects
export interface ProjectStateSlice {
  projects: MeepProject[];
  lattices: Lattice[];
  isLoading: boolean;
  isUpdatingLattice: boolean;
  isChangingLatticeType: boolean;
  
  // Setters
  setProjects: (projects: MeepProject[]) => void;
  setLattices: (lattices: Lattice[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsUpdatingLattice: (isUpdating: boolean) => void;
  setIsChangingLatticeType: (isChanging: boolean) => void;
  
  // CRUD operations
  createProject: (project: Partial<MeepProject>) => Promise<MeepProject>;
  updateProject: (data: { documentId: string; project: Partial<MeepProject> }) => Promise<MeepProject | undefined>;
  deleteProject: (id: string) => Promise<void>;
  createLattice: (lattice: Partial<Lattice>) => Promise<Lattice>;
  updateLattice: (data: { documentId: string; lattice: Partial<Lattice> }) => Promise<Lattice | undefined>;
  deleteLattice: (id: string) => Promise<void>;
  
  // Queries
  getProjectsUsingLattice: (latticeId: string) => MeepProject[];
  getProjectById: (id: string) => MeepProject | undefined;
}

// State slice for lattices
export interface LatticeStateSlice {
  lattices: Lattice[];
  setLattices: (lattices: Lattice[]) => void;
  
  // Computed getters
  getLatticesUsedByProject: (projectId: string) => Lattice[];
  getLatticeById: (id: string) => Lattice | undefined;
}

// Relationship management slice
export interface RelationshipSlice {
  // Project-Lattice relationships
  linkLatticeToProject: (latticeId: string, projectId: string) => void;
  unlinkLatticeFromProject: (latticeId: string, projectId: string) => void;
  syncCanvasLatticesWithFullLattice: (latticeId: string) => void;
}

// Update tracking slice
export interface UpdateTrackingSlice {
  isUpdatingLattice: boolean;
  setIsUpdatingLattice: (updating: boolean) => void;
}

// Complete store type
export type ProjectsStore = 
  & ProjectStateSlice
  & LatticeStateSlice
  & RelationshipSlice
  & UpdateTrackingSlice;
