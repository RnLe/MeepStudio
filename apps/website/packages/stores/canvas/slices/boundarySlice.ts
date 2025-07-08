import { StateCreator } from 'zustand';
import { CanvasStore, BoundarySlice } from '../types';

export const createBoundarySlice: StateCreator<
  CanvasStore,
  [],
  [],
  BoundarySlice
> = (set, get) => ({
  boundaries: [],
  
  setBoundaries: (boundaries) => set((state) => {
    const updated = { 
      boundaries: boundaries.map(b => ({
        ...b,
        center: { x: 0, y: 0 }
      }))
    };
    state.markCodeSectionDirty('boundaries');
    return updated;
  }),
  
  addBoundary: (boundary) => set((state) => {
    const updated = { 
      boundaries: [...state.boundaries, { 
        ...boundary,
        center: { x: 0, y: 0 }
      }] 
    };
    state.markCodeSectionDirty('boundaries');
    return updated;
  }),
  
  updateBoundary: (id, partial) => set((state) => {
    // Check if the boundary is locked - if so, prevent updates (except for lock/unlock and visibility changes)
    const existingBoundary = state.boundaries.find(b => b.id === id);
    if (existingBoundary?.locked && !('locked' in partial) && !('invisible' in partial)) {
      console.warn(`Attempted to update locked boundary with ID: ${id}`);
      return state; // Return unchanged state
    }
    
    const updated = {
      boundaries: state.boundaries.map(b => {
        if (b.id === id) {
          return { ...b, ...partial };
        }
        return b;
      }),
    };
    state.markCodeSectionDirty('boundaries');
    return updated;
  }),
  
  removeBoundary: (id) => set((state) => {
    // Check if the boundary is locked - if so, prevent removal
    const existingBoundary = state.boundaries.find(b => b.id === id);
    if (existingBoundary?.locked) {
      console.warn(`Attempted to remove locked boundary with ID: ${id}`);
      return state; // Return unchanged state
    }
    
    const updated = {
      boundaries: state.boundaries.filter(b => b.id !== id),
      selectedGeometryIds: state.selectedGeometryIds.filter(selId => selId !== id),
      selectedGeometryId: state.selectedGeometryId === id ? null : state.selectedGeometryId,
    };
    state.markCodeSectionDirty('boundaries');
    return updated;
  }),
  
  removeBoundaries: (ids) => set((state) => {
    // Filter out locked boundaries from batch removal
    const unlockedIds = ids.filter(id => {
      const boundary = state.boundaries.find(b => b.id === id);
      if (boundary?.locked) {
        console.warn(`Skipping removal for locked boundary with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked boundaries, return unchanged state
    if (unlockedIds.length === 0) {
      return state;
    }
    
    const updated = {
      boundaries: state.boundaries.filter(b => !unlockedIds.includes(b.id)),
      selectedGeometryIds: state.selectedGeometryIds.filter(selId => !unlockedIds.includes(selId)),
      selectedGeometryId: state.selectedGeometryId && unlockedIds.includes(state.selectedGeometryId) ? null : state.selectedGeometryId,
    };
    state.markCodeSectionDirty('boundaries');
    return updated;
  }),
  
  updatePMLEdgeAssignment: (boundaryId: string, edge: 'top' | 'right' | 'bottom' | 'left', parameterSetIndex: number | undefined) => {
    set((state) => {
      const updated = {
        boundaries: state.boundaries.map(b => {
          if (b.id === boundaryId && b.kind === 'pmlBoundary') {
            const edgeAssignments = { ...(b.edgeAssignments || {}) };
            if (parameterSetIndex === undefined) {
              delete edgeAssignments[edge];
            } else {
              edgeAssignments[edge] = parameterSetIndex;
            }
            return { ...b, edgeAssignments };
          }
          return b;
        }),
      };
      state.markCodeSectionDirty('boundaries');
      return updated;
    });
  },
});
