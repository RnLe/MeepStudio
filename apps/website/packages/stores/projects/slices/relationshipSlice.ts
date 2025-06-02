import { StateCreator } from 'zustand';
import { ProjectsStore, RelationshipSlice } from '../types';

export const createRelationshipSlice: StateCreator<
  ProjectsStore,
  [],
  [],
  RelationshipSlice
> = (set, get) => ({
  linkLatticeToProject: (latticeId, projectId) => {
    set((s) => ({
      lattices: s.lattices.map(lat => {
        if (lat.documentId === latticeId) {
          const projectIds = lat.projectIds || [];
          if (!projectIds.includes(projectId)) {
            return {
              ...lat,
              projectIds: [...projectIds, projectId],
              updatedAt: new Date().toISOString(),
            };
          }
        }
        return lat;
      }),
    }));
  },
  
  unlinkLatticeFromProject: (latticeId, projectId) => {
    set((s) => ({
      lattices: s.lattices.map(lat => {
        if (lat.documentId === latticeId && lat.projectIds) {
          return {
            ...lat,
            projectIds: lat.projectIds.filter((id: string) => id !== projectId),
            updatedAt: new Date().toISOString(),
          };
        }
        return lat;
      }),
    }));
  },
  
  syncCanvasLatticesWithFullLattice: (latticeId) => {
    const { projects, lattices, isUpdatingLattice } = get();
    
    if (isUpdatingLattice) {
      console.log('⚠️ Skipping sync during lattice update');
      return;
    }
    
    const fullLattice = lattices.find(l => l.documentId === latticeId);
    if (!fullLattice) return;
    
    console.log('🔄 Syncing canvas lattices for:', latticeId);
    
    const affectedProjects = projects.filter(project => {
      const canvasLattices = project.scene?.lattices || [];
      return canvasLattices.some((l: any) => l.latticeDocumentId === latticeId);
    });
    
    // Update each affected project in the store
    affectedProjects.forEach(project => {
      const updatedLattices = (project.scene?.lattices || []).map((l: any) => {
        if (l.latticeDocumentId === latticeId) {
          return {
            ...l,
            basis1: { x: fullLattice.meepLattice.basis1.x, y: fullLattice.meepLattice.basis1.y },
            basis2: { x: fullLattice.meepLattice.basis2.x, y: fullLattice.meepLattice.basis2.y },
          };
        }
        return l;
      });
      
      // Update the project in the store
      set((s) => ({
        projects: s.projects.map(p => 
          p.documentId === project.documentId
            ? {
                ...p,
                scene: {
                  ...p.scene,
                  lattices: updatedLattices,
                },
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      }));
    });
    
    // No direct CanvasStore or LatticeStore update here; UI should subscribe to store changes.
  },
});
