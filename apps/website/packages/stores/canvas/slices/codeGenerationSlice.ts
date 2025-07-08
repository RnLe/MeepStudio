import { StateCreator } from 'zustand';
import { CanvasStore, CodeGenerationSlice } from '../types';

export const createCodeGenerationSlice: StateCreator<
  CanvasStore,
  [],
  [],
  CodeGenerationSlice
> = (set, get) => ({
  // Initial state - sections start clean, will be marked dirty when data changes
  codeGenDirtyFlags: {
    initialization: false,
    materials: false,
    geometries: false,
    lattices: false,
    sources: false,
    boundaries: false,
    regions: false,
    simulation: false,
  },
  
  // Mark a single section as dirty
  markCodeSectionDirty: (section) => set((state) => ({
    codeGenDirtyFlags: {
      ...state.codeGenDirtyFlags,
      [section]: true,
      // Simulation always becomes dirty when anything else changes
      simulation: true,
    }
  })),
  
  // Mark multiple sections as dirty
  markMultipleCodeSectionsDirty: (sections) => set((state) => ({
    codeGenDirtyFlags: {
      ...state.codeGenDirtyFlags,
      ...sections.reduce((acc, section) => ({ ...acc, [section]: true }), {}),
      // Simulation always becomes dirty when anything else changes
      simulation: true,
    }
  })),
  
  // Clear a single section's dirty flag
  clearCodeSectionDirty: (section) => set((state) => ({
    codeGenDirtyFlags: {
      ...state.codeGenDirtyFlags,
      [section]: false,
    }
  })),
  
  // Clear all dirty flags (called after successful generation)
  clearAllCodeSectionsDirty: () => set({
    codeGenDirtyFlags: {
      initialization: false,
      materials: false,
      geometries: false,
      lattices: false,
      sources: false,
      boundaries: false,
      regions: false,
      simulation: false,
    }
  }),

  // Force mark all sections as dirty (for initial generation or full refresh)
  markAllCodeSectionsDirty: () => set({
    codeGenDirtyFlags: {
      initialization: true,
      materials: true,
      geometries: true,
      lattices: true,
      sources: true,
      boundaries: true,
      regions: true,
      simulation: true,
    }
  }),
  
  // Check if any section is dirty
  isAnySectionDirty: () => {
    const { codeGenDirtyFlags } = get();
    return Object.values(codeGenDirtyFlags).some(dirty => dirty);
  },
  
  // Get list of dirty sections
  getDirtySections: () => {
    const { codeGenDirtyFlags } = get();
    return Object.entries(codeGenDirtyFlags)
      .filter(([_, dirty]) => dirty)
      .map(([section, _]) => section) as Array<keyof CodeGenerationSlice['codeGenDirtyFlags']>;
  },
});
