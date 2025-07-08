import { StateCreator } from 'zustand';
import { CanvasStore, SourceSlice } from '../types';

export const createSourceSlice: StateCreator<
  CanvasStore,
  [],
  [],
  SourceSlice
> = (set, get) => ({
  sources: [],
  
  setSources: (sources) => set((state) => {
    const updated = { 
      sources: sources.map(s => ({
        ...s,
        center: s.center || s.pos,
        orientation: s.orientation || 0
      }))
    };
    state.markCodeSectionDirty('sources');
    return updated;
  }),
  
  addSource: (source) => set((state) => {
    const updated = { 
      sources: [...state.sources, { 
        ...source, 
        center: source.center || source.pos,
        orientation: source.orientation || 0 
      }] 
    };
    state.markCodeSectionDirty('sources');
    return updated;
  }),
  
  updateSource: (id, partial) => set((state) => {
    // Check if the source is locked - if so, prevent updates (except for lock/unlock and visibility changes)
    const existingSource = state.sources.find(s => s.id === id);
    if (existingSource?.locked && !('locked' in partial) && !('invisible' in partial)) {
      console.warn(`Attempted to update locked source with ID: ${id}`);
      return state; // Return unchanged state
    }
    
    const updated = {
      sources: state.sources.map(src => {
        if (src.id === id) {
          const updatedSrc = { ...src, ...partial };
          // Update center if position changed
          if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
            updatedSrc.center = updatedSrc.pos || { x: updatedSrc.x, y: updatedSrc.y };
          }
          return updatedSrc;
        }
        return src;
      }),
    };
    state.markCodeSectionDirty('sources');
    return updated;
  }),

  updateSources: (ids: string[], partial: Partial<any>) => set((state) => {
    // Filter out locked sources from batch updates (except for lock/unlock and visibility changes)
    const unlockedIds = ids.filter(id => {
      const source = state.sources.find(s => s.id === id);
      if (source?.locked && !('locked' in partial) && !('invisible' in partial)) {
        console.warn(`Skipping update for locked source with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked sources, return unchanged state
    if (unlockedIds.length === 0) {
      return state;
    }
    
    const updated = {
      sources: state.sources.map(src => {
        if (unlockedIds.includes(src.id)) {
          const updatedSrc = { ...src, ...partial };
          // Update center if position changed
          if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
            updatedSrc.center = updatedSrc.pos || { x: updatedSrc.x, y: updatedSrc.y };
          }
          return updatedSrc;
        }
        return src;
      }),
    };
    state.markCodeSectionDirty('sources');
    return updated;
  }),
  
  removeSource: (id) => set((state) => {
    // Check if the source is locked - if so, prevent removal
    const existingSource = state.sources.find(s => s.id === id);
    if (existingSource?.locked) {
      console.warn(`Attempted to remove locked source with ID: ${id}`);
      return state; // Return unchanged state
    }
    
    const updated = {
      sources: state.sources.filter(src => src.id !== id),
      selectedGeometryIds: state.selectedGeometryIds.filter(selId => selId !== id),
      selectedGeometryId: state.selectedGeometryId === id ? null : state.selectedGeometryId,
    };
    state.markCodeSectionDirty('sources');
    return updated;
  }),
  
  removeSources: (ids) => set((state) => {
    // Filter out locked sources from batch removal
    const unlockedIds = ids.filter(id => {
      const source = state.sources.find(s => s.id === id);
      if (source?.locked) {
        console.warn(`Skipping removal for locked source with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked sources, return unchanged state
    if (unlockedIds.length === 0) {
      return state;
    }
    
    const updated = {
      sources: state.sources.filter(src => !unlockedIds.includes(src.id)),
      selectedGeometryIds: state.selectedGeometryIds.filter(selId => !unlockedIds.includes(selId)),
      selectedGeometryId: state.selectedGeometryId && unlockedIds.includes(state.selectedGeometryId) ? null : state.selectedGeometryId,
    };
    state.markCodeSectionDirty('sources');
    return updated;
  }),
});
