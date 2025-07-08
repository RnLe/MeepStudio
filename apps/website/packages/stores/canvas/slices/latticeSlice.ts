import { StateCreator } from 'zustand';
import { CanvasStore, LatticeSlice } from '../types';

export const createLatticeSlice: StateCreator<
  CanvasStore,
  [],
  [],
  LatticeSlice
> = (set, get) => ({
  lattices: [],
  
  setLattices: (lattices) => set((state) => {
    const updated = { lattices };
    state.markCodeSectionDirty('lattices');
    return updated;
  }),
  
  addLattice: (lattice) => set((state) => {
    const updated = { lattices: [...state.lattices, lattice] };
    state.markCodeSectionDirty('lattices');
    return updated;
  }),
  
  updateLattice: (id, partial) => set((s) => {
    // Check if the lattice is locked - if so, prevent updates (except for lock/unlock and visibility changes)
    const existingLattice = s.lattices.find(l => l.id === id);
    if (existingLattice?.locked && !('locked' in partial) && !('invisible' in partial)) {
      console.warn(`Attempted to update locked lattice with ID: ${id}`);
      return s; // Return unchanged state
    }
    
    return {
      lattices: s.lattices.map(l => {
        if (l.id === id) {
          const updated = { ...l, ...partial };
          
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
    };
  }),

  // Simplified batch update for lattices (position only, no tied geometry logic)
  updateLattices: (ids: string[], partial: Partial<any>) => set((s) => {
    // Filter out locked lattices from batch updates (except for lock/unlock and visibility changes)
    const unlockedIds = ids.filter(id => {
      const lattice = s.lattices.find(l => l.id === id);
      if (lattice?.locked && !('locked' in partial) && !('invisible' in partial)) {
        console.warn(`Skipping update for locked lattice with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked lattices, return unchanged state
    if (unlockedIds.length === 0) {
      return s;
    }
    
    return {
      lattices: s.lattices.map(l => {
        if (unlockedIds.includes(l.id)) {
          const updated = { ...l, ...partial };
          return updated;
        }
        return l;
      }),
    };
  }),
  
  removeLattice: (id) => {
    // Check if the lattice is locked - if so, prevent removal
    const existingLattice = get().lattices.find(l => l.id === id);
    if (existingLattice?.locked) {
      console.warn(`Attempted to remove locked lattice with ID: ${id}`);
      return; // Return early
    }
    
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
    // Filter out locked lattices from batch removal
    const unlockedIds = ids.filter(id => {
      const lattice = get().lattices.find(l => l.id === id);
      if (lattice?.locked) {
        console.warn(`Skipping removal for locked lattice with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked lattices, return early
    if (unlockedIds.length === 0) {
      return;
    }
    
    // Defer everything to prevent any hooks order violations
    setTimeout(() => {
      // Get the lattices that are about to be removed to handle tied geometries
      const currentLattices = get().lattices;
      const latticesToRemove = currentLattices.filter(l => unlockedIds.includes(l.id));
      
      // Update state
      set((s) => ({
        lattices: s.lattices.filter(l => !unlockedIds.includes(l.id)),
        selectedGeometryIds: s.selectedGeometryIds.filter(selId => !unlockedIds.includes(selId)),
        selectedGeometryId: s.selectedGeometryId && unlockedIds.includes(s.selectedGeometryId) ? null : s.selectedGeometryId,
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
    }, 0);
  },
});
