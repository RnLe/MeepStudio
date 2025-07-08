import { StateCreator } from 'zustand';
import { CanvasStore, GeometrySlice } from '../types';
import { calculateGeometryCenter } from '../../../utils/geometryCalculations';

export const createGeometrySlice: StateCreator<
  CanvasStore,
  [],
  [],
  GeometrySlice
> = (set, get) => ({
  geometries: [],
  
  setGeometries: (geoms) => set((state) => { 
    const updated = { 
      geometries: geoms.map(g => ({
        ...g,
        center: g.center || calculateGeometryCenter(g),
        orientation: g.orientation || 0
      }))
    };
    // Mark related sections as dirty
    state.markMultipleCodeSectionsDirty(['geometries', 'materials']);
    return updated;
  }),
  
  addGeometry: (geom) => set((state) => {
    const updated = { 
      geometries: [...state.geometries, { 
        ...geom, 
        center: geom.center || calculateGeometryCenter(geom),
        orientation: geom.orientation || 0 
      }] 
    };
    // Mark related sections as dirty
    state.markMultipleCodeSectionsDirty(['geometries', 'materials']);
    return updated;
  }),
  
  updateGeometry: (id, partial) => set((state) => {
    // Check if the geometry is locked - if so, prevent updates (except for lock/unlock and visibility changes)
    const existingGeometry = state.geometries.find(g => g.id === id);
    if (existingGeometry?.locked && !('locked' in partial) && !('invisible' in partial)) {
      console.warn(`Attempted to update locked geometry with ID: ${id}`);
      return state; // Return unchanged state
    }
    
    const updated = {
      geometries: state.geometries.map(g => {
        if (g.id === id) {
          const updatedGeom = { ...g, ...partial };
          // Recalculate center if position changed
          if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
            updatedGeom.center = calculateGeometryCenter(updatedGeom);
          }
          return updatedGeom;
        }
        return g;
      }),
    };
    
    // Check if material changed to determine which sections to mark dirty
    const sectionsToMark = ['geometries'];
    if (partial.material !== undefined) {
      sectionsToMark.push('materials');
    }
    // If tied to lattices, also mark lattices dirty
    if (state.lattices.some(l => l.tiedGeometryId === id)) {
      sectionsToMark.push('lattices');
    }
    
    state.markMultipleCodeSectionsDirty(sectionsToMark as any);
    return updated;
  }),

  updateGeometries: (ids: string[], partial: Partial<any>) => set((state) => {
    // Filter out locked geometries from batch updates (except for lock/unlock and visibility changes)
    const unlockedIds = ids.filter(id => {
      const geometry = state.geometries.find(g => g.id === id);
      if (geometry?.locked && !('locked' in partial) && !('invisible' in partial)) {
        console.warn(`Skipping update for locked geometry with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked geometries, return unchanged state
    if (unlockedIds.length === 0) {
      return state;
    }
    
    const updated = {
      geometries: state.geometries.map(g => {
        if (unlockedIds.includes(g.id)) {
          const updatedGeom = { ...g, ...partial };
          // Recalculate center if position changed
          if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
            updatedGeom.center = calculateGeometryCenter(updatedGeom);
          }
          return updatedGeom;
        }
        return g;
      }),
    };
    
    // Check if material changed to determine which sections to mark dirty
    const sectionsToMark = ['geometries'];
    if (partial.material !== undefined) {
      sectionsToMark.push('materials');
    }
    // If any tied to lattices, also mark lattices dirty
    if (state.lattices.some(l => l.tiedGeometryId && unlockedIds.includes(l.tiedGeometryId))) {
      sectionsToMark.push('lattices');
    }
    
    state.markMultipleCodeSectionsDirty(sectionsToMark as any);
    return updated;
  }),
  
  removeGeometry: (id) => set((state) => {
    // Check if the geometry is locked - if so, prevent removal
    const existingGeometry = state.geometries.find(g => g.id === id);
    if (existingGeometry?.locked) {
      console.warn(`Attempted to remove locked geometry with ID: ${id}`);
      return state; // Return unchanged state
    }
    
    const updated = {
      geometries: state.geometries.filter(g => g.id !== id),
      selectedGeometryIds: state.selectedGeometryIds.filter(selId => selId !== id),
      selectedGeometryId: state.selectedGeometryId === id ? null : state.selectedGeometryId,
    };
    
    // Check if any lattices were tied to this geometry
    const sectionsToMark = ['geometries', 'materials'];
    if (state.lattices.some(l => l.tiedGeometryId === id)) {
      sectionsToMark.push('lattices');
    }
    
    state.markMultipleCodeSectionsDirty(sectionsToMark as any);
    return updated;
  }),
  
  removeGeometries: (ids) => set((state) => {
    // Filter out locked geometries from batch removal
    const unlockedIds = ids.filter(id => {
      const geometry = state.geometries.find(g => g.id === id);
      if (geometry?.locked) {
        console.warn(`Skipping removal for locked geometry with ID: ${id}`);
        return false;
      }
      return true;
    });
    
    // If no unlocked geometries, return unchanged state
    if (unlockedIds.length === 0) {
      return state;
    }
    
    const updated = {
      geometries: state.geometries.filter(g => !unlockedIds.includes(g.id)),
      selectedGeometryIds: state.selectedGeometryIds.filter(selId => !unlockedIds.includes(selId)),
      selectedGeometryId: state.selectedGeometryId && unlockedIds.includes(state.selectedGeometryId) ? null : state.selectedGeometryId,
    };
    
    // Check if any lattices were tied to these geometries
    const sectionsToMark = ['geometries', 'materials'];
    if (state.lattices.some(l => l.tiedGeometryId && unlockedIds.includes(l.tiedGeometryId))) {
      sectionsToMark.push('lattices');
    }
    
    state.markMultipleCodeSectionsDirty(sectionsToMark as any);
    return updated;
  }),
});
