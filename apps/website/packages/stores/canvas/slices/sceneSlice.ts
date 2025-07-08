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
  setA: (a) => set((state) => {
    const updated = { a };
    state.markCodeSectionDirty('initialization');
    return updated;
  }),
  
  unit: LengthUnit.NM,
  setUnit: (unit) => set((state) => {
    const updated = { unit };
    state.markCodeSectionDirty('initialization');
    return updated;
  }),
  
  sceneMaterial: "Air",
  setSceneMaterial: (material) => set((state) => {
    const updated = { sceneMaterial: material };
    state.markMultipleCodeSectionsDirty(['initialization', 'materials']);
    return updated;
  }),
  
  // Helper to mark initialization dirty when project properties change
  markProjectPropertiesDirty: () => set((state) => {
    state.markCodeSectionDirty('initialization');
    return {};
  }),
});
