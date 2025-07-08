import { ConversionContext, generateSectionSeparator } from './codeAssemblyConversion2D';
import { CodeBlock } from '../providers/CodeAssemblyStore';
import { MaterialCatalog, MEDIUM_DEFAULTS, isDefaultValue } from '../constants/meepMaterialPresets';
import { Medium } from '../types/meepMediumTypes';

export interface MaterialsResult {
  success: boolean;
  error?: string;
}

/**
 * Generate materials code block from canvas geometries
 */
export async function generateMaterialsCode(context: ConversionContext): Promise<MaterialsResult> {
  try {
    const { canvasState, codeState } = context;
    const allGeometries = canvasState.geometries;
    // Filter out invisible geometries when determining materials
    const geometries = allGeometries.filter(geom => !geom.invisible);
    
    // Collect unique materials used by visible geometries
    const usedMaterials = new Set<string>();
    
    geometries.forEach(geom => {
      if (geom.material) {
        usedMaterials.add(geom.material);
      }
    });

    // Always include Air and Vacuum for clarity, even if not explicitly used
    usedMaterials.add('Air');
    usedMaterials.add('Vacuum');

    const lines: string[] = [
      generateSectionSeparator('MATERIALS'),
      '',
      `# Define materials used in geometries (${usedMaterials.size} total materials)`,
      `# From ${geometries.length} visible geometries (${allGeometries.length - geometries.length} hidden)`,
      '# Note: Air and Vacuum are always defined for clarity',
      ''
    ];
    
    // Generate material definitions
    const sortedMaterials = Array.from(usedMaterials).sort();
    
    sortedMaterials.forEach((materialKey, index) => {
      const material = MaterialCatalog[materialKey as keyof typeof MaterialCatalog];
      
      if (material) {
        if (index > 0) lines.push('');
        lines.push(`# ${material.name} (${material.abbreviation})`);
        if (material.hint) {
          lines.push(`# ${material.hint}`);
        }
        
        const materialCode = generateSingleMaterialCode(materialKey, material);
        lines.push(...materialCode);
      } else {
        // Handle unknown material
        if (index > 0) lines.push('');
        lines.push(`# WARNING: Unknown material '${materialKey}' - using default medium`);
        lines.push(`${getSanitizedMaterialName(materialKey)} = mp.Medium()`);
      }
    });
    
    // Create code block
    const codeBlock: CodeBlock = {
      key: 'materials',
      label: 'Materials',
      content: lines.join('\n'),
      imports: [],
      dependencies: ['initialization']
    };
    
    // Store in code state
    codeState.setCodeBlock('materials', codeBlock);
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate materials code'
    };
  }
}

/**
 * Generate Python code for a single material definition
 */
function generateSingleMaterialCode(materialKey: string, material: Medium): string[] {
  const lines: string[] = [];
  const varName = getSanitizedMaterialName(materialKey);
  
  // Special handling for Air and Vacuum
  if (materialKey === 'Air') {
    // Air with actual refractive index for accuracy
    lines.push(`${varName} = mp.Medium(index=${material.index})`);
    return lines;
  }
  
  if (materialKey === 'Vacuum') {
    // Vacuum using mp.Medium() for clarity but with variable name
    lines.push(`${varName} = mp.Medium()  # Perfect vacuum, n=1.0`);
    return lines;
  }
  
  // Start building the Medium definition for other materials
  const params: string[] = [];
  
  // Handle different types of material properties
  if (material.E_susceptibilities && material.E_susceptibilities.length > 0) {
    // Dispersive material with susceptibilities (e.g., metals with Drude model)
    if (material.epsilon !== undefined && !isDefaultValue('epsilon', material.epsilon)) {
      params.push(`epsilon=${material.epsilon}`);
    }
    
    // Add susceptibilities
    const susceptibilityLines = material.E_susceptibilities.map(susc => 
      `        mp.${susc}`
    );
    params.push(`E_susceptibilities=[\n${susceptibilityLines.join(',\n')}\n    ]`);
    
  } else {
    // Simple dielectric material
    if (material.index !== undefined) {
      // Use refractive index if available
      params.push(`index=${material.index}`);
    } else if (material.epsilon !== undefined && !isDefaultValue('epsilon', material.epsilon)) {
      // Use permittivity
      params.push(`epsilon=${material.epsilon}`);
    }
    
    // Add permeability if not default
    if (material.mu !== undefined && !isDefaultValue('mu', material.mu)) {
      params.push(`mu=${material.mu}`);
    }
    
    // Add conductivity if present
    if (material.D_conductivity !== undefined && !isDefaultValue('D_conductivity', material.D_conductivity)) {
      params.push(`D_conductivity=${material.D_conductivity}`);
    }
    
    // Add nonlinear terms if present
    if (material.chi2 !== undefined && !isDefaultValue('chi2', material.chi2)) {
      params.push(`chi2=${material.chi2}`);
    }
    
    if (material.chi3 !== undefined && !isDefaultValue('chi3', material.chi3)) {
      params.push(`chi3=${material.chi3}`);
    }
    
    // Add anisotropic terms if needed
    if (material.epsilon_diag && !isDefaultVector3(material.epsilon_diag)) {
      params.push(`epsilon_diag=mp.Vector3(${material.epsilon_diag.x}, ${material.epsilon_diag.y}, ${material.epsilon_diag.z})`);
    }
    
    if (material.mu_diag && !isDefaultVector3(material.mu_diag)) {
      params.push(`mu_diag=mp.Vector3(${material.mu_diag.x}, ${material.mu_diag.y}, ${material.mu_diag.z})`);
    }
  }
  
  // Generate the material definition
  if (params.length === 0) {
    // Default medium
    lines.push(`${varName} = mp.Medium()`);
  } else if (params.length === 1 && !params[0].includes('\n')) {
    // Single parameter, inline
    lines.push(`${varName} = mp.Medium(${params[0]})`);
  } else {
    // Multiple parameters or complex structure, multiline
    lines.push(`${varName} = mp.Medium(`);
    params.forEach((param, index) => {
      const isLast = index === params.length - 1;
      const suffix = isLast ? '' : ',';
      
      if (param.includes('\n')) {
        // Multi-line parameter (like susceptibilities)
        lines.push(`    ${param}${suffix}`);
      } else {
        // Single-line parameter
        lines.push(`    ${param}${suffix}`);
      }
    });
    lines.push(`)`);
  }
  
  return lines;
}

/**
 * Convert material key to valid Python variable name
 */
function getSanitizedMaterialName(materialKey: string): string {
  // Convert to snake_case and ensure it's a valid Python identifier
  return materialKey
    .replace(/([A-Z])/g, '_$1')  // Add underscore before capitals
    .toLowerCase()
    .replace(/^_/, '')           // Remove leading underscore
    .replace(/[^a-z0-9_]/g, '_') // Replace invalid chars with underscore
    .replace(/_+/g, '_')         // Replace multiple underscores with single
    .replace(/_$/, '');          // Remove trailing underscore
}

/**
 * Get the Python variable name for a material that will be used in geometry definitions
 */
export function getMaterialVariableName(materialKey: string): string {
  if (!materialKey) {
    return 'air'; // Default to air variable
  }
  
  return getSanitizedMaterialName(materialKey);
}

/**
 * Check if a Vector3 is different from default
 */
function isDefaultVector3(vec: { x: number; y: number; z: number }): boolean {
  return vec.x === 1 && vec.y === 1 && vec.z === 1;
}

/**
 * Get all materials used in the current canvas state
 */
export function getUsedMaterials(canvasState: any): Set<string> {
  const usedMaterials = new Set<string>();
  
  if (canvasState.geometries) {
    // Only consider visible geometries
    canvasState.geometries
      .filter((geom: any) => !geom.invisible)
      .forEach((geom: any) => {
        if (geom.material) {
          usedMaterials.add(geom.material);
        }
      });
  }
  
  // Always include Air and Vacuum for clarity
  usedMaterials.add('Air');
  usedMaterials.add('Vacuum');
  
  return usedMaterials;
}

/**
 * Validate material definitions
 */
export function validateMaterials(materialKeys: string[]): string[] {
  const errors: string[] = [];
  
  materialKeys.forEach(key => {
    if (!MaterialCatalog[key as keyof typeof MaterialCatalog]) {
      errors.push(`Unknown material: ${key}`);
    }
  });
  
  return errors;
}

/**
 * Parse material code and convert to canvas materials (for import)
 */
export function parseMaterialCode(code: string): any[] {
  // TODO: Implement parsing logic
  // This would parse Python code and extract material definitions
  
  const materials: any[] = [];
  
  // Placeholder implementation
  // Would need proper Python parsing to extract material definitions
  
  return materials;
}
