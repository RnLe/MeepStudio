import { StateCreator } from 'zustand';
import { CanvasStore, SelectionSlice } from '../types';

export const createSelectionSlice: StateCreator<
  CanvasStore,
  [],
  [],
  SelectionSlice
> = (set, get) => ({
  selectedGeometryIds: [],
  setSelectedGeometryIds: (ids) => set({ selectedGeometryIds: ids }),
  addSelectedGeometryId: (id) => set((s) => ({ 
    selectedGeometryIds: s.selectedGeometryIds.includes(id) 
      ? s.selectedGeometryIds 
      : [...s.selectedGeometryIds, id] 
  })),
  removeSelectedGeometryId: (id) => set((s) => ({ 
    selectedGeometryIds: s.selectedGeometryIds.filter(selId => selId !== id) 
  })),
  clearSelectedGeometryIds: () => set({ selectedGeometryIds: [] }),
  
  selectedGeometryId: null,
  selectGeometry: (id: string | null, opts?: { shift?: boolean }) => {
    if (id === null) {
      set({ selectedGeometryId: null, selectedGeometryIds: [] });
    } else if (opts && opts.shift) {
      set((s) => {
        const newIds = s.selectedGeometryIds.includes(id)
          ? s.selectedGeometryIds.filter((selId) => selId !== id)
          : [...s.selectedGeometryIds, id];
        
        return {
          selectedGeometryId: id,
          selectedGeometryIds: newIds,
        };
      });
    } else {
      set({ selectedGeometryId: id, selectedGeometryIds: [id] });
    }
  },
});
