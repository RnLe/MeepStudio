import { StateCreator } from 'zustand';
import { CanvasStore, LatticeSlice } from '../types';

export const createLatticeSlice: StateCreator<
  CanvasStore,
  [],
  [],
  LatticeSlice
> = (set, get) => ({
  lattices: [],
  
  setLattices: (lattices) => set({ lattices }),
  
  addLattice: (lattice) => set((s) => ({ lattices: [...s.lattices, lattice] })),
  
  updateLattice: (id, partial) => set((s) => ({
    lattices: s.lattices.map(l => {
      if (l.id === id) {
        const updated = { ...l, ...partial };
        if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
          updated.center = updated.pos || { x: updated.x, y: updated.y };
        }
        // If tiedGeometryId changes, update the geometry's invisible state
        if (partial.tiedGeometryId !== undefined) {
          const oldTiedId = l.tiedGeometryId;
          const newTiedId = partial.tiedGeometryId;
          
          // Make old geometry visible again
          if (oldTiedId) {
            const geoms = get().geometries;
            const oldGeom = geoms.find(g => g.id === oldTiedId);
            if (oldGeom) {
              get().updateGeometry(oldTiedId, { invisible: false });
            }
          }
          
          // Make new geometry invisible
          if (newTiedId) {
            get().updateGeometry(newTiedId, { invisible: true });
          }
        }
        
        // If linking to a full lattice
        if (partial.latticeDocumentId !== undefined) {
          updated.latticeDocumentId = partial.latticeDocumentId;
        }
        
        // Handle fillMode and calculatedPoints updates
        if (partial.fillMode !== undefined) {
          updated.fillMode = partial.fillMode;
        }
        if (partial.calculatedPoints !== undefined) {
          updated.calculatedPoints = partial.calculatedPoints;
        }
        
        return updated;
      }
      return l;
    }),
  })),

  // Simplified batch update for lattices (position only, no tied geometry logic)
  updateLattices: (ids: string[], partial: Partial<any>) => set((s) => ({
    lattices: s.lattices.map(l => {
      if (ids.includes(l.id)) {
        const updated = { ...l, ...partial };
        if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
          updated.center = updated.pos || { x: updated.x, y: updated.y };
        }
        return updated;
      }
      return l;
    }),
  })),
  
  removeLattice: (id) => {
    // Defer everything to prevent any hooks order violations
    setTimeout(() => {
      const lattice = get().lattices.find(l => l.id === id);
      
      // Update state
      set((s) => ({
        lattices: s.lattices.filter(l => l.id !== id),
        selectedGeometryIds: s.selectedGeometryIds.filter(selId => selId !== id),
        selectedGeometryId: s.selectedGeometryId === id ? null : s.selectedGeometryId,
      }));
      
      // Then handle tied geometry
      if (lattice?.tiedGeometryId) {
        get().updateGeometry(lattice.tiedGeometryId, { invisible: false });
      }
    }, 0);
  },
  
  removeLattices: (ids) => {
    // Defer everything to prevent any hooks order violations
    setTimeout(() => {
      // Get the lattices that are about to be removed to handle tied geometries
      const currentLattices = get().lattices;
      const latticesToRemove = currentLattices.filter(l => ids.includes(l.id));
      
      // Update state
      set((s) => ({
        lattices: s.lattices.filter(l => !ids.includes(l.id)),
        selectedGeometryIds: s.selectedGeometryIds.filter(selId => !ids.includes(selId)),
        selectedGeometryId: s.selectedGeometryId && ids.includes(s.selectedGeometryId) ? null : s.selectedGeometryId,
      }));
      
      // Then handle tied geometries
      latticesToRemove.forEach(lattice => {
        if (lattice?.tiedGeometryId) {
          get().updateGeometry(lattice.tiedGeometryId, { invisible: false });
        }
      });
    }, 0);
  },
  
  linkLatticeToFullLattice: (canvasLatticeId, latticeDocumentId) => {
    get().updateLattice(canvasLatticeId, { latticeDocumentId });
  },
  
  unlinkLatticeFromFullLattice: (canvasLatticeId) => {
    get().updateLattice(canvasLatticeId, { latticeDocumentId: undefined });
  },
  
  getLinkedLatticeId: (canvasLatticeId) => {
    const lattice = get().lattices.find(l => l.id === canvasLatticeId);
    return lattice?.latticeDocumentId;
  },
  
  syncLatticeFromFullLattice: (canvasLatticeId, fullLattice) => {
    if (!fullLattice?.meepLattice) return;
    
    const { basis1, basis2 } = fullLattice.meepLattice;
    get().updateLattice(canvasLatticeId, {
      basis1: { x: basis1.x, y: basis1.y },
      basis2: { x: basis2.x, y: basis2.y },
    });
  },
  
  syncLatticesFromProject: (project) => {
    if (!project?.scene?.lattices) return;
    
    // Defer the set call to prevent hooks order violations
    setTimeout(() => {
      set({ 
        lattices: project.scene.lattices.map((l: any) => ({
          ...l,
          center: l.center || l.pos || { x: 0, y: 0 }
        }))
      });
      
      console.log('🔄 Synced lattices from project:', project.scene.lattices);
    }, 0);
  },
});
