"use client";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { VoronoiData } from "packages/types/meepLatticeTypes";

type LatticePoint = {
  x: number;
  y: number;
  i: number;
  j: number;
  distance: number;
};

type LatticePointCache = {
  points: LatticePoint[];
  maxDistance: number;
  cacheKey: string;
  stats?: {
    timeTaken: number;
    pointCount: number;
    maxDistance: number;
  };
};

type LatticeState = {
  // Active lattice tracking
  activeLatticeId: string | null;
  setActiveLattice: (latticeId: string | null) => void;
  
  // Representation mode - mutually exclusive
  spaceMode: 'real' | 'reciprocal';
  setSpaceMode: (mode: 'real' | 'reciprocal') => void;
  
  // Voronoi cell options (merged)
  showVoronoiCell: boolean;
  toggleShowVoronoiCell: () => void;
  showVoronoiTiling: boolean;
  toggleShowVoronoiTiling: () => void;
  
  // Symmetry options
  showPointGroup: boolean;
  toggleShowPointGroup: () => void;
  showSpaceGroup: boolean;
  toggleShowSpaceGroup: () => void;
  showHighSymmetryPoints: boolean;
  toggleShowHighSymmetryPoints: () => void;
  
  // Overlay options
  showLatticePoints: boolean;
  toggleShowLatticePoints: () => void;
  showUnitCell: boolean;
  toggleShowUnitCell: () => void;
  showUnitTilesLattice: boolean;
  toggleShowUnitTilesLattice: () => void;
  showGrid: boolean;
  toggleShowGrid: () => void;
  showBaseVectors: boolean;
  toggleShowBaseVectors: () => void;
  
  // Lattice point selection
  selectedLatticePoints: Array<{i: number, j: number}>;
  selectLatticePoint: (i: number, j: number, opts?: { shift?: boolean }) => void;
  clearSelectedPoints: () => void;
  
  // View options
  latticeScale: number;
  setLatticeScale: (scale: number) => void;
  gridDensity: number;
  setGridDensity: (density: number) => void;
  
  // Modes
  normalizeMode: boolean;
  toggleNormalizeMode: () => void;
  
  // Lattice point cache
  latticePointCache: LatticePointCache | null;
  setLatticePointCache: (cache: LatticePointCache | null) => void;
  
  // Dynamic zoom limits
  minScale: number;
  setMinScale: (scale: number) => void;
  
  // Voronoi data cache
  voronoiData: VoronoiData | null;
  setVoronoiData: (data: VoronoiData | null) => void;
  isCalculatingVoronoi: boolean;
  setIsCalculatingVoronoi: (calculating: boolean) => void;
  
  // Voronoi zone counts
  realSpaceZoneCount: number;
  setRealSpaceZoneCount: (count: number) => void;
  reciprocalSpaceZoneCount: number;
  setReciprocalSpaceZoneCount: (count: number) => void;
  
  // Transformation matrices
  transformationMatrices: {
    MA: number[][];
    MA_inv: number[][];
    MB: number[][];
    MB_inv: number[][];
    realToReciprocal: number[][];
    reciprocalToReal: number[][];
  } | null;
  setTransformationMatrices: (matrices: LatticeState['transformationMatrices']) => void;
  
  // Lattice point calculation
  latticeMultiplier: number;
  setLatticeMultiplier: (multiplier: number) => void;
  
  // New: Project tracking
  linkedProjectIds: string[];
  setLinkedProjectIds: (projectIds: string[]) => void;
  addLinkedProject: (projectId: string) => void;
  removeLinkedProject: (projectId: string) => void;
  
  // New: Canvas lattice synchronization
  createCanvasLatticeFromActive: () => any; // Returns canvas lattice object
  updateCanvasLatticesInProjects: (latticeId: string) => void;
  
  // New: Lattice basis vectors for canvas synchronization
  currentBasis1: { x: number; y: number } | null;
  currentBasis2: { x: number; y: number } | null;
  currentLatticeType: string | null;
  setCurrentBasisVectors: (basis1: { x: number; y: number }, basis2: { x: number; y: number }) => void;
  setCurrentLatticeType: (type: string) => void;
  
  // New: Force canvas update flag
  canvasUpdateTrigger: number;
  triggerCanvasUpdate: () => void;
};

export const useLatticeStore = createWithEqualityFn<LatticeState>(
  (set, get) => ({
    // Active lattice
    activeLatticeId: null,
    setActiveLattice: (latticeId) => set({ activeLatticeId: latticeId }),
    
    // Representation mode - default to real space
    spaceMode: 'real',
    setSpaceMode: (mode) => set({ spaceMode: mode }),
    
    // Voronoi cell toggles (merged) - both default to false
    showVoronoiCell: false,
    toggleShowVoronoiCell: () => set((s) => ({ showVoronoiCell: !s.showVoronoiCell })),
    showVoronoiTiling: false,
    toggleShowVoronoiTiling: () => set((s) => {
      const newShowVoronoiTiling = !s.showVoronoiTiling;
      // If turning on voronoi tiling, ensure voronoi cell is also on
      if (newShowVoronoiTiling && !s.showVoronoiCell) {
        return { showVoronoiTiling: true, showVoronoiCell: true };
      }
      return { showVoronoiTiling: newShowVoronoiTiling };
    }),
    
    // Symmetry toggles
    showPointGroup: false,
    toggleShowPointGroup: () => set((s) => ({ showPointGroup: !s.showPointGroup })),
    showSpaceGroup: false,
    toggleShowSpaceGroup: () => set((s) => ({ showSpaceGroup: !s.showSpaceGroup })),
    showHighSymmetryPoints: false,
    toggleShowHighSymmetryPoints: () => set((s) => ({ showHighSymmetryPoints: !s.showHighSymmetryPoints })),
    
    // Overlay toggles
    showLatticePoints: true,
    toggleShowLatticePoints: () => set((s) => ({ showLatticePoints: !s.showLatticePoints })),
    showUnitCell: true,
    toggleShowUnitCell: () => set((s) => ({ showUnitCell: !s.showUnitCell })),
    showUnitTilesLattice: false,
    toggleShowUnitTilesLattice: () => set((s) => {
      const newShowUnitTilesLattice = !s.showUnitTilesLattice;
      // If turning on unit tiles, ensure unit cell is also on
      if (newShowUnitTilesLattice && !s.showUnitCell) {
        return { showUnitTilesLattice: true, showUnitCell: true };
      }
      return { showUnitTilesLattice: newShowUnitTilesLattice };
    }),
    showGrid: true,
    toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    showBaseVectors: true,
    toggleShowBaseVectors: () => set((s) => ({ showBaseVectors: !s.showBaseVectors })),
    
    // Lattice point selection
    selectedLatticePoints: [],
    selectLatticePoint: (i, j, opts) => {
      const point = { i, j };
      if (opts?.shift) {
        set((s) => {
          const exists = s.selectedLatticePoints.some(p => p.i === i && p.j === j);
          if (exists) {
            return {
              selectedLatticePoints: s.selectedLatticePoints.filter(p => !(p.i === i && p.j === j))
            };
          } else {
            return {
              selectedLatticePoints: [...s.selectedLatticePoints, point]
            };
          }
        });
      } else {
        set({ selectedLatticePoints: [point] });
      }
    },
    clearSelectedPoints: () => set({ selectedLatticePoints: [] }),
    
    // View options
    latticeScale: 100,
    setLatticeScale: (scale) => set({ latticeScale: scale }),
    gridDensity: 8,
    setGridDensity: (density) => set({ gridDensity: density }),
    
    // Modes
    normalizeMode: true,
    toggleNormalizeMode: () => set((s) => ({ normalizeMode: !s.normalizeMode })),
    
    // Lattice point cache
    latticePointCache: null,
    setLatticePointCache: (cache) => set({ latticePointCache: cache }),
    
    // Dynamic zoom limits
    minScale: 0.1,
    setMinScale: (scale) => set({ minScale: scale }),
    
    // Voronoi data
    voronoiData: null,
    setVoronoiData: (data) => set({ voronoiData: data }),
    isCalculatingVoronoi: false,
    setIsCalculatingVoronoi: (calculating) => set({ isCalculatingVoronoi: calculating }),
    
    // Voronoi zone counts
    realSpaceZoneCount: 1,
    setRealSpaceZoneCount: (count) => set({ realSpaceZoneCount: Math.max(1, Math.min(5, count)) }),
    reciprocalSpaceZoneCount: 1,
    setReciprocalSpaceZoneCount: (count) => set({ reciprocalSpaceZoneCount: Math.max(1, Math.min(5, count)) }),
    
    // Transformation matrices
    transformationMatrices: null,
    setTransformationMatrices: (matrices) => set({ transformationMatrices: matrices }),
    
    // Lattice point calculation
    latticeMultiplier: 10,
    setLatticeMultiplier: (multiplier) =>
      set((s) => ({
        latticeMultiplier: Math.max(3, Math.min(30, multiplier)),
        // ── force canvas redraw ────────────────────────────────
        canvasUpdateTrigger: s.canvasUpdateTrigger + 1,
      })),
    
    // New: Project tracking
    linkedProjectIds: [],
    setLinkedProjectIds: (projectIds) => set({ linkedProjectIds: projectIds }),
    addLinkedProject: (projectId) => set((s) => ({
      linkedProjectIds: s.linkedProjectIds.includes(projectId) 
        ? s.linkedProjectIds 
        : [...s.linkedProjectIds, projectId]
    })),
    removeLinkedProject: (projectId) => set((s) => ({
      linkedProjectIds: s.linkedProjectIds.filter(id => id !== projectId)
    })),
    
    // New: Create canvas lattice from active lattice
    createCanvasLatticeFromActive: () => {
      const state = get();
      if (!state.activeLatticeId) return null;
      
      // This would normally fetch from ghPagesProjectsStore
      // For now, return a template
      return {
        id: '', // Will be set by canvas
        kind: 'lattice',
        pos: { x: 5, y: 5 }, // Default position
        basis1: { x: 1, y: 0 },
        basis2: { x: 0, y: 1 },
        multiplier: 3,
        showMode: 'points',
        latticeDocumentId: state.activeLatticeId,
        orientation: 0,
      };
    },
    
    // New: Update canvas lattices in all linked projects
    updateCanvasLatticesInProjects: (latticeId) => {
      const state = get();
      // Trigger canvas update when lattice changes
      set((s) => ({ canvasUpdateTrigger: s.canvasUpdateTrigger + 1 }));
    },
    
    // New: Lattice basis vectors
    currentBasis1: null,
    currentBasis2: null,
    currentLatticeType: null,
    setCurrentBasisVectors: (basis1, basis2) => set({ 
      currentBasis1: basis1, 
      currentBasis2: basis2 
    }),
    setCurrentLatticeType: (type) => set({ currentLatticeType: type }),
    
    // New: Canvas update trigger
    canvasUpdateTrigger: 0,
    triggerCanvasUpdate: () => set((s) => ({ canvasUpdateTrigger: s.canvasUpdateTrigger + 1 })),
  }),
  shallow
);

// Add this at the end of the file after the store creation
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Subscribe to specific state changes
  const unsubscribe = useLatticeStore.subscribe(
    (state, prevState) => {
      // Check if relevant fields changed
      if (
        state.currentBasis1 !== prevState.currentBasis1 ||
        state.currentBasis2 !== prevState.currentBasis2 ||
        state.currentLatticeType !== prevState.currentLatticeType ||
        state.canvasUpdateTrigger !== prevState.canvasUpdateTrigger
      ) {
        // State changed but no logging
      }
    }
  );
}
