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
  
  setGeometries: (geoms) => set({ 
    geometries: geoms.map(g => ({
      ...g,
      center: g.center || calculateGeometryCenter(g),
      orientation: g.orientation || 0
    }))
  }),
  
  addGeometry: (geom) => set((s) => ({ 
    geometries: [...s.geometries, { 
      ...geom, 
      center: geom.center || calculateGeometryCenter(geom),
      orientation: geom.orientation || 0 
    }] 
  })),
  
  updateGeometry: (id, partial) => set((s) => ({
    geometries: s.geometries.map(g => {
      if (g.id === id) {
        const updated = { ...g, ...partial };
        // Recalculate center if position changed
        if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
          updated.center = calculateGeometryCenter(updated);
        }
        return updated;
      }
      return g;
    }),
  })),
  
  removeGeometry: (id) => set((s) => ({
    geometries: s.geometries.filter(g => g.id !== id),
    selectedGeometryIds: s.selectedGeometryIds.filter(selId => selId !== id),
    selectedGeometryId: s.selectedGeometryId === id ? null : s.selectedGeometryId,
  })),
  
  removeGeometries: (ids) => set((s) => ({
    geometries: s.geometries.filter(g => !ids.includes(g.id)),
    selectedGeometryIds: s.selectedGeometryIds.filter(selId => !ids.includes(selId)),
    selectedGeometryId: s.selectedGeometryId && ids.includes(s.selectedGeometryId) ? null : s.selectedGeometryId,
  })),
});
