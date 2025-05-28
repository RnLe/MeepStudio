import { ConversionContext, generateSectionSeparator } from './codeAssemblyConversion2D';
import { CodeBlock } from '../providers/CodeAssemblyStore';
import { Cylinder, Block, Wedge, Sphere, Prism } from '../types/meepGeometryTypes';

export interface GeometryResult {
  success: boolean;
  error?: string;
}

export type MeepGeometry = Cylinder | Block | Wedge | Sphere | Prism;

/**
 * Generate geometry code block from canvas geometries
 */
export async function generateGeometryCode(context: ConversionContext): Promise<GeometryResult> {
  try {
    const { canvasState, codeState } = context;
    const geometries = canvasState.geometries;
    
    const lines: string[] = [
      generateSectionSeparator('GEOMETRIES'),
      '',
      `# Define geometry objects (${geometries.length} total)`,
      'geometry = []',
      ''
    ];
    
    if (geometries.length === 0) {
      lines.push('# No geometries defined yet');
    } else {
      // Convert each geometry to Meep code
      geometries.forEach((geom, index) => {
        const meepGeom = convertKonvaToMeepGeometry(geom);
        if (meepGeom) {
          lines.push(`# Geometry ${index + 1}: ${getGeometryTypeName(meepGeom)} (ID: ${geom.id})`);
          lines.push(...generateSingleGeometryCode(meepGeom));
          lines.push('');
        }
      });
    }
    
    // Create code block
    const codeBlock: CodeBlock = {
      key: 'geometries',
      label: 'Geometries',
      content: lines.join('\n'),
      imports: [],
      dependencies: ['initialization']
    };
    
    // Store in code state
    codeState.setCodeBlock('geometries', codeBlock);
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate geometry code'
    };
  }
}

/**
 * Get the type name of a Meep geometry
 */
function getGeometryTypeName(geom: MeepGeometry): string {
  if ('height' in geom && 'radius' in geom && !('wedge_angle' in geom) && !('radius2' in geom)) {
    return 'Cylinder';
  } else if ('size' in geom) {
    return 'Block';
  } else if ('wedge_angle' in geom) {
    return 'Wedge';
  } else if ('radius' in geom && !('height' in geom)) {
    return 'Sphere';
  } else if ('vertices' in geom) {
    return 'Prism';
  }
  return 'Unknown';
}

/**
 * Convert Konva 2D geometry to Meep 3D geometry representation
 */
export function convertKonvaToMeepGeometry(konvaGeom: any): MeepGeometry | null {
  // Use the stored center if available, otherwise calculate it
  const center = konvaGeom.center 
    ? { 
        x: konvaGeom.center.x ?? 0, 
        y: konvaGeom.center.y ?? 0, 
        z: konvaGeom.center.z ?? 0  // Ensure z is 0 if undefined
      }
    : { 
        x: konvaGeom.pos?.x ?? konvaGeom.x ?? 0, 
        y: konvaGeom.pos?.y ?? konvaGeom.y ?? 0, 
        z: 0 
      };
  
  // Only set material if it's explicitly defined and not empty
  const material = konvaGeom.material && konvaGeom.material !== 'air' ? konvaGeom.material : undefined;
  
  // Check the 'kind' field first (from canvasElementTypes), then 'type' as fallback
  const elementType = konvaGeom.kind || konvaGeom.type;
  
  switch (elementType) {
    case 'cylinder':
    case 'circle':
      // Circle/Cylinder in 2D -> Cylinder in 3D (infinite height by default)
      return {
        center,
        radius: konvaGeom.radius || 1,
        // Only include height if explicitly set
        ...(konvaGeom.height !== undefined ? { height: konvaGeom.height } : {}),
        axis: { x: 0, y: 0, z: 1 },
        ...(material ? { material } : {}),
        label: konvaGeom.label
      } as Cylinder;
      
    case 'rectangle':
    case 'rect':
      // Rectangle in 2D -> Block in 3D (infinite z-dimension)
      return {
        center,
        size: { 
          x: konvaGeom.width || 1, 
          y: konvaGeom.height || 1, 
          z: Infinity // Will be rendered as mp.inf
        },
        ...(material ? { material } : {}),
        label: konvaGeom.label
      } as Block;
      
    case 'triangle':
    case 'wedge':
      // Triangle in 2D -> Wedge in 3D
      // For a triangle, we can use vertices if available, otherwise use wedge approximation
      if (konvaGeom.vertices && konvaGeom.vertices.length === 3) {
        // Convert triangle vertices to a prism
        return {
          vertices: konvaGeom.vertices.map((v: any) => ({
            x: v.x || 0,
            y: v.y || 0,
            z: 0
          })),
          // Only include height if explicitly set
          ...(konvaGeom.height !== undefined ? { height: konvaGeom.height } : {}),
          axis: { x: 0, y: 0, z: 1 },
          center, // Always include center for prisms
          ...(material ? { material } : {}),
          label: konvaGeom.label
        } as Prism;
      } else {
        // Fallback to wedge representation
        const wedgeAngle = konvaGeom.wedge_angle || (2 * Math.PI / 3); // 120 degrees default
        return {
          center,
          radius: konvaGeom.radius || 1,
          // Only include height if explicitly set
          ...(konvaGeom.height !== undefined ? { height: konvaGeom.height } : {}),
          wedge_angle: wedgeAngle,
          wedge_start: konvaGeom.wedge_start || { x: 1, y: 0, z: 0 },
          axis: { x: 0, y: 0, z: 1 },
          ...(material ? { material } : {}),
          label: konvaGeom.label
        } as Wedge;
      }
      
    case 'polygon':
      // Polygon -> Prism
      if (konvaGeom.vertices && konvaGeom.vertices.length >= 3) {
        return {
          vertices: konvaGeom.vertices.map((v: any) => ({
            x: v.x || 0,
            y: v.y || 0,
            z: 0
          })),
          // Only include height if explicitly set
          ...(konvaGeom.height !== undefined ? { height: konvaGeom.height } : {}),
          axis: { x: 0, y: 0, z: 1 },
          center, // Always include center for prisms
          ...(material ? { material } : {}),
          label: konvaGeom.label
        } as Prism;
      }
      return null;
      
    default:
      // Unknown type, log for debugging
      console.warn(`Unknown geometry type: ${elementType}`, konvaGeom);
      return {
        center,
        size: { x: 1, y: 1, z: Infinity },
        ...(material ? { material } : {}),
        label: konvaGeom.label || 'unknown'
      } as Block;
  }
}

/**
 * Convert Meep geometry back to Konva 2D representation
 */
export function convertMeepToKonvaGeometry(meepGeom: MeepGeometry): any {
  const baseKonva = {
    id: `geom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    x: meepGeom.center?.x || 0,
    y: meepGeom.center?.y || 0,
    material: meepGeom.material,
    label: meepGeom.label
  };
  
  if ('height' in meepGeom && 'radius' in meepGeom && !('wedge_angle' in meepGeom)) {
    // Cylinder -> Circle
    return {
      ...baseKonva,
      type: 'circle',
      radius: meepGeom.radius
    };
  } else if ('size' in meepGeom) {
    // Block -> Rectangle
    return {
      ...baseKonva,
      type: 'rectangle',
      width: meepGeom.size.x,
      height: meepGeom.size.y
    };
  } else if ('wedge_angle' in meepGeom) {
    // Wedge -> Triangle/Wedge shape
    return {
      ...baseKonva,
      type: 'wedge',
      radius: meepGeom.radius,
      wedge_angle: meepGeom.wedge_angle,
      wedge_start: meepGeom.wedge_start
    };
  } else if ('vertices' in meepGeom) {
    // Prism -> Polygon
    return {
      ...baseKonva,
      type: 'polygon',
      vertices: meepGeom.vertices.map(v => ({ x: v.x, y: v.y }))
    };
  }
  
  // Default fallback
  return {
    ...baseKonva,
    type: 'rectangle',
    width: 1,
    height: 1
  };
}

/**
 * Default values for Meep geometry attributes
 */
const MEEP_DEFAULTS = {
  cylinder: {
    axis: { x: 0, y: 0, z: 1 },
    material: 'mp.Medium()'
  },
  block: {
    material: 'mp.Medium()'
  },
  wedge: {
    axis: { x: 0, y: 0, z: 1 },
    material: 'mp.Medium()'
  },
  sphere: {
    material: 'mp.Medium()'
  },
  prism: {
    axis: { x: 0, y: 0, z: 1 },
    material: 'mp.Medium()',
    sidewall_angle: 0
  }
};

/**
 * Check if a Vector3 matches the default value
 */
function isDefaultVector3(v1: { x: number; y: number; z: number } | undefined, v2: { x: number; y: number; z: number }): boolean {
  if (!v1) return false;
  return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
}

/**
 * Generate Python code for a single Meep geometry
 */
function generateSingleGeometryCode(geom: MeepGeometry): string[] {
  const lines: string[] = [];
  
  // Helper to format Vector3
  const formatVector3 = (v: { x: number; y: number; z: number }) => 
    `mp.Vector3(${v.x}, ${v.y}, ${v.z})`;
  
  // Helper to format infinity
  const formatValue = (val: number) => val === Infinity ? 'mp.inf' : val.toString();
  
  if ('radius' in geom && !('wedge_angle' in geom) && !('radius2' in geom) && !('vertices' in geom)) {
    // Cylinder or Sphere
    if ('height' in geom) {
      // Cylinder
      const cylinder = geom as Cylinder;
      lines.push(`geometry.append(mp.Cylinder(`);
      
      // Always include center
      lines.push(`    center=${formatVector3(cylinder.center || { x: 0, y: 0, z: 0 })},`);
      lines.push(`    radius=${cylinder.radius},`);
      
      // Only include height if defined
      if (cylinder.height !== undefined) {
        lines.push(`    height=${formatValue(cylinder.height)},`);
      }
      
      // Only include axis if not default
      if (cylinder.axis && !isDefaultVector3(cylinder.axis, MEEP_DEFAULTS.cylinder.axis)) {
        lines.push(`    axis=${formatVector3(cylinder.axis)},`);
      }
      
      // Only include material if defined
      if (cylinder.material) {
        lines.push(`    material=${cylinder.material}`);
      } else {
        // Remove trailing comma from last line
        const lastLine = lines[lines.length - 1];
        lines[lines.length - 1] = lastLine.slice(0, -1);
      }
      
      lines.push(`))`);
    } else {
      // Sphere (no height property)
      const sphere = geom as Sphere;
      lines.push(`geometry.append(mp.Sphere(`);
      
      // Always include center
      lines.push(`    center=${formatVector3(sphere.center || { x: 0, y: 0, z: 0 })},`);
      lines.push(`    radius=${sphere.radius},`);
      
      // Only include material if defined
      if (sphere.material) {
        lines.push(`    material=${sphere.material}`);
      } else {
        // Remove trailing comma from last line
        const lastLine = lines[lines.length - 1];
        lines[lines.length - 1] = lastLine.slice(0, -1);
      }
      
      lines.push(`))`);
    }
    
  } else if ('size' in geom) {
    // Block
    const block = geom as Block;
    lines.push(`geometry.append(mp.Block(`);
    
    // Always include center
    lines.push(`    center=${formatVector3(block.center || { x: 0, y: 0, z: 0 })},`);
    lines.push(`    size=mp.Vector3(${formatValue(block.size.x)}, ${formatValue(block.size.y)}, ${formatValue(block.size.z)}),`);
    
    // Only include e1, e2, e3 if specified (no defaults in Meep)
    if (block.e1) lines.push(`    e1=${formatVector3(block.e1)},`);
    if (block.e2) lines.push(`    e2=${formatVector3(block.e2)},`);
    if (block.e3) lines.push(`    e3=${formatVector3(block.e3)},`);
    
    // Only include material if defined
    if (block.material) {
      lines.push(`    material=${block.material}`);
    } else {
      // Remove trailing comma from last line
      const lastLine = lines[lines.length - 1];
      lines[lines.length - 1] = lastLine.slice(0, -1);
    }
    
    lines.push(`))`);
    
  } else if ('wedge_angle' in geom) {
    // Wedge
    const wedge = geom as Wedge;
    lines.push(`geometry.append(mp.Wedge(`);
    
    // Always include center
    lines.push(`    center=${formatVector3(wedge.center || { x: 0, y: 0, z: 0 })},`);
    lines.push(`    radius=${wedge.radius},`);
    
    // Only include height if defined
    if (wedge.height !== undefined) {
      lines.push(`    height=${formatValue(wedge.height)},`);
    }
    
    lines.push(`    wedge_angle=${wedge.wedge_angle},`);
    lines.push(`    wedge_start=${formatVector3(wedge.wedge_start)},`);
    
    // Only include axis if not default
    if (wedge.axis && !isDefaultVector3(wedge.axis, MEEP_DEFAULTS.wedge.axis)) {
      lines.push(`    axis=${formatVector3(wedge.axis)},`);
    }
    
    // Only include material if defined
    if (wedge.material) {
      lines.push(`    material=${wedge.material}`);
    } else {
      // Remove trailing comma from last line
      const lastLine = lines[lines.length - 1];
      lines[lines.length - 1] = lastLine.slice(0, -1);
    }
    
    lines.push(`))`);
    
  } else if ('vertices' in geom) {
    // Prism
    const prism = geom as Prism;
    lines.push(`geometry.append(mp.Prism(`);
    lines.push(`    vertices=[`);
    prism.vertices.forEach((v, i) => {
      const comma = i < prism.vertices.length - 1 ? ',' : '';
      lines.push(`        ${formatVector3(v)}${comma}`);
    });
    lines.push(`    ],`);
    
    // Only include height if defined
    if (prism.height !== undefined) {
      lines.push(`    height=${formatValue(prism.height)},`);
    }
    
    // Always include center for prisms
    lines.push(`    center=${formatVector3(prism.center || { x: 0, y: 0, z: 0 })},`);
    
    // Only include axis if not default
    if (prism.axis && !isDefaultVector3(prism.axis, MEEP_DEFAULTS.prism.axis)) {
      lines.push(`    axis=${formatVector3(prism.axis)},`);
    }
    
    // Only include sidewall_angle if not default (0)
    if (prism.sidewall_angle !== undefined && prism.sidewall_angle !== MEEP_DEFAULTS.prism.sidewall_angle) {
      lines.push(`    sidewall_angle=${prism.sidewall_angle},`);
    }
    
    // Only include material if defined
    if (prism.material) {
      lines.push(`    material=${prism.material}`);
    } else {
      // Remove trailing comma from last line
      const lastLine = lines[lines.length - 1];
      lines[lines.length - 1] = lastLine.slice(0, -1);
    }
    
    lines.push(`))`);
  }
  
  return lines;
}

/**
 * Parse geometry code and convert to canvas geometries
 */
export function parseGeometryCode(code: string): any[] {
  // TODO: Implement parsing logic
  // This would parse Python code and extract geometry definitions
  
  const geometries: any[] = [];
  
  // Placeholder implementation
  // Would need proper Python parsing to extract geometry definitions
  
  return geometries;
}

/**
 * Validate geometry parameters
 */
export function validateGeometry(geom: any): string[] {
  const errors: string[] = [];
  
  if (!geom.type) {
    errors.push('Geometry type is required');
  }
  
  if (geom.type === 'circle' && (!geom.radius || geom.radius <= 0)) {
    errors.push('Circle radius must be positive');
  }
  
  if (geom.type === 'rectangle' && (!geom.width || !geom.height)) {
    errors.push('Rectangle dimensions are required');
  }
  
  if (geom.type === 'polygon' && (!geom.vertices || geom.vertices.length < 3)) {
    errors.push('Polygon must have at least 3 vertices');
  }
  
  return errors;
}
