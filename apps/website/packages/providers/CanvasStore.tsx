"use client";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { calculateGeometryCenter } from "../utils/geometryCalculations";
import { LengthUnit } from "../types/meepProjectTypes";

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
  
  // Boundary state
  boundaries: any[];
  setBoundaries: (boundaries: any[]) => void;
  addBoundary: (boundary: any) => void;
  updateBoundary: (id: string, partial: Partial<any>) => void;
  removeBoundary: (id: string) => void;
  removeBoundaries: (ids: string[]) => void;
  
  // PML-specific management
  updatePMLEdgeAssignment: (boundaryId: string, edge: 'top' | 'right' | 'bottom' | 'left', parameterSetIndex: number | undefined) => void;
  
  // Combined elements getter
  getAllElements: () => any[];
  
  // Overlay toggles
  showGrid: boolean;
  toggleShowGrid: () => void;
  showResolutionOverlay: boolean;
  toggleShowResolutionOverlay: () => void;
  showCanvasInfo: boolean;
  toggleShowCanvasInfo: () => void;
  showXRayMode: boolean;
  toggleShowXRayMode: () => void;
  showColors: boolean;
  toggleShowColors: () => void;
  
  // Granular color controls
  colorSettings: {
    offState: { background: boolean; geometries: boolean; boundaries: boolean; };
    onState:  { background: boolean; geometries: boolean; boundaries: boolean; };
  };
  colorSettingsRevision: number;                   // <-- NEW
  setColorSetting: (
    state: 'offState' | 'onState',
    element: 'background' | 'geometries' | 'boundaries',
    value: boolean
  ) => void;
  getElementColorVisibility: (element: 'background' | 'geometries' | 'boundaries') => boolean;
  
  // X-Ray transparency value (used when X-Ray mode is on)
  xRayTransparency: number;
  xRayTransparencyRevision: number;                  // NEW
  setXRayTransparency: (value: number) => void;
  resetXRayTransparency: () => void;
  
  // Granular X-Ray transparency controls
  xRayTransparencySettings: {
    unified: boolean; // Whether to use unified transparency
    background: number;
    geometries: number;
    boundaries: number;
    sources: number;               // +++
  };
  setXRayTransparencySetting: (
    element: 'background' | 'geometries' | 'boundaries' | 'sources', // +++
    value: number
  ) => void;
  setUnifiedXRayTransparency: (unified: boolean) => void;
  getElementXRayTransparency: (
    element: 'background' | 'geometries' | 'boundaries' | 'sources' // +++
  ) => number;
  
  // Scene properties
  a: number;
  setA: (a: number) => void;
  unit: LengthUnit;
  setUnit: (unit: LengthUnit) => void;
  
  // Scene material
  sceneMaterial: string;
  setSceneMaterial: (material: string) => void;
  
  // Lattice state
  lattices: any[];
  setLattices: (lattices: any[]) => void;
  addLattice: (lattice: any) => void;
  updateLattice: (id: string, partial: Partial<any>) => void;
  removeLattice: (id: string) => void;
  removeLattices: (ids: string[]) => void;
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
          const newIds = s.selectedGeometryIds.includes(id)
            ? s.selectedGeometryIds.filter((selId) => selId !== id)
            : [...s.selectedGeometryIds, id];
          
          // Always update selectedGeometryId to the most recently clicked item
          return {
            selectedGeometryId: id,
            selectedGeometryIds: newIds,
          };
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
    
    // Boundary state and actions
    boundaries: [],
    setBoundaries: (boundaries) => set({ 
      boundaries: boundaries.map(b => ({
        ...b,
        // Boundaries don't have traditional positions
        center: { x: 0, y: 0 }
      }))
    }),
    addBoundary: (boundary) => set((s) => ({ 
      boundaries: [...s.boundaries, { 
        ...boundary,
        center: { x: 0, y: 0 }
      }] 
    })),
    updateBoundary: (id, partial) => set((s) => ({
      boundaries: s.boundaries.map(b => {
        if (b.id === id) {
          return { ...b, ...partial };
        }
        return b;
      }),
    })),
    removeBoundary: (id) => set((s) => ({
      boundaries: s.boundaries.filter(b => b.id !== id),
      selectedGeometryIds: s.selectedGeometryIds.filter(selId => selId !== id),
      selectedGeometryId: s.selectedGeometryId === id ? null : s.selectedGeometryId,
    })),
    removeBoundaries: (ids) => set((s) => ({
      boundaries: s.boundaries.filter(b => !ids.includes(b.id)),
      selectedGeometryIds: s.selectedGeometryIds.filter(selId => !ids.includes(selId)),
      selectedGeometryId: s.selectedGeometryId && ids.includes(s.selectedGeometryId) ? null : s.selectedGeometryId,
    })),
    
    // PML-specific management
    updatePMLEdgeAssignment: (boundaryId: string, edge: 'top' | 'right' | 'bottom' | 'left', parameterSetIndex: number | undefined) => {
      set((s) => ({
        boundaries: s.boundaries.map(b => {
          if (b.id === boundaryId && b.kind === 'pmlBoundary') {
            const edgeAssignments = { ...(b.edgeAssignments || {}) };
            if (parameterSetIndex === undefined) {
              delete edgeAssignments[edge];
            } else {
              edgeAssignments[edge] = parameterSetIndex;
            }
            return { ...b, edgeAssignments };
          }
          return b;
        }),
      }));
    },
    
    // Lattice state and actions
    lattices: [],
    setLattices: (lattices) => set({ 
      lattices: lattices.map(l => ({
        ...l,
        center: l.center || l.pos,
        orientation: l.orientation || 0
      }))
    }),
    addLattice: (lattice) => set((s) => ({ 
      lattices: [...s.lattices, { 
        ...lattice, 
        center: lattice.center || lattice.pos,
        orientation: lattice.orientation || 0 
      }] 
    })),
    updateLattice: (id, partial) => set((s) => ({
      lattices: s.lattices.map(l => {
        if (l.id === id) {
          const updated = { ...l, ...partial };
          if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
            updated.center = updated.pos || { x: updated.x, y: updated.y };
          }
          // If tiedGeometryId changes, update the geometry's invisible state
          if (partial.tiedGeometryId !== undefined) {
            const oldTiedId = l.tiedGeometryId;
            const newTiedId = partial.tiedGeometryId;
            
            // Make old geometry visible again
            if (oldTiedId) {
              const geoms = get().geometries;
              const oldGeom = geoms.find(g => g.id === oldTiedId);
              if (oldGeom) {
                get().updateGeometry(oldTiedId, { invisible: false });
              }
            }
            
            // Make new geometry invisible
            if (newTiedId) {
              get().updateGeometry(newTiedId, { invisible: true });
            }
          }
          return updated;
        }
        return l;
      }),
    })),
    removeLattice: (id) => set((s) => {
      const lattice = s.lattices.find(l => l.id === id);
      // Make tied geometry visible again when removing lattice
      if (lattice?.tiedGeometryId) {
        get().updateGeometry(lattice.tiedGeometryId, { invisible: false });
      }
      return {
        lattices: s.lattices.filter(l => l.id !== id),
        selectedGeometryIds: s.selectedGeometryIds.filter(selId => selId !== id),
        selectedGeometryId: s.selectedGeometryId === id ? null : s.selectedGeometryId,
      };
    }),
    removeLattices: (ids) => set((s) => {
      // Make all tied geometries visible again
      ids.forEach(id => {
        const lattice = s.lattices.find(l => l.id === id);
        if (lattice?.tiedGeometryId) {
          get().updateGeometry(lattice.tiedGeometryId, { invisible: false });
        }
      });
      return {
        lattices: s.lattices.filter(l => !ids.includes(l.id)),
        selectedGeometryIds: s.selectedGeometryIds.filter(selId => !ids.includes(selId)),
        selectedGeometryId: s.selectedGeometryId && ids.includes(s.selectedGeometryId) ? null : s.selectedGeometryId,
      };
    }),
    
    // Combined elements getter
    getAllElements: () => {
      const state = get();
      return [...state.geometries, ...state.sources, ...state.boundaries, ...state.lattices];
    },
    
    // Overlay toggles
    showGrid: true,
    toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    showResolutionOverlay: false,
    toggleShowResolutionOverlay: () => set((s) => ({ showResolutionOverlay: !s.showResolutionOverlay })),
    showCanvasInfo: true,
    toggleShowCanvasInfo: () => set((s) => ({ showCanvasInfo: !s.showCanvasInfo })),
    showXRayMode: false,
    toggleShowXRayMode: () => set((s) => ({ showXRayMode: !s.showXRayMode })),
    showColors: true,
    toggleShowColors: () => set({ showColors: !get().showColors }),
    
    colorSettings: {
      offState: { background: false, geometries: false, boundaries: false },
      onState:  { background: true,  geometries: true,  boundaries: true  },
    },
    colorSettingsRevision: 0,                          // <-- NEW
    setColorSetting: (state, element, value) =>
      set((s) => ({
        colorSettings: {
          ...s.colorSettings,
          [state]: { ...s.colorSettings[state], [element]: value },
        },
        colorSettingsRevision: s.colorSettingsRevision + 1, // bump
      })),
    
    getElementColorVisibility: (element) => {
      const { showColors, colorSettings } = get();
      const currentState = showColors ? 'onState' : 'offState';
      return colorSettings[currentState][element];
    },
    
    // X-Ray transparency value (0.3 = 30% opacity when X-Ray is on)
    xRayTransparency: 0.3,
    xRayTransparencyRevision: 0,                     // NEW
    setXRayTransparency: (value) =>
      set((s) => ({
        xRayTransparency: Math.max(0, Math.min(1, value)),
        xRayTransparencyRevision: s.xRayTransparencyRevision + 1,   // bump
      })),
    resetXRayTransparency: () =>
      set((s) => ({
        xRayTransparency: 0.3,
        xRayTransparencyRevision: s.xRayTransparencyRevision + 1,
      })),
    
    // Granular X-Ray transparency controls
    xRayTransparencySettings: {
      unified: true, // Start with unified mode
      background: 0.3,
      geometries: 0.3,
      boundaries: 0.3,
      sources: 0.3,                             // +++
    },
    setXRayTransparencySetting: (element, value) => {
      const clamped = Math.max(0, Math.min(1, value));
      set((s) => ({
        xRayTransparencySettings: {
          ...s.xRayTransparencySettings,
          [element]: clamped,
        },
        xRayTransparencyRevision: s.xRayTransparencyRevision + 1,
      }));
    },
    setUnifiedXRayTransparency: (unified) => {
      set((s) => ({
        xRayTransparencySettings: {
          ...s.xRayTransparencySettings,
          unified,
          ...(unified
            ? {
                background: s.xRayTransparency,
                geometries: s.xRayTransparency,
                boundaries: s.xRayTransparency,
                sources: s.xRayTransparency,          // +++
              }
            : {}),
        },
        xRayTransparencyRevision: s.xRayTransparencyRevision + 1,
      }));
    },
    getElementXRayTransparency: (element) => {
      const { xRayTransparencySettings, xRayTransparency } = get();
      return xRayTransparencySettings.unified
        ? xRayTransparency
        : xRayTransparencySettings[element];
    },
    
    // Scene properties
    a: 1.0,
    setA: (a) => set({ a }),
    unit: LengthUnit.NM,
    setUnit: (unit) => set({ unit }),
    
    // Scene material
    sceneMaterial: "Air",
    setSceneMaterial: (material) => set({ sceneMaterial: material }),
  }),
  shallow
);