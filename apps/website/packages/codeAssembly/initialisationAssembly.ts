import { ConversionContext, generateSectionSeparator } from './codeAssemblyConversion2D';
import { CodeBlock } from '../providers/CodeAssemblyStore';

export interface InitializationResult {
  success: boolean;
  error?: string;
}

/**
 * Generate initialization code block from simulation parameters
 */
export async function generateInitializationCode(context: ConversionContext): Promise<InitializationResult> {
  try {
    const { codeState } = context;
    const params = codeState.simulationParams;
    
    // Build initialization code
    const lines: string[] = [
      generateSectionSeparator('INITIALIZATION'),
      '',
      '# Initialize Meep simulation environment',
      'import meep as mp',
      'import numpy as np',
      '',
      '# Define simulation parameters',
      `cell_size = mp.Vector3(${params.cellSize.x}, ${params.cellSize.y}, ${params.cellSize.z})`,
      `resolution = ${params.resolution}`,
      '',
      '# Initialize boundary layers (filled later by boundaries section)',
      'pml_layers = []',
      ''
    ];
    
    // Add optional parameters if defined
    if (params.runtime !== undefined) {
      lines.push(`runtime = ${params.runtime}`);
    }
    
    if (params.dtStability !== undefined) {
      lines.push(`dt_stability = ${params.dtStability}`);
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
