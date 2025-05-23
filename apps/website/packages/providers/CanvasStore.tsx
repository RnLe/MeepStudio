"use client";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

// Only UI state remains

type CanvasState = {
  activeProjectId: string | null;
  setActiveProject: (projectId: string | null) => void;
  snapToGrid: boolean;
  toggleSnap: () => void;
  selectedId: string | null;
  selectElement: (id: string | null) => void;
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
    selectedId: null,
    selectElement: (id) => set({ selectedId: id }),
    // Geometry state and actions
    geometries: [],
    setGeometries: (geoms) => set({ geometries: geoms }),
    addGeometry: (geom) => set((s) => ({ geometries: [...s.geometries, geom] })),
    updateGeometry: (id, partial) => set((s) => ({
      geometries: s.geometries.map(g => g.id === id ? { ...g, ...partial } : g),
    })),
    removeGeometry: (id) => set((s) => ({
      geometries: s.geometries.filter(g => g.id !== id),
    })),
  }),
  shallow
);

// Removed saveProjectGeometries and all geometry state/actions
