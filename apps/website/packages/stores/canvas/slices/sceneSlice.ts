import { StateCreator } from 'zustand';
import { CanvasStore, SceneSlice } from '../types';
import { LengthUnit } from '../../../types/meepProjectTypes';

export const createSceneSlice: StateCreator<
  CanvasStore,
  [],
  [],
  SceneSlice
> = (set, get) => ({
  a: 1.0,
  setA: (a) => set({ a }),
  
  unit: LengthUnit.NM,
  setUnit: (unit) => set({ unit }),
  
  sceneMaterial: "Air",
  setSceneMaterial: (material) => set({ sceneMaterial: material }),
});
