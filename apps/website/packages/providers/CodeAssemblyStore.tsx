"use client";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

export interface CodeBlock {
  key: string;
  label: string;
  content: string;
  imports?: string[];
  dependencies?: string[]; // Other blocks this depends on
}

export interface SimulationParameters {
  cellSize: { x: number; y: number; z: number };
  resolution: number;
  pmlThickness: number;
  runtime?: number;
  dtStability?: number;
}

type CodeAssemblyState = {
  // Simulation parameters
  simulationParams: SimulationParameters;
  setSimulationParams: (params: Partial<SimulationParameters>) => void;
  
  // Code blocks management
  codeBlocks: Map<string, CodeBlock>;
  setCodeBlock: (key: string, block: CodeBlock) => void;
  getCodeBlock: (key: string) => CodeBlock | undefined;
  clearCodeBlocks: () => void;
  
  // Import management
  imports: Set<string>;
  addImport: (imp: string) => void;
  clearImports: () => void;
  
  // Code generation state
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  lastGeneratedAt: Date | null;
  setLastGeneratedAt: (date: Date | null) => void;
  
  // Error handling
  errors: Map<string, string>;
  setError: (key: string, error: string) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  
  // Get assembled code
  getAssembledCode: () => string;
};

export const useCodeAssemblyStore = createWithEqualityFn<CodeAssemblyState>(
  (set, get) => ({
    // Default simulation parameters
    simulationParams: {
      cellSize: { x: 16, y: 8, z: 0 },
      resolution: 10,
      pmlThickness: 1.0,
      runtime: 100,
      dtStability: 0.5,
    },
    setSimulationParams: (params) => set((s) => ({
      simulationParams: { ...s.simulationParams, ...params }
    })),
    
    // Code blocks
    codeBlocks: new Map(),
    setCodeBlock: (key, block) => set((s) => {
      const newBlocks = new Map(s.codeBlocks);
      newBlocks.set(key, block);
      return { codeBlocks: newBlocks };
    }),
    getCodeBlock: (key) => get().codeBlocks.get(key),
    clearCodeBlocks: () => set({ codeBlocks: new Map() }),
    
    // Imports
    imports: new Set(['import meep as mp', 'import numpy as np']),
    addImport: (imp) => set((s) => ({
      imports: new Set([...s.imports, imp])
    })),
    clearImports: () => set({ 
      imports: new Set(['import meep as mp', 'import numpy as np']) 
    }),
    
    // Generation state
    isGenerating: false,
    setIsGenerating: (generating) => set({ isGenerating: generating }),
    lastGeneratedAt: null,
    setLastGeneratedAt: (date) => set({ lastGeneratedAt: date }),
    
    // Errors
    errors: new Map(),
    setError: (key, error) => set((s) => {
      const newErrors = new Map(s.errors);
      newErrors.set(key, error);
      return { errors: newErrors };
    }),
    clearError: (key) => set((s) => {
      const newErrors = new Map(s.errors);
      newErrors.delete(key);
      return { errors: newErrors };
    }),
    clearAllErrors: () => set({ errors: new Map() }),
    
    // Assemble all code blocks in order
    getAssembledCode: () => {
      const state = get();
      const blocks = state.codeBlocks;
      const orderedKeys = [
        'initialization',
        'geometries',
        'materials',
        'sources',
        'boundaries',
        'regions',
        'simulation-assembly'
      ];
      
      let code = '';
      
      // Add imports first
      code += Array.from(state.imports).join('\n') + '\n\n';
      
      // Add each block in order
      orderedKeys.forEach(key => {
        const block = blocks.get(key);
        if (block && block.content) {
          code += block.content + '\n\n';
        }
      });
      
      return code.trim();
    }
  }),
  shallow
);
