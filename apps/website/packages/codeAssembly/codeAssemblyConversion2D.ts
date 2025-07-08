import { useCanvasStore } from '../providers/CanvasStore';
import { useCodeAssemblyStore } from '../providers/CodeAssemblyStore';
import { generateInitializationCode } from './initialisationAssembly';
import { generateGeometryCode, convertKonvaToMeepGeometry, convertMeepToKonvaGeometry } from './geometryAssembly';
import { generateSourcesCode } from './sourcesAssembly';
import { generateBoundariesCode } from './boundariesAssembly';
import { generateMaterialsCode } from './materialAssembly';
import { generateRegionsCode } from './regionsAssembly';
import { generateLatticeCode } from './latticeAssembly';
import { generateSimulationCode } from './simulationAssembly';
import { MeepGeometry } from './geometryAssembly';
import { MeepProject } from '../types/meepProjectTypes';

export interface ConversionContext {
  canvasState: ReturnType<typeof useCanvasStore.getState>;
  codeState: ReturnType<typeof useCodeAssemblyStore.getState>;
  project?: MeepProject; // Add project data for enhanced code generation
}

export interface ConversionResult {
  success: boolean;
  errors?: string[];
}

/**
 * Main conversion function that orchestrates code generation from canvas state
 */
export async function convertCanvasToMeepCode(project?: MeepProject): Promise<ConversionResult> {
  const canvasState = useCanvasStore.getState();
  const codeState = useCodeAssemblyStore.getState();
  
  // Update simulation parameters from project if provided
  if (project?.scene) {
    codeState.setSimulationParams({
      cellSize: { 
        x: project.scene.rectWidth, 
        y: project.scene.rectHeight, 
        z: 0 
      },
      resolution: project.scene.resolution,
      runtime: project.scene.runTime,
      // Keep existing PML and dt stability values for now
    });
  }
  
  const context: ConversionContext = {
    canvasState,
    codeState,
    project
  };
  
  try {
    // Set generating state
    codeState.setIsGenerating(true);
    codeState.clearAllErrors();
    
    // Get dirty sections from canvas store
    const dirtySections = canvasState.getDirtySections();
    const isAnySectionDirty = canvasState.isAnySectionDirty();
    
    // If nothing is dirty, no need to regenerate
    if (!isAnySectionDirty) {
      codeState.setIsGenerating(false);
      return { success: true };
    }
    
    // Generate only dirty sections
    if (dirtySections.includes('initialization')) {
      const initResult = await generateInitializationCode(context);
      if (!initResult.success) {
        codeState.setError('initialization', initResult.error || 'Failed to generate initialization code');
      } else {
        canvasState.clearCodeSectionDirty('initialization');
      }
    }
    
    if (dirtySections.includes('materials')) {
      const materialsResult = await generateMaterialsCode(context);
      if (!materialsResult.success) {
        codeState.setError('materials', materialsResult.error || 'Failed to generate materials code');
      } else {
        canvasState.clearCodeSectionDirty('materials');
      }
    }
    
    if (dirtySections.includes('geometries')) {
      const geomResult = await generateGeometryCode(context);
      if (!geomResult.success) {
        codeState.setError('geometries', geomResult.error || 'Failed to generate geometry code');
      } else {
        canvasState.clearCodeSectionDirty('geometries');
      }
    }
    
    if (dirtySections.includes('lattices')) {
      const latticeResult = await generateLatticeCode(context);
      if (!latticeResult.success) {
        codeState.setError('lattices', latticeResult.error || 'Failed to generate lattice code');
      } else {
        canvasState.clearCodeSectionDirty('lattices');
      }
    }
    
    if (dirtySections.includes('sources')) {
      const sourcesResult = await generateSourcesCode(context);
      if (!sourcesResult.success) {
        codeState.setError('sources', sourcesResult.error || 'Failed to generate sources code');
      } else {
        canvasState.clearCodeSectionDirty('sources');
      }
    }
    
    if (dirtySections.includes('boundaries')) {
      const boundariesResult = await generateBoundariesCode(context);
      if (!boundariesResult.success) {
        codeState.setError('boundaries', boundariesResult.error || 'Failed to generate boundaries code');
      } else {
        canvasState.clearCodeSectionDirty('boundaries');
      }
    }
    
    if (dirtySections.includes('regions')) {
      const regionsResult = await generateRegionsCode(context);
      if (!regionsResult.success) {
        codeState.setError('regions', regionsResult.error || 'Failed to generate regions code');
      } else {
        canvasState.clearCodeSectionDirty('regions');
      }
    }
    
    // Simulation always needs regeneration if any other section changed
    if (dirtySections.includes('simulation') || dirtySections.length > 1) {
      const simulationResult = await generateSimulationCode(context);
      if (!simulationResult.success) {
        codeState.setError('simulation-assembly', simulationResult.error || 'Failed to generate simulation code');
      } else {
        canvasState.clearCodeSectionDirty('simulation');
      }
    }
    
    // TODO: Generate other sections
    
    // Mark generation complete
    codeState.setLastGeneratedAt(new Date());
    codeState.setIsGenerating(false);
    
    // Check for any errors
    const errors = Array.from(codeState.errors.values());
    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    codeState.setIsGenerating(false);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
}

/**
 * Parse Meep code and update canvas state (for importing)
 */
export async function convertMeepCodeToCanvas(code: string): Promise<ConversionResult> {
  // TODO: Implement parsing logic
  // This would parse Python code and update the canvas state accordingly
  
  return {
    success: false,
    errors: ['Code import not yet implemented']
  };
}

/**
 * Validates if the current canvas state can be converted to valid Meep code
 */
export function validateCanvasState(): { valid: boolean; warnings: string[] } {
  const canvasState = useCanvasStore.getState();
  const warnings: string[] = [];
  
  // Check if we have a valid simulation domain
  if (!canvasState.geometries || canvasState.geometries.length === 0) {
    warnings.push('No geometries defined');
  }
  
  // TODO: Add more validation rules
  // - Check for sources
  // - Check for valid materials
  // - Check for boundary conditions
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Utility to format Python code with proper indentation
 */
export function formatPythonCode(code: string, indent: number = 0): string {
  const spaces = ' '.repeat(indent);
  return code.split('\n').map(line => spaces + line).join('\n');
}

/**
 * Utility to generate section separator comments
 */
export function generateSectionSeparator(title: string): string {
  const totalLength = 80;
  const titleWithSpaces = ` ${title.toUpperCase()} `;
  const dashCount = Math.max(0, totalLength - titleWithSpaces.length - 2);
  const leftDashes = Math.floor(dashCount / 2);
  const rightDashes = dashCount - leftDashes;
  
  return `# ${'─'.repeat(leftDashes)}${titleWithSpaces}${'─'.repeat(rightDashes)}`;
}

/**
 * Convert all canvas geometries to Meep geometries
 */
export function convertCanvasGeometriesToMeep(): MeepGeometry[] {
  const canvasState = useCanvasStore.getState();
  const meepGeometries: MeepGeometry[] = [];
  
  canvasState.geometries.forEach(konvaGeom => {
    const meepGeom = convertKonvaToMeepGeometry(konvaGeom);
    if (meepGeom) {
      meepGeometries.push(meepGeom);
    }
  });
  
  return meepGeometries;
}

/**
 * Update canvas with Meep geometries (for import functionality)
 */
export function updateCanvasWithMeepGeometries(meepGeometries: MeepGeometry[]): void {
  const canvasState = useCanvasStore.getState();
  const konvaGeometries = meepGeometries.map(meepGeom => 
    convertMeepToKonvaGeometry(meepGeom)
  );
  
  canvasState.setGeometries(konvaGeometries);
}

/**
 * Sync simulation parameters from scene to code assembly store
 */
export function syncSimulationParameters(): void {
  const canvasState = useCanvasStore.getState();
  const codeState = useCodeAssemblyStore.getState();
  
  // Get scene parameters from the active project
  // This is a simplified version - you may need to get the actual project scene
  const scene = {
    rectWidth: 16,
    rectHeight: 8,
    resolution: 10
  };
  
  codeState.setSimulationParams({
    cellSize: {
      x: scene.rectWidth,
      y: scene.rectHeight,
      z: 0 // 2D simulation
    },
    resolution: scene.resolution
  });
}
