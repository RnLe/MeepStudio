import { StateCreator } from 'zustand';
import { CanvasStore, CanvasSlice } from '../types';

export const createCanvasSlice: StateCreator<
  CanvasStore,
  [],
  [],
  CanvasSlice
> = (set, get) => ({
  gridSnapping: false,
  toggleGridSnapping: () => set((s) => ({ 
    gridSnapping: !s.gridSnapping, 
    resolutionSnapping: s.gridSnapping ? s.resolutionSnapping : false 
  })),
  
  resolutionSnapping: false,
  toggleResolutionSnapping: () => set((s) => ({ 
    resolutionSnapping: !s.resolutionSnapping, 
    gridSnapping: s.resolutionSnapping ? s.gridSnapping : false 
  })),
  
  canvasSize: { width: 800, height: 600 },
  setCanvasSize: (size) => set({ canvasSize: size }),
  
  GRID_PX: 40,
});
