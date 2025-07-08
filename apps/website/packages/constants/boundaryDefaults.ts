import { 
  CanvasPMLBoundary, 
  PMLEdgeParameters,
  PMLParameterSets
} from '../types/meepBoundaryTypes';

// Default PML edge parameters
export const PML_EDGE_DEFAULTS: PMLEdgeParameters = {
  thickness: 1.0,
  R_asymptotic: 1e-15,
  active: true
};

// Default inactive parameter set
export const PML_INACTIVE_DEFAULTS: PMLEdgeParameters = {
  thickness: 1.0,
  R_asymptotic: 1e-15,
  active: false
};

// Default parameter sets configuration
export const PML_PARAMETER_SETS_DEFAULTS: PMLParameterSets = {
  0: { ...PML_EDGE_DEFAULTS, active: true },
  1: { ...PML_INACTIVE_DEFAULTS },
  2: { ...PML_INACTIVE_DEFAULTS },
  3: { ...PML_INACTIVE_DEFAULTS }
};

// Default PML boundary configuration
export const PML_BOUNDARY_DEFAULTS: Partial<CanvasPMLBoundary> = {
  kind: 'pmlBoundary',
  thickness: 1.0,
  R_asymptotic: 1e-15,
  parameterSets: PML_PARAMETER_SETS_DEFAULTS,
  edgeAssignments: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
};

/**
 * Get default values for a specific boundary type
 */
export function getBoundaryDefaults(type: 'pml' | 'periodic' | 'metallic'): any {
  switch (type) {
    case 'pml':
      return { ...PML_BOUNDARY_DEFAULTS };
    case 'periodic':
      // TODO: Add periodic boundary defaults when implemented
      return {
        kind: 'periodicBoundary',
        k_point: { x: 0, y: 0, z: 0 }
      };
    case 'metallic':
      // TODO: Add metallic boundary defaults when implemented
      return {
        kind: 'metallicBoundary'
      };
    default:
      return { ...PML_BOUNDARY_DEFAULTS };
  }
}

/**
 * Check if a parameter value differs from default
 */
export function isNonDefaultPMLParameter(param: keyof PMLEdgeParameters, value: any): boolean {
  return value !== PML_EDGE_DEFAULTS[param];
}

/**
 * Check if parameter sets configuration differs from defaults
 */
export function hasNonDefaultParameterSets(parameterSets: PMLParameterSets | undefined): boolean {
  if (!parameterSets) return false;
  
  // Check if any set other than 0 is active
  if ([1, 2, 3].some(i => parameterSets[i]?.active)) return true;
  
  // Check if set 0 has non-default values
  const set0 = parameterSets[0];
  if (set0) {
    return (
      set0.thickness !== PML_EDGE_DEFAULTS.thickness ||
      set0.R_asymptotic !== PML_EDGE_DEFAULTS.R_asymptotic
    );
  }
  
  return false;
}

/**
 * Check if edge assignments differ from defaults (empty)
 */
export function hasNonDefaultEdgeAssignments(edgeAssignments: any): boolean {
  return edgeAssignments && Object.keys(edgeAssignments).length > 0;
}
