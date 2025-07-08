import { ConversionContext, generateSectionSeparator } from './codeAssemblyConversion2D';
import { CodeBlock } from '../providers/CodeAssemblyStore';
import { SceneLattice } from '../types/canvasElementTypes';

export interface LatticeResult {
  success: boolean;
  error?: string;
}

/**
 * Generate lattice code block from canvas lattices
 */
export async function generateLatticeCode(context: ConversionContext): Promise<LatticeResult> {
  try {
    const { canvasState, codeState } = context;
    const lattices = canvasState.lattices || [];
    
    const lines: string[] = [
      generateSectionSeparator('LATTICES'),
      '',
      `# Define lattice structures and replicated geometries (${lattices.length} total)`,
      ''
    ];
    
    if (lattices.length === 0) {
      lines.push('# No lattices defined yet');
      lines.push('lattice_geometries = []');
    } else {
      lines.push('# Lattice geometries - geometries replicated on lattice points');
      lines.push('lattice_geometries = []');
      lines.push('');
      
      // Process each lattice
      lattices.forEach((lattice, latticeIndex) => {
        const latticeNum = latticeIndex + 1;
        
        // Generate lattice structure code
        lines.push(`# Lattice ${latticeNum}: ${getLatticeDescription(lattice)}`);
        lines.push(`lattice_${latticeNum}_basis1 = mp.Vector3(${lattice.basis1.x}, ${lattice.basis1.y}, 0)`);
        lines.push(`lattice_${latticeNum}_basis2 = mp.Vector3(${lattice.basis2.x}, ${lattice.basis2.y}, 0)`);
        lines.push(`lattice_${latticeNum}_origin = mp.Vector3(${lattice.pos.x}, ${lattice.pos.y}, 0)`);
        lines.push('');
        
        // Generate lattice points and geometries if tied geometry exists
        if (lattice.tiedGeometryId && lattice.showMode === 'geometry') {
          const tiedGeometry = canvasState.geometries?.find(g => g.id === lattice.tiedGeometryId);
          if (tiedGeometry && !tiedGeometry.invisible) {
            const points = getLatticePoints(lattice);
            if (points.length > 0) {
              lines.push(`# Generate ${points.length} geometries on lattice ${latticeNum} points`);
              lines.push(...generateLatticeGeometryCode(lattice, tiedGeometry, points, latticeNum));
              lines.push('');
            }
          }
        }
      });
      
      // Add all lattice geometries to the main geometry list
      const activeLatticeCount = lattices.filter(l => 
        l.tiedGeometryId && 
        l.showMode === 'geometry' && 
        canvasState.geometries?.find(g => g.id === l.tiedGeometryId && !g.invisible)
      ).length;
      
      if (activeLatticeCount > 0) {
        lines.push('# Add all lattice geometries to the main geometry list');
        lines.push('geometry.extend(lattice_geometries)');
        lines.push(`print(f"Added {len(lattice_geometries)} lattice geometries to simulation")`);
      }
    }
    
    lines.push('');
    
    // Create code block
    const codeBlock: CodeBlock = {
      key: 'lattices',
      label: 'Lattices',
      content: lines.join('\n'),
      imports: [],
      dependencies: ['initialization', 'materials', 'geometries']
    };
    
    // Store in code state
    codeState.setCodeBlock('lattices', codeBlock);
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate lattice code'
    };
  }
}

/**
 * Get lattice points based on the lattice configuration
 */
function getLatticePoints(lattice: SceneLattice): Array<{ x: number; y: number }> {
  if (lattice.fillMode === 'centerFill' && lattice.calculatedPoints) {
    // Use pre-calculated points from WASM calculate_rectangle_lattice_points
    return lattice.calculatedPoints.map(p => ({
      x: lattice.pos.x + p.x,
      y: lattice.pos.y + p.y
    }));
  } else {
    // Generate points using manual multiplier mode
    const points: Array<{ x: number; y: number }> = [];
    const mult = lattice.multiplier || 3;
    const halfMult = Math.floor(mult / 2);
    
    for (let i = -halfMult; i <= halfMult; i++) {
      for (let j = -halfMult; j <= halfMult; j++) {
        const x = lattice.pos.x + i * lattice.basis1.x + j * lattice.basis2.x;
        const y = lattice.pos.y + i * lattice.basis1.y + j * lattice.basis2.y;
        points.push({ x, y });
      }
    }
    
    return points;
  }
}

/**
 * Generate geometry code for a lattice with tied geometry
 */
function generateLatticeGeometryCode(
  lattice: SceneLattice, 
  geometry: any, 
  points: Array<{ x: number; y: number }>,
  latticeNum: number
): string[] {
  const lines: string[] = [];
  
  // Get geometry parameters
  const material = geometry.material || 'Air';
  const materialVar = `material_${material.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  // Generate geometry creation code based on type
  let geomCreationCode: string;
  switch (geometry.kind) {
    case 'cylinder':
      geomCreationCode = `mp.Cylinder(center=point, radius=${geometry.radius}, height=mp.inf, material=${materialVar})`;
      break;
    case 'rectangle':
      geomCreationCode = `mp.Block(center=point, size=mp.Vector3(${geometry.width}, ${geometry.height}, mp.inf), material=${materialVar})`;
      break;
    case 'triangle':
      geomCreationCode = `# Triangle geometry - requires mp.Prism implementation`;
      break;
    default:
      geomCreationCode = `# Unsupported geometry type: ${geometry.kind}`;
  }
  
  if (geometry.kind !== 'triangle') {
    lines.push(
      `# Create ${geometry.kind} at each lattice point`,
      `for i, point_coords in enumerate([`,
      ...points.map((p, idx) => `    mp.Vector3(${p.x.toFixed(6)}, ${p.y.toFixed(6)}, 0)${idx < points.length - 1 ? ',' : ''}`),
      `]):`,
      `    point = point_coords`,
      `    lattice_geom = ${geomCreationCode}`,
      `    lattice_geometries.append(lattice_geom)`
    );
  } else {
    lines.push('# Triangle geometries not yet supported in lattice replication');
  }
  
  return lines;
}

/**
 * Get a description of the lattice for comments
 */
function getLatticeDescription(lattice: SceneLattice): string {
  const fillModeDesc = lattice.fillMode === 'centerFill' ? 'Center&Fill' : `${lattice.multiplier}×${lattice.multiplier} Manual`;
  const geomDesc = lattice.tiedGeometryId ? 
    (lattice.showMode === 'geometry' ? 'with geometry' : 'points only') : 
    'no geometry';
  
  return `${fillModeDesc}, ${geomDesc}`;
}

/**
 * Parse lattice code and convert to canvas lattices (for import)
 */
export function parseLatticeCode(code: string): SceneLattice[] {
  // TODO: Implement parsing logic
  // This would parse Python code and extract lattice definitions
  
  const lattices: SceneLattice[] = [];
  
  // Placeholder implementation
  // Would need proper Python parsing to extract lattice definitions
  
  return lattices;
}

/**
 * Validate lattice parameters
 */
export function validateLattices(lattices: SceneLattice[]): string[] {
  const errors: string[] = [];
  
  lattices.forEach((lattice, index) => {
    // Check for valid basis vectors
    if (!lattice.basis1 || !lattice.basis2) {
      errors.push(`Lattice ${index + 1}: Missing basis vectors`);
    }
    
    // Check for linearly independent basis vectors
    if (lattice.basis1 && lattice.basis2) {
      const det = lattice.basis1.x * lattice.basis2.y - lattice.basis1.y * lattice.basis2.x;
      if (Math.abs(det) < 1e-10) {
        errors.push(`Lattice ${index + 1}: Basis vectors are linearly dependent (determinant ≈ 0)`);
      }
    }
    
    // Check multiplier in manual mode
    if (lattice.fillMode === 'manual' && (!lattice.multiplier || lattice.multiplier < 1)) {
      errors.push(`Lattice ${index + 1}: Invalid multiplier in manual mode`);
    }
    
    // Check tied geometry
    if (lattice.tiedGeometryId && lattice.showMode === 'geometry') {
      // Note: We can't check if the geometry exists here as we don't have access to geometries
      // This validation should be done at a higher level
    }
  });
  
  return errors;
}
