import { useCanvasStore } from '../providers/CanvasStore';
import { useCodeAssemblyStore } from '../providers/CodeAssemblyStore';
import { generateInitializationCode } from './initialisationAssembly';
import { generateGeometryCode, convertKonvaToMeepGeometry, convertMeepToKonvaGeometry } from './geometryAssembly';
import { MeepGeometry } from './geometryAssembly';

export interface ConversionContext {
  canvasState: ReturnType<typeof useCanvasStore.getState>;
  codeState: ReturnType<typeof useCodeAssemblyStore.getState>;
}

export interface ConversionResult {
  success: boolean;
  errors?: string[];
}

/**
 * Main conversion function that orchestrates code generation from canvas state
 */
export async function convertCanvasToMeepCode(): Promise<ConversionResult> {
  const canvasState = useCanvasStore.getState();
  const codeState = useCodeAssemblyStore.getState();
  
  const context: ConversionContext = {
    canvasState,
    codeState
  };
  
  try {
    // Set generating state
    codeState.setIsGenerating(true);
    codeState.clearAllErrors();
    
    // Generate initialization code
    const initResult = await generateInitializationCode(context);
    if (!initResult.success) {
      codeState.setError('initialization', initResult.error || 'Failed to generate initialization code');
    }
    
    // Generate geometry code
    const geomResult = await generateGeometryCode(context);
    if (!geomResult.success) {
      codeState.setError('geometries', geomResult.error || 'Failed to generate geometry code');
    }
    
    // TODO: Generate other sections
    // - Materials
    // - Sources
    // - Boundaries
    // - Regions
    // - Simulation assembly
    
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
