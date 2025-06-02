import { MeepProject, ProjectScene, ProjectCode, ProjectLattice } from "../../types/meepProjectTypes";
import { Lattice } from "../../types/meepLatticeTypes";

// State slice for projects
export interface ProjectStateSlice {
  projects: MeepProject[];
  setProjects: (projects: MeepProject[]) => void;
  
  // Computed getters
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
