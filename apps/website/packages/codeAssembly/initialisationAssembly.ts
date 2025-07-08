import { ConversionContext, generateSectionSeparator } from './codeAssemblyConversion2D';
import { CodeBlock } from '../providers/CodeAssemblyStore';
import { convertTime, convertToPhysicalUnit } from '../utils/physicalUnitsHelper';

export interface InitializationResult {
  success: boolean;
  error?: string;
}

/**
 * Generate initialization code block from simulation parameters
 */
export async function generateInitializationCode(context: ConversionContext): Promise<InitializationResult> {
  try {
    const { codeState, project } = context;
    const params = codeState.simulationParams;
    
    // Build initialization code
    const lines: string[] = [
      generateSectionSeparator('INITIALIZATION'),
      '',
      '# Initialize Meep simulation environment',
      'import meep as mp',
      'import numpy as np',
      ''
    ];

    // Add project information if available
    if (project?.scene) {
      const scene = project.scene;
      lines.push('# Project Information');
      lines.push(`# Title: ${project.title}`);
      if (project.description) {
        lines.push(`# Description: ${project.description}`);
      }
      lines.push(`# Characteristic length (a): ${scene.a} ${scene.unit}`);
      lines.push('');
      
      // Calculate physical time units using a/c = t
      const oneTimeUnit = convertTime(1, scene.a, scene.unit);
      const totalTime = convertTime(scene.runTime, scene.a, scene.unit);
      
      lines.push('# Simulation Parameters');
      lines.push(`cell_size = mp.Vector3(${scene.rectWidth}, ${scene.rectHeight}, 0)  # Grid size: ${scene.rectWidth} × ${scene.rectHeight} (scale-free units)`);
      lines.push(`resolution = ${scene.resolution}  # Grid points per unit length`);
      lines.push(`runtime = ${scene.runTime}  # Total run time (scale-free units) = ${totalTime}`);
      lines.push('');
      lines.push('# Physical Time Scale');
      lines.push(`# One time unit (a/c) = ${oneTimeUnit}`);
      lines.push(`# Total simulation time = ${totalTime}`);
      lines.push('');
    } else {
      // Fallback for when project data isn't available
      lines.push('# Define simulation parameters');
      lines.push(`cell_size = mp.Vector3(${params.cellSize.x}, ${params.cellSize.y}, ${params.cellSize.z})`);
      lines.push(`resolution = ${params.resolution}`);
      lines.push('');
    }

    // Create code block
    const codeBlock: CodeBlock = {
      key: 'initialization',
      label: 'Initialization',
      content: lines.join('\n'),
      imports: ['import meep as mp', 'import numpy as np'],
      dependencies: []
    };

    // Store in code state
    codeState.setCodeBlock('initialization', codeBlock);

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate initialization code'
    };
  }
}

/**
 * Parse initialization code and update simulation parameters
 */
export function parseInitializationCode(code: string): Partial<ConversionContext['codeState']['simulationParams']> | null {
  // TODO: Implement parsing logic
  // This would parse the Python code and extract simulation parameters
  
  const params: Partial<ConversionContext['codeState']['simulationParams']> = {};
  
  // Example parsing (simplified)
  const cellSizeMatch = code.match(/cell_size\s*=\s*mp\.Vector3\(([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/);
  if (cellSizeMatch) {
    params.cellSize = {
      x: parseFloat(cellSizeMatch[1]),
      y: parseFloat(cellSizeMatch[2]),
      z: parseFloat(cellSizeMatch[3])
    };
  }
  
  const resolutionMatch = code.match(/resolution\s*=\s*([\d.]+)/);
  if (resolutionMatch) {
    params.resolution = parseFloat(resolutionMatch[1]);
  }
  
  return Object.keys(params).length > 0 ? params : null;
}

/**
 * Validate initialization parameters
 */
export function validateInitializationParams(params: ConversionContext['codeState']['simulationParams']): string[] {
  const errors: string[] = [];
  
  if (params.resolution <= 0) {
    errors.push('Resolution must be positive');
  }
  
  if (params.cellSize.x <= 0 || params.cellSize.y <= 0) {
    errors.push('Cell size dimensions must be positive');
  }
  
  if (params.pmlThickness < 0) {
    errors.push('PML thickness cannot be negative');
  }
  
  return errors;
}
