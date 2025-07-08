import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { createCanvasSlice } from './slices/canvasSlice';
import { createSelectionSlice } from './slices/selectionSlice';
import { createGroupSlice } from './slices/groupSlice';
import { createGeometrySlice } from './slices/geometrySlice';
import { createSourceSlice } from './slices/sourceSlice';
import { createBoundarySlice } from './slices/boundarySlice';
import { createLatticeSlice } from './slices/latticeSlice';
import { createRegionSlice } from './slices/regionSlice';
import { createOverlaySlice } from './slices/overlaySlice';
import { createSceneSlice } from './slices/sceneSlice';
import { createCodeGenerationSlice } from './slices/codeGenerationSlice';
import { CanvasStore } from './types';

export const useCanvasStore = createWithEqualityFn<CanvasStore>(
  (set, get, store) => ({
    // Combine all slices
    ...createCanvasSlice(set, get, store),
    ...createSelectionSlice(set, get, store),
    ...createGroupSlice(set, get, store),
    ...createGeometrySlice(set, get, store),
    ...createSourceSlice(set, get, store),
    ...createBoundarySlice(set, get, store),
    ...createLatticeSlice(set, get, store),
    ...createRegionSlice(set, get, store),
    ...createOverlaySlice(set, get, store),
    ...createSceneSlice(set, get, store),
    ...createCodeGenerationSlice(set, get, store),
    
    // getAllElements needs to stay here as it uses multiple slices
    getAllElements: () => {
      const state = get();
      return [...state.geometries, ...state.sources, ...state.boundaries, ...state.lattices, ...state.regions, ...state.regionBoxes, ...state.groups];
    },
  }),
  shallow
);
