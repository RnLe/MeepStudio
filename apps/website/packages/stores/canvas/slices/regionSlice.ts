import { StateCreator } from 'zustand';
import { CanvasStore, RegionSlice } from '../types';

export const createRegionSlice: StateCreator<
  CanvasStore,
  [],
  [],
  RegionSlice
> = (set, get) => ({
  regions: [],
  regionBoxes: [],
  
  setRegions: (regions) => set((state) => {
    const updated = { regions };
    state.markCodeSectionDirty('regions');
    return updated;
  }),

  setRegionBoxes: (regionBoxes) => set((state) => {
    const updated = { regionBoxes };
    state.markCodeSectionDirty('regions');
    return updated;
  }),
  
  addRegion: (region) => set((state) => {
    const updated = { 
      regions: [...state.regions, region] 
    };
    state.markCodeSectionDirty('regions');
    return updated;
  }),

  addRegionBox: (regionBox) => set((state) => {
    const updated = { 
      regionBoxes: [...(state as any).regionBoxes, regionBox] 
    };
    state.markCodeSectionDirty('regions');
    return updated;
  }),
  
  updateRegion: (id, partial) => set((state) => {
    // Check if the region is locked - if so, prevent updates (except for lock/unlock and visibility changes)
    const existingRegion = state.regions.find(r => r.id === id);
    if (existingRegion?.locked && !('locked' in partial) && !('invisible' in partial)) {
      console.warn(`Attempted to update locked region with ID: ${id}`);
      return state; // Return unchanged state
    }
    
    const updated = {
      regions: state.regions.map(region => {
        if (region.id === id) {
          return { ...region, ...partial };
        }
        return region;
      }),
    };
    state.markCodeSectionDirty('regions');
    return updated;
  }),

  updateRegionBox: (id, partial) => set((state) => {
    // Check if the region box is locked - if so, prevent updates (except for lock/unlock and visibility changes)
    const existingRegionBox = ((state as any).regionBoxes || []).find((rb: any) => rb.id === id);
    if (existingRegionBox?.locked && !('locked' in partial) && !('invisible' in partial)) {
      console.warn(`Attempted to update locked region box with ID: ${id}`);
      return state; // Return unchanged state
    }
    
    const updated = {
      regionBoxes: ((state as any).regionBoxes || []).map((regionBox: any) => {
        if (regionBox.id === id) {
          return { ...regionBox, ...partial };
        }
        return regionBox;
      }),
    };
    state.markCodeSectionDirty('regions');
    return updated;
  }),

  updateRegions: (ids: string[], partial: Partial<any>) => set((state) => {
    // Filter out locked regions from batch updates (except for lock/unlock and visibility changes)
    const unlockedIds = ids.filter(id => {
      const region = state.regions.find(r => r.id === id);
      if (region?.locked && !('locked' in partial) && !('invisible' in partial)) {
        console.warn(`Skipping update for locked region with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked regions, return unchanged state
    if (unlockedIds.length === 0) {
      return state;
    }
    
    const updated = {
      regions: state.regions.map(region => {
        if (unlockedIds.includes(region.id)) {
          return { ...region, ...partial };
        }
        return region;
      }),
    };
    state.markCodeSectionDirty('regions');
    return updated;
  }),

  updateRegionBoxes: (ids: string[], partial: Partial<any>) => set((state) => {
    // Filter out locked region boxes from batch updates (except for lock/unlock and visibility changes)
    const unlockedIds = ids.filter(id => {
      const regionBox = ((state as any).regionBoxes || []).find((rb: any) => rb.id === id);
      if (regionBox?.locked && !('locked' in partial) && !('invisible' in partial)) {
        console.warn(`Skipping update for locked region box with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked region boxes, return unchanged state
    if (unlockedIds.length === 0) {
      return state;
    }
    
    const updated = {
      regionBoxes: ((state as any).regionBoxes || []).map((regionBox: any) => {
        if (unlockedIds.includes(regionBox.id)) {
          return { ...regionBox, ...partial };
        }
        return regionBox;
      }),
    };
    state.markCodeSectionDirty('regions');
    return updated;
  }),
  
  removeRegion: (id) => set((state) => {
    // Check if the region is locked - if so, prevent removal
    const existingRegion = state.regions.find(r => r.id === id);
    if (existingRegion?.locked) {
      console.warn(`Attempted to remove locked region with ID: ${id}`);
      return state; // Return unchanged state
    }
    
    const updated = {
      regions: state.regions.filter(region => region.id !== id),
      selectedGeometryIds: state.selectedGeometryIds.filter(selId => selId !== id),
      selectedGeometryId: state.selectedGeometryId === id ? null : state.selectedGeometryId,
    };
    state.markCodeSectionDirty('regions');
    return updated;
  }),

  removeRegionBox: (id) => set((state) => {
    // Check if the region box is locked - if so, prevent removal
    const existingRegionBox = ((state as any).regionBoxes || []).find((rb: any) => rb.id === id);
    if (existingRegionBox?.locked) {
      console.warn(`Attempted to remove locked region box with ID: ${id}`);
      return state; // Return unchanged state
    }
    
    const updated = {
      regionBoxes: ((state as any).regionBoxes || []).filter((regionBox: any) => regionBox.id !== id),
      selectedGeometryIds: state.selectedGeometryIds.filter(selId => selId !== id),
      selectedGeometryId: state.selectedGeometryId === id ? null : state.selectedGeometryId,
    };
    state.markCodeSectionDirty('regions');
    return updated;
  }),
  
  removeRegions: (ids) => set((state) => {
    // Filter out locked regions from batch removal
    const unlockedIds = ids.filter(id => {
      const region = state.regions.find(r => r.id === id);
      if (region?.locked) {
        console.warn(`Skipping removal for locked region with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked regions, return unchanged state
    if (unlockedIds.length === 0) {
      return state;
    }
    
    const updated = {
      regions: state.regions.filter(region => !unlockedIds.includes(region.id)),
      selectedGeometryIds: state.selectedGeometryIds.filter(selId => !unlockedIds.includes(selId)),
      selectedGeometryId: state.selectedGeometryId && unlockedIds.includes(state.selectedGeometryId) ? null : state.selectedGeometryId,
    };
    state.markCodeSectionDirty('regions');
    return updated;
  }),

  removeRegionBoxes: (ids) => set((state) => {
    // Filter out locked region boxes from batch removal
    const unlockedIds = ids.filter(id => {
      const regionBox = ((state as any).regionBoxes || []).find((rb: any) => rb.id === id);
      if (regionBox?.locked) {
        console.warn(`Skipping removal for locked region box with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked region boxes, return unchanged state
    if (unlockedIds.length === 0) {
      return state;
    }
    
    const updated = {
      regionBoxes: ((state as any).regionBoxes || []).filter((regionBox: any) => !unlockedIds.includes(regionBox.id)),
      selectedGeometryIds: state.selectedGeometryIds.filter(selId => !unlockedIds.includes(selId)),
      selectedGeometryId: state.selectedGeometryId && unlockedIds.includes(state.selectedGeometryId) ? null : state.selectedGeometryId,
    };
    state.markCodeSectionDirty('regions');
    return updated;
  }),
});
