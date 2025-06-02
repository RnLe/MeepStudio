import { StateCreator } from 'zustand';
import { ProjectsStore, ProjectStateSlice } from '../types';

export const createProjectStateSlice: StateCreator<
  ProjectsStore,
  [],
  [],
  ProjectStateSlice
> = (set, get) => ({
  projects: [],
  
  setProjects: (projects) => {
    set({ projects });
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
