"use client";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

// Only UI state remains

type CanvasState = {
  activeProjectId: string | null;
  setActiveProject: (projectId: string | null) => void;
  snapToGrid: boolean;
  toggleSnap: () => void;
  // Multiple selection support
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  addSelectedId: (id: string) => void;
  removeSelectedId: (id: string) => void;
  clearSelectedIds: () => void;
  // Single selection for legacy compatibility
  selectedId: string | null;
  /**
   * Select an element by id. If shift is true, add/remove from selection instead of replacing.
   */
  selectElement: (id: string | null, opts?: { shift?: boolean }) => void;
  // Geometry state
  geometries: any[];
  setGeometries: (geoms: any[]) => void;
  addGeometry: (geom: any) => void;
  updateGeometry: (id: string, partial: Partial<any>) => void;
  removeGeometry: (id: string) => void;
};

export const useCanvasStore = createWithEqualityFn<CanvasState>(
  (set, get) => ({
    activeProjectId: null,
    setActiveProject: (projectId) => set({ activeProjectId: projectId }),
    snapToGrid: true,
    toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
    // Multiple selection state and actions
    selectedIds: [],
    setSelectedIds: (ids) => set({ selectedIds: ids }),
    addSelectedId: (id) => set((s) => ({ selectedIds: s.selectedIds.includes(id) ? s.selectedIds : [...s.selectedIds, id] })),
    removeSelectedId: (id) => set((s) => ({ selectedIds: s.selectedIds.filter(selId => selId !== id) })),
    clearSelectedIds: () => set({ selectedIds: [] }),
    // Single selection for legacy compatibility
    selectedId: null,
    selectElement: (id: string | null, opts?: { shift?: boolean }) => {
      if (id === null) {
        set({ selectedId: null, selectedIds: [] });
      } else if (opts && opts.shift) {
        set((s) => {
          if (s.selectedIds.includes(id)) {
            return {
              selectedId: id,
              selectedIds: s.selectedIds.filter((selId) => selId !== id),
            };
          } else {
            return {
              selectedId: id,
              selectedIds: [...s.selectedIds, id],
            };
          }
        });
      } else {
        set({ selectedId: id, selectedIds: [id] });
      }
    },
    // Geometry state and actions
    geometries: [],
    setGeometries: (geoms) => set({ geometries: geoms }),
    addGeometry: (geom) => set((s) => ({ geometries: [...s.geometries, geom] })),
    updateGeometry: (id, partial) => set((s) => ({
      geometries: s.geometries.map(g => g.id === id ? { ...g, ...partial } : g),
    })),
    removeGeometry: (id) => set((s) => ({
      geometries: s.geometries.filter(g => g.id !== id),
      selectedIds: s.selectedIds.filter(selId => selId !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  }),
  shallow
);

// Removed saveProjectGeometries and all geometry state/actions
