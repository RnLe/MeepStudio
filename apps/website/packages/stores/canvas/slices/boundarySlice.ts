import { StateCreator } from 'zustand';
import { CanvasStore, BoundarySlice } from '../types';

export const createBoundarySlice: StateCreator<
  CanvasStore,
  [],
  [],
  BoundarySlice
> = (set, get) => ({
  boundaries: [],
  
  setBoundaries: (boundaries) => set({ 
    boundaries: boundaries.map(b => ({
      ...b,
      center: { x: 0, y: 0 }
    }))
  }),
  
  addBoundary: (boundary) => set((s) => ({ 
    boundaries: [...s.boundaries, { 
      ...boundary,
      center: { x: 0, y: 0 }
    }] 
  })),
  
  updateBoundary: (id, partial) => set((s) => ({
    boundaries: s.boundaries.map(b => {
      if (b.id === id) {
        return { ...b, ...partial };
      }
      return b;
    }),
  })),
  
  removeBoundary: (id) => set((s) => ({
    boundaries: s.boundaries.filter(b => b.id !== id),
    selectedGeometryIds: s.selectedGeometryIds.filter(selId => selId !== id),
    selectedGeometryId: s.selectedGeometryId === id ? null : s.selectedGeometryId,
  })),
  
  removeBoundaries: (ids) => set((s) => ({
    boundaries: s.boundaries.filter(b => !ids.includes(b.id)),
    selectedGeometryIds: s.selectedGeometryIds.filter(selId => !ids.includes(selId)),
    selectedGeometryId: s.selectedGeometryId && ids.includes(s.selectedGeometryId) ? null : s.selectedGeometryId,
  })),
  
  updatePMLEdgeAssignment: (boundaryId: string, edge: 'top' | 'right' | 'bottom' | 'left', parameterSetIndex: number | undefined) => {
    set((s) => ({
      boundaries: s.boundaries.map(b => {
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
    }));
  },
});
