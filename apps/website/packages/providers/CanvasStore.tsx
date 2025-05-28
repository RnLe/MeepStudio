"use client";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

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
    setGeometries: (geoms) => set({ geometries: geoms }),
    addGeometry: (geom) => set((s) => ({ 
      geometries: [...s.geometries, { ...geom, orientation: geom.orientation || 0 }] 
    })),
    updateGeometry: (id, partial) => set((s) => ({
      geometries: s.geometries.map(g => g.id === id ? { ...g, ...partial } : g),
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