"use client";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { calculateGeometryCenter } from "../utils/geometryCalculations";

type CanvasState = {
  // Grid and snapping settings
  gridSnapping: boolean;
  toggleGridSnapping: () => void;
  resolutionSnapping: boolean;
  toggleResolutionSnapping: () => void;
  
  // Geometry selection (renamed for clarity)
  selectedGeometryIds: string[];
  setSelectedGeometryIds: (ids: string[]) => void;
  addSelectedGeometryId: (id: string) => void;
  removeSelectedGeometryId: (id: string) => void;
  clearSelectedGeometryIds: () => void;
  
  // Single selection for legacy compatibility
  selectedGeometryId: string | null;
  /**
   * Select a geometry by id. If shift is true, add/remove from selection instead of replacing.
   */
  selectGeometry: (id: string | null, opts?: { shift?: boolean }) => void;
  
  // Geometry state
  geometries: any[];
  setGeometries: (geoms: any[]) => void;
  addGeometry: (geom: any) => void;
  updateGeometry: (id: string, partial: Partial<any>) => void;
  removeGeometry: (id: string) => void;
  removeGeometries: (ids: string[]) => void;
  
  // Source state
  sources: any[];
  setSources: (sources: any[]) => void;
  addSource: (source: any) => void;
  updateSource: (id: string, partial: Partial<any>) => void;
  removeSource: (id: string) => void;
  removeSources: (ids: string[]) => void;
  
  // Combined elements getter
  getAllElements: () => any[];
  
  // Overlay toggles
  showGrid: boolean;
  toggleShowGrid: () => void;
  showResolutionOverlay: boolean;
  toggleShowResolutionOverlay: () => void;
  showCanvasInfo: boolean;
  toggleShowCanvasInfo: () => void;
};

export const useCanvasStore = createWithEqualityFn<CanvasState>(
  (set, get) => ({
    gridSnapping: false, // Changed from true to false
    toggleGridSnapping: () => set((s) => ({ gridSnapping: !s.gridSnapping, resolutionSnapping: s.gridSnapping ? s.resolutionSnapping : false })),
    resolutionSnapping: false,
    toggleResolutionSnapping: () => set((s) => ({ resolutionSnapping: !s.resolutionSnapping, gridSnapping: s.resolutionSnapping ? s.gridSnapping : false })),
    
    // Geometry selection state and actions
    selectedGeometryIds: [],
    setSelectedGeometryIds: (ids) => set({ selectedGeometryIds: ids }),
    addSelectedGeometryId: (id) => set((s) => ({ selectedGeometryIds: s.selectedGeometryIds.includes(id) ? s.selectedGeometryIds : [...s.selectedGeometryIds, id] })),
    removeSelectedGeometryId: (id) => set((s) => ({ selectedGeometryIds: s.selectedGeometryIds.filter(selId => selId !== id) })),
    clearSelectedGeometryIds: () => set({ selectedGeometryIds: [] }),
    
    // Single selection for legacy compatibility
    selectedGeometryId: null,
    selectGeometry: (id: string | null, opts?: { shift?: boolean }) => {
      if (id === null) {
        set({ selectedGeometryId: null, selectedGeometryIds: [] });
      } else if (opts && opts.shift) {
        set((s) => {
          if (s.selectedGeometryIds.includes(id)) {
            return {
              selectedGeometryId: id,
              selectedGeometryIds: s.selectedGeometryIds.filter((selId) => selId !== id),
            };
          } else {
            return {
              selectedGeometryId: id,
              selectedGeometryIds: [...s.selectedGeometryIds, id],
            };
          }
        });
      } else {
        set({ selectedGeometryId: id, selectedGeometryIds: [id] });
      }
    },
    
    // Geometry state and actions
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
    
    // Source state and actions
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
    
    // Combined elements getter
    getAllElements: () => {
      const state = get();
      return [...state.geometries, ...state.sources];
    },
    
    // Overlay toggles
    showGrid: true,
    toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    showResolutionOverlay: false,
    toggleShowResolutionOverlay: () => set((s) => ({ showResolutionOverlay: !s.showResolutionOverlay })),
    showCanvasInfo: true,
    toggleShowCanvasInfo: () => set((s) => ({ showCanvasInfo: !s.showCanvasInfo })),
  }),
  shallow
);