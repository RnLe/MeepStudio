import { StateCreator } from 'zustand';
import { ProjectsStore, LatticeStateSlice } from '../types';

export const createLatticeStateSlice: StateCreator<
  ProjectsStore,
  [],
  [],
  LatticeStateSlice
> = (set, get) => ({
  lattices: [],
  
  setLattices: (lattices) => {
    set({ lattices });
  },
  
  getLatticesUsedByProject: (projectId) => {
    const { projects, lattices } = get();
    const project = projects.find(p => p.documentId === projectId);
    if (!project) return [];
    
    const canvasLattices = project.scene?.lattices || [];
    const latticeIds = canvasLattices
      .map((l: any) => l.latticeDocumentId)
      .filter(Boolean);
    
    return lattices.filter(l => latticeIds.includes(l.documentId));
  },
  
  getLatticeById: (id) => {
    return get().lattices.find(l => l.documentId === id);
  },
});
