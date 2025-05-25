"use client";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

type LatticeState = {
  // Active lattice tracking
  activeLatticeId: string | null;
  setActiveLattice: (latticeId: string | null) => void;
  
  // Representation options
  showRealSpace: boolean;
  toggleShowRealSpace: () => void;
  showReciprocalSpace: boolean;
  toggleShowReciprocalSpace: () => void;
  
  // Voronoi cell options
  showWignerSeitzCell: boolean;
  toggleShowWignerSeitzCell: () => void;
  showBrillouinZone: boolean;
  toggleShowBrillouinZone: () => void;
  
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
  showAxes: boolean;
  toggleShowAxes: () => void;
  
  // Lattice point selection
  selectedLatticePoints: Array<{i: number, j: number}>;
  selectLatticePoint: (i: number, j: number, opts?: { shift?: boolean }) => void;
  clearSelectedPoints: () => void;
  
  // View options
  latticeScale: number;
  setLatticeScale: (scale: number) => void;
  gridDensity: number;
  setGridDensity: (density: number) => void;
};

export const useLatticeStore = createWithEqualityFn<LatticeState>(
  (set, get) => ({
    // Active lattice
    activeLatticeId: null,
    setActiveLattice: (latticeId) => set({ activeLatticeId: latticeId }),
    
    // Representation toggles
    showRealSpace: true,
    toggleShowRealSpace: () => set((s) => ({ showRealSpace: !s.showRealSpace })),
    showReciprocalSpace: false,
    toggleShowReciprocalSpace: () => set((s) => ({ showReciprocalSpace: !s.showReciprocalSpace })),
    
    // Voronoi cell toggles
    showWignerSeitzCell: false,
    toggleShowWignerSeitzCell: () => set((s) => ({ showWignerSeitzCell: !s.showWignerSeitzCell })),
    showBrillouinZone: false,
    toggleShowBrillouinZone: () => set((s) => ({ showBrillouinZone: !s.showBrillouinZone })),
    
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
    showAxes: true,
    toggleShowAxes: () => set((s) => ({ showAxes: !s.showAxes })),
    
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
  }),
  shallow
);
