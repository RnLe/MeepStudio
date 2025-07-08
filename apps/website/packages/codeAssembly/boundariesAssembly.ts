import { ConversionContext, generateSectionSeparator } from './codeAssemblyConversion2D';
import { CodeBlock } from '../providers/CodeAssemblyStore';
import { CanvasPMLBoundary, PMLEdgeParameters } from '../types/meepBoundaryTypes';
import { PML_EDGE_DEFAULTS } from '../constants/boundaryDefaults';

export interface BoundariesResult {
  success: boolean;
  error?: string;
}

type Edge = 'top' | 'right' | 'bottom' | 'left';
type EdgePair = 'horizontal' | 'vertical';

/**
 * Generate boundaries code block from canvas boundaries
 */
export async function generateBoundariesCode(context: ConversionContext): Promise<BoundariesResult> {
  try {
    const { canvasState, codeState } = context;
    const boundaries = canvasState.boundaries;
    
    const lines: string[] = [
      generateSectionSeparator('BOUNDARIES'),
      '',
      `# Define boundary conditions`,
      ''
    ];
    
    // Find PML boundary (should only be one)
    const pmlBoundary = boundaries.find(b => b.kind === 'pmlBoundary') as CanvasPMLBoundary | undefined;
    
    if (pmlBoundary) {
      const pmlCode = generatePMLBoundaries(pmlBoundary);

      if (pmlCode.length > 0) {
        lines.push('# PML (Perfectly Matched Layer) boundaries');
        lines.push('boundary_layers = []');
        lines.push('');
        lines.push(...pmlCode);
      } else {
        lines.push('# No PML edges assigned - using default boundary conditions');
        lines.push('boundary_layers = []');
      }
    } else {
      lines.push('# No boundary conditions defined - using default boundary conditions');
      lines.push('boundary_layers = []');
    }
    
    // Create code block
    const codeBlock: CodeBlock = {
      key: 'boundaries',
      label: 'Boundaries',
      content: lines.join('\n'),
      imports: [],
      dependencies: ['initialization']
    };
    
    // Store in code state
    codeState.setCodeBlock('boundaries', codeBlock);
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate boundaries code'
    };
  }
}

/**
 * Generate PML boundary objects based on edge assignments
 */
function generatePMLBoundaries(pmlBoundary: CanvasPMLBoundary): string[] {
  const lines: string[] = [];
  const { parameterSets, edgeAssignments } = pmlBoundary;
  
  // Check if we have any edge assignments
  const hasEdgeAssignments = edgeAssignments && Object.keys(edgeAssignments).length > 0;
  
  if (!hasEdgeAssignments) {
    // No explicit edge assignments - check if parameter set 0 is active for default behavior
    if (parameterSets?.[0]?.active) {
      // Apply parameter set 0 to all edges as default
      const defaultParams = parameterSets[0];
      lines.push('# PML for all boundaries (default)');
      lines.push(...generateSinglePML(defaultParams, 'ALL', 'ALL'));
      return lines;
    } else {
      // No edges assigned and no default parameter set - don't create any PML
      return [];
    }
  }
  
  // Group edges by parameter set
  const edgesByParamSet = groupEdgesByParameterSet(edgeAssignments, parameterSets);
  
  // Check for optimizations (opposite edges with same parameters)
  const optimizedPMLs = optimizePMLGeneration(edgesByParamSet);
  
  // Generate PML objects
  optimizedPMLs.forEach((pmlConfig, index) => {
    if (index > 0) lines.push('');
    
    const edgeDesc = describeEdges(pmlConfig.edges);
    lines.push(`# PML for ${edgeDesc}`);
    lines.push(...generateSinglePML(pmlConfig.params, pmlConfig.direction, pmlConfig.side));
  });
  
  return lines;
}

/**
 * Group edges by their assigned parameter set
 */
function groupEdgesByParameterSet(
  edgeAssignments: Record<string, number>,
  parameterSets: Record<number, PMLEdgeParameters> | undefined
): Map<number, { edges: Edge[]; params: PMLEdgeParameters }> {
  const grouped = new Map<number, { edges: Edge[]; params: PMLEdgeParameters }>();
  
  Object.entries(edgeAssignments).forEach(([edge, setIndex]) => {
    const params = parameterSets?.[setIndex] || PML_EDGE_DEFAULTS;
    
    if (!grouped.has(setIndex)) {
      grouped.set(setIndex, { edges: [], params });
    }
    grouped.get(setIndex)!.edges.push(edge as Edge);
  });
  
  return grouped;
}

/**
 * Optimize PML generation by combining opposite edges with same parameters
 */
function optimizePMLGeneration(
  edgesByParamSet: Map<number, { edges: Edge[]; params: PMLEdgeParameters }>
): Array<{
  params: PMLEdgeParameters;
  edges: Edge[];
  direction: string;
  side: string;
}> {
  const pmlConfigs: Array<{
    params: PMLEdgeParameters;
    edges: Edge[];
    direction: string;
    side: string;
  }> = [];
  
  // Process each parameter set
  edgesByParamSet.forEach(({ edges, params }) => {
    // Check if we have opposite edges
    const hasTop = edges.includes('top');
    const hasBottom = edges.includes('bottom');
    const hasLeft = edges.includes('left');
    const hasRight = edges.includes('right');
    
    // If all four edges with same parameters
    if (edges.length === 4) {
      pmlConfigs.push({
        params,
        edges,
        direction: 'ALL',
        side: 'ALL'
      });
    }
    // If both horizontal edges
    else if (hasTop && hasBottom && !hasLeft && !hasRight) {
      pmlConfigs.push({
        params,
        edges: ['top', 'bottom'],
        direction: 'Y',
        side: 'ALL'
      });
    }
    // If both vertical edges
    else if (hasLeft && hasRight && !hasTop && !hasBottom) {
      pmlConfigs.push({
        params,
        edges: ['left', 'right'],
        direction: 'X',
        side: 'ALL'
      });
    }
    // Otherwise, create individual PMLs for each edge
    else {
      edges.forEach(edge => {
        const { direction, side } = getDirectionAndSide(edge);
        pmlConfigs.push({
          params,
          edges: [edge],
          direction,
          side
        });
      });
    }
  });
  
  return pmlConfigs;
}

/**
 * Get Meep direction and side constants for an edge
 */
function getDirectionAndSide(edge: Edge): { direction: string; side: string } {
  switch (edge) {
    case 'top':
      return { direction: 'Y', side: 'High' };
    case 'bottom':
      return { direction: 'Y', side: 'Low' };
    case 'left':
      return { direction: 'X', side: 'Low' };
    case 'right':
      return { direction: 'X', side: 'High' };
  }
}

/**
 * Generate a single PML object
 */
function generateSinglePML(
  params: PMLEdgeParameters,
  direction: string,
  side: string
): string[] {
  const lines: string[] = [];
  
  lines.push('boundary_layers.append(mp.PML(');
  
  // Always include thickness
  lines.push(`    thickness=${params.thickness},`);
  
  // Direction (only if not ALL)
  if (direction !== 'ALL') {
    lines.push(`    direction=mp.${direction},`);
  }
  
  // Side (only if not ALL)
  if (side !== 'ALL') {
    lines.push(`    side=mp.${side},`);
  }
  
  // R_asymptotic (only if not default)
  if (params.R_asymptotic !== PML_EDGE_DEFAULTS.R_asymptotic) {
    lines.push(`    R_asymptotic=${params.R_asymptotic},`);
  }
  
  // Remove trailing comma from last parameter
  const lastLine = lines[lines.length - 1];
  lines[lines.length - 1] = lastLine.slice(0, -1);
  
  lines.push('))');
  
  return lines;
}

/**
 * Describe edges in human-readable format
 */
function describeEdges(edges: Edge[]): string {
  if (edges.length === 4) return 'all boundaries';
  if (edges.length === 2) {
    if (edges.includes('top') && edges.includes('bottom')) return 'top and bottom boundaries';
    if (edges.includes('left') && edges.includes('right')) return 'left and right boundaries';
  }
  return edges.join(' and ') + (edges.length === 1 ? ' boundary' : ' boundaries');
}

/**
 * Convert Meep PML back to canvas representation (for import)
 */
export function convertMeepPMLToCanvas(meepPMLs: any[]): CanvasPMLBoundary | null {
  // This would parse multiple Meep PML objects and reconstruct the canvas representation
  // For now, return null as this is complex and requires parsing Python code
  return null;
}

/**
 * Validate boundary parameters
 */
export function validateBoundary(boundary: any): string[] {
  const errors: string[] = [];
  
  if (boundary.kind === 'pmlBoundary') {
    const pml = boundary as CanvasPMLBoundary;
    
    // Check parameter sets
    if (pml.parameterSets) {
      Object.entries(pml.parameterSets).forEach(([setIndex, params]) => {
        if (params.active) {
          if (params.thickness <= 0) {
            errors.push(`Parameter set ${setIndex}: thickness must be positive`);
          }
          if (params.R_asymptotic <= 0 || params.R_asymptotic >= 1) {
            errors.push(`Parameter set ${setIndex}: R_asymptotic must be between 0 and 1`);
          }
        }
      });
    }
  }
  return errors;
}