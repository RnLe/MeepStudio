import { StateCreator } from 'zustand';
import { CanvasStore, SourceSlice } from '../types';

export const createSourceSlice: StateCreator<
  CanvasStore,
  [],
  [],
  SourceSlice
> = (set, get) => ({
  sources: [],
  
  setSources: (sources) => set({ 
    sources: sources.map(s => ({
      ...s,
      center: s.center || s.pos,
      orientation: s.orientation || 0
    }))
  }),
  
  addSource: (source) => set((s) => ({ 
    sources: [...s.sources, { 
      ...source, 
      center: source.center || source.pos,
      orientation: source.orientation || 0 
    }] 
  })),
  
  updateSource: (id, partial) => set((s) => ({
    sources: s.sources.map(src => {
      if (src.id === id) {
        const updated = { ...src, ...partial };
        // Update center if position changed
        if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
          updated.center = updated.pos || { x: updated.x, y: updated.y };
        }
        return updated;
      }
      return src;
    }),
  })),

  updateSources: (ids: string[], partial: Partial<any>) => set((s) => ({
    sources: s.sources.map(src => {
      if (ids.includes(src.id)) {
        const updated = { ...src, ...partial };
        // Update center if position changed
        if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
          updated.center = updated.pos || { x: updated.x, y: updated.y };
        }
        return updated;
      }
      return src;
    }),
  })),
  
  removeSource: (id) => set((s) => ({
    sources: s.sources.filter(src => src.id !== id),
    selectedGeometryIds: s.selectedGeometryIds.filter(selId => selId !== id),
    selectedGeometryId: s.selectedGeometryId === id ? null : s.selectedGeometryId,
  })),
  
  removeSources: (ids) => set((s) => ({
    sources: s.sources.filter(src => !ids.includes(src.id)),
    selectedGeometryIds: s.selectedGeometryIds.filter(selId => !ids.includes(selId)),
    selectedGeometryId: s.selectedGeometryId && ids.includes(s.selectedGeometryId) ? null : s.selectedGeometryId,
  })),
});
