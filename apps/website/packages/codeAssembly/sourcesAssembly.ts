import { ConversionContext, generateSectionSeparator } from './codeAssemblyConversion2D';
import { CodeBlock } from '../providers/CodeAssemblyStore';
import { 
  Source, 
  EigenModeSource, 
  SourceComponent,
  ContinuousSource,
  GaussianSource,
  EigenModeDirection,
  EigenModeParity
} from '../types/meepSourceTypes';
import {
  BASE_SOURCE_DEFAULTS,
  CONTINUOUS_SOURCE_DEFAULTS,
  GAUSSIAN_SOURCE_DEFAULTS,
  EIGENMODE_SOURCE_DEFAULTS,
  isInfinityTime
} from '../constants/sourceDefaults';

export interface SourcesResult {
  success: boolean;
  error?: string;
}

export type MeepSource = Source | EigenModeSource;

/**
 * Generate sources code block from canvas sources
 */
export async function generateSourcesCode(context: ConversionContext): Promise<SourcesResult> {
  try {
    const { canvasState, codeState } = context;
    const sources = canvasState.sources;
    
    const lines: string[] = [
      generateSectionSeparator('SOURCES'),
      '',
      `# Define sources (${sources.length} total)`,
      'sources = []',
      ''
    ];
    
    if (sources.length === 0) {
      lines.push('# No sources defined yet');
    } else {
      // Convert each source to Meep code
      sources.forEach((source, index) => {
        const meepSource = convertKonvaToMeepSource(source);
        if (meepSource) {
          lines.push(`# Source ${index + 1}: ${getSourceTypeName(meepSource)} (ID: ${source.id})`);
          lines.push(...generateSingleSourceCode(meepSource));
          lines.push('');
        }
      });
    }
    
    // Create code block
    const codeBlock: CodeBlock = {
      key: 'sources',
      label: 'Sources',
      content: lines.join('\n'),
      imports: [],
      dependencies: ['initialization', 'geometries']
    };
    
    // Store in code state
    codeState.setCodeBlock('sources', codeBlock);
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate sources code'
    };
  }
}

/**
 * Get the type name of a Meep source
 */
function getSourceTypeName(source: MeepSource): string {
  if ('eig_band' in source) {
    return 'EigenModeSource';
  } else if (source.src) {
    if (source.src.includes('ContinuousSource')) {
      return 'ContinuousSource';
    } else if (source.src.includes('GaussianSource')) {
      return 'GaussianSource';
    }
  }
  return 'Source';
}

/**
 * Normalise a Vector3 – always returns {x,y,z} with numeric values.
 */
const normVec3 = (v: any = {}): { x: number; y: number; z: number } => ({
  x: v.x ?? 0,
  y: v.y ?? 0,
  z: v.z ?? 0
});

/**
 * Convert Konva source representation to Meep source
 */
export function convertKonvaToMeepSource(konvaSource: any): MeepSource | null {
  // --- POSITION ----------------------------------------------------------------
  const normalizedCenter = normVec3(
    konvaSource.center || konvaSource.pos || { x: konvaSource.x, y: konvaSource.y }
  );

  // --- SIZE --------------------------------------------------------------------
  const size = normVec3(konvaSource.size);

  // --- AMPLITUDE ---------------------------------------------------------------
  let amplitude = konvaSource.amplitude;
  if (typeof amplitude === 'object' && amplitude && 'real' in amplitude) {
    amplitude = amplitude.real;            // store as float (real part)
  }

  // --- SOURCE-TYPE DETECTION ----------------------------------------------------
  const rawType =
    konvaSource.kind ??
    konvaSource.sourceKind ??
    konvaSource.sourceType ??
    konvaSource.src_type ??
    konvaSource.srcType ??
    konvaSource.type;

  const detectType = (): 'continuous' | 'gaussian' | 'eigenmode' => {
    const t = (rawType || '').toString().toLowerCase();

    if (t.includes('eigen')) return 'eigenmode';
    if (t.includes('gauss') || t === 'pulse') return 'gaussian';
    if (t === 'cw' || t.includes('cont')) return 'continuous';

    // heuristic fallback
    if ('eig_band' in konvaSource) return 'eigenmode';
    if ('width' in konvaSource && 'cutoff' in konvaSource) return 'gaussian';
    return 'continuous';
  };

  const sourceType = detectType();

  // --- COMMON PROPERTIES -------------------------------------------------------
  const baseProps = {
    center: normalizedCenter,
    size,
    component: konvaSource.component || BASE_SOURCE_DEFAULTS.component,
    amplitude: amplitude ?? BASE_SOURCE_DEFAULTS.amplitude.real,
    label: konvaSource.label
  };

  switch (sourceType) {
    case 'continuous':
      return { 
        ...baseProps, 
        src: generateContinuousSourceString(konvaSource)  // No more special handling needed
      } as Source;

    case 'gaussian':
      return { ...baseProps, src: generateGaussianSourceString(konvaSource) } as Source;

    case 'eigenmode':
      return {
        ...baseProps,
        src: generateSourceTimeString(konvaSource),
        eig_band: konvaSource.eig_band ?? EIGENMODE_SOURCE_DEFAULTS.eig_band,
        direction: konvaSource.direction ?? EIGENMODE_SOURCE_DEFAULTS.direction,
        eig_match_freq:
          konvaSource.eig_match_freq ?? EIGENMODE_SOURCE_DEFAULTS.eig_match_freq,
        eig_kpoint: normVec3(konvaSource.eig_kpoint) ?? EIGENMODE_SOURCE_DEFAULTS.eig_kpoint,
        eig_parity: konvaSource.eig_parity ?? EIGENMODE_SOURCE_DEFAULTS.eig_parity,
        eig_resolution: konvaSource.eig_resolution,
        eig_tolerance: konvaSource.eig_tolerance ?? EIGENMODE_SOURCE_DEFAULTS.eig_tolerance,
        component: EIGENMODE_SOURCE_DEFAULTS.component
      } as EigenModeSource;
  }
}

/**
 * Generate ContinuousSource string representation
 */
function generateContinuousSourceString(source: any): string {
  const frequency = source.frequency ?? CONTINUOUS_SOURCE_DEFAULTS.frequency;
  
  // Now we only need to check snake_case since UI uses it consistently
  const start_time = source.start_time ?? CONTINUOUS_SOURCE_DEFAULTS.start_time;
  const end_time = source.end_time ?? CONTINUOUS_SOURCE_DEFAULTS.end_time;
  const width = source.width ?? CONTINUOUS_SOURCE_DEFAULTS.width;
  const slowness = source.slowness ?? CONTINUOUS_SOURCE_DEFAULTS.slowness;
  const fwidth = source.fwidth;

  const params: string[] = [`frequency=${frequency}`];

  if (start_time !== CONTINUOUS_SOURCE_DEFAULTS.start_time) params.push(`start_time=${start_time}`);
  if (!isInfinityTime(end_time) && end_time !== CONTINUOUS_SOURCE_DEFAULTS.end_time) params.push(`end_time=${end_time}`);
  if (width !== CONTINUOUS_SOURCE_DEFAULTS.width) params.push(`width=${width}`);
  if (slowness !== CONTINUOUS_SOURCE_DEFAULTS.slowness) params.push(`slowness=${slowness}`);
  if (fwidth !== undefined) params.push(`fwidth=${fwidth}`);

  return `mp.ContinuousSource(${params.join(', ')})`;
}

/**
 * Generate GaussianSource string representation
 */
function generateGaussianSourceString(source: any): string {
  const frequency = source.frequency ?? GAUSSIAN_SOURCE_DEFAULTS.frequency;
  const width = source.width ?? GAUSSIAN_SOURCE_DEFAULTS.width;
  const fwidth = source.fwidth;
  const start_time = source.start_time ?? GAUSSIAN_SOURCE_DEFAULTS.start_time;  // No more fallback needed
  const cutoff = source.cutoff ?? GAUSSIAN_SOURCE_DEFAULTS.cutoff;
  
  const params: string[] = [
    `frequency=${frequency}`,
    `width=${width}`
  ];
  
  // Only add parameters if they differ from defaults
  if (fwidth !== undefined) {
    params.push(`fwidth=${fwidth}`);
  }
  if (start_time !== GAUSSIAN_SOURCE_DEFAULTS.start_time) {
    params.push(`start_time=${start_time}`);
  }
  if (cutoff !== GAUSSIAN_SOURCE_DEFAULTS.cutoff) {
    params.push(`cutoff=${cutoff}`);
  }
  
  return `mp.GaussianSource(${params.join(', ')})`;
}

/**
 * Generate source time string based on source sub-type
 */
function generateSourceTimeString(source: any): string {
  const sourceTimeType = source.sourceTimeType || source.src_time_type || source.srcTimeType || 'gaussian'; // Default to gaussian for eigenmode
  
  if (sourceTimeType.toLowerCase() === 'continuous' || sourceTimeType.toLowerCase() === 'cw') {
    return generateContinuousSourceString(source);
  } else {
    return generateGaussianSourceString(source);
  }
}

/**
 * Generate Python code for a single Meep source
 */
function generateSingleSourceCode(source: MeepSource): string[] {
  const lines: string[] = [];
  
  // Helper to format Vector3
  const formatVector3 = (v: { x: number; y: number; z: number }) => 
    `mp.Vector3(${v.x}, ${v.y}, ${v.z})`;
  
  // Helper to format values (handle infinity)
  const formatValue = (val: any) => {
    if (val === Infinity || val === 'mp.inf' || isInfinityTime(val)) return 'mp.inf';
    if (typeof val === 'string') return val;
    return val.toString();
  };
  
  // Helper to check if Vector3 is default (0,0,0)
  const isDefaultVector3 = (v: { x: number; y: number; z: number } | undefined) => {
    return !v || (v.x === 0 && v.y === 0 && v.z === 0);
  };
  
  // Helper to check if size is point source (0,0,0)
  const isPointSource = (size: { x: number; y: number; z: number } | undefined) => {
    return !size || (size.x === 0 && size.y === 0 && size.z === 0);
  };
  
  if ('eig_band' in source) {
    // EigenModeSource
    const eigSource = source as EigenModeSource;
    lines.push(`sources.append(mp.EigenModeSource(`);
    lines.push(`    src=${eigSource.src},`);
    
    // Only include center if not default
    if (!isDefaultVector3(eigSource.center)) {
      lines.push(`    center=${formatVector3(eigSource.center || BASE_SOURCE_DEFAULTS.center)},`);
    }
    
    // Size (only if not point source)
    if (!isPointSource(eigSource.size)) {
      lines.push(`    size=${formatVector3(eigSource.size!)},`);
    }
    
    // Eigenmode specific parameters - only if not default
    if (eigSource.eig_band !== EIGENMODE_SOURCE_DEFAULTS.eig_band) {
      lines.push(`    eig_band=${eigSource.eig_band},`);
    }
    
    if (eigSource.direction && eigSource.direction !== EIGENMODE_SOURCE_DEFAULTS.direction) {
      lines.push(`    direction=mp.${eigSource.direction},`);
    }
    
    if (eigSource.eig_match_freq !== EIGENMODE_SOURCE_DEFAULTS.eig_match_freq) {
      lines.push(`    eig_match_freq=${eigSource.eig_match_freq ? 'True' : 'False'},`);
    }
    
    if (eigSource.eig_kpoint && !isDefaultVector3(eigSource.eig_kpoint)) {
      lines.push(`    eig_kpoint=${formatVector3(eigSource.eig_kpoint)},`);
    }
    
    if (eigSource.eig_parity && eigSource.eig_parity !== EIGENMODE_SOURCE_DEFAULTS.eig_parity) {
      lines.push(`    eig_parity=mp.${eigSource.eig_parity},`);
    }
    
    if (eigSource.eig_resolution !== undefined) {
      lines.push(`    eig_resolution=${eigSource.eig_resolution},`);
    }
    
    if (eigSource.eig_tolerance !== EIGENMODE_SOURCE_DEFAULTS.eig_tolerance) {
      lines.push(`    eig_tolerance=${eigSource.eig_tolerance},`);
    }
    
    // Component (only if not ALL_COMPONENTS for eigenmode)
    if (eigSource.component && eigSource.component !== EIGENMODE_SOURCE_DEFAULTS.component) {
      lines.push(`    component=mp.${eigSource.component},`);
    }
    
    // Amplitude if not default (1.0)
    if (eigSource.amplitude !== undefined && eigSource.amplitude !== BASE_SOURCE_DEFAULTS.amplitude.real) {
      lines.push(`    amplitude=${formatValue(eigSource.amplitude)},`);
    }
    
    // Remove trailing comma from last line
    const lastLine = lines[lines.length - 1];
    lines[lines.length - 1] = lastLine.slice(0, -1);
    
    lines.push(`))`);
    
  } else {
    // Regular Source
    lines.push(`sources.append(mp.Source(`);
    lines.push(`    src=${source.src},`);
    lines.push(`    component=mp.${source.component},`);
    
    // Only include center if not default
    if (!isDefaultVector3(source.center)) {
      lines.push(`    center=${formatVector3(source.center || BASE_SOURCE_DEFAULTS.center)},`);
    }
    
    // Size (only if not point source)
    if (!isPointSource(source.size)) {
      lines.push(`    size=${formatVector3(source.size!)},`);
    }
    
    // Amplitude if not default (1.0)
    if (source.amplitude !== undefined && source.amplitude !== BASE_SOURCE_DEFAULTS.amplitude.real) {
      lines.push(`    amplitude=${formatValue(source.amplitude)},`);
    }
    
    // Remove trailing comma from last line
    const lastLine = lines[lines.length - 1];
    lines[lines.length - 1] = lastLine.slice(0, -1);
    
    lines.push(`))`);
  }
  
  return lines;
}

/**
 * Convert Meep source back to Konva representation
 */
export function convertMeepToKonvaSource(meepSource: MeepSource): any {
  const baseKonva = {
    id: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    x: meepSource.center?.x || 0,
    y: meepSource.center?.y || 0,
    center: meepSource.center,
    size: meepSource.size,
    component: meepSource.component,
    amplitude: meepSource.amplitude,
    label: meepSource.label
  };
  
  if ('eig_band' in meepSource) {
    // EigenModeSource
    return {
      ...baseKonva,
      type: 'source',
      sourceType: 'eigenmode',
      eig_band: meepSource.eig_band,
      direction: meepSource.direction,
      eig_match_freq: meepSource.eig_match_freq,
      eig_kpoint: meepSource.eig_kpoint,
      eig_parity: meepSource.eig_parity,
      eig_resolution: meepSource.eig_resolution,
      eig_tolerance: meepSource.eig_tolerance
    };
  } else {
    // Regular source - determine type from src string
    let sourceType = 'continuous';
    if (meepSource.src.includes('GaussianSource')) {
      sourceType = 'gaussian';
    }
    
    return {
      ...baseKonva,
      type: 'source',
      sourceType
    };
  }
}

/**
 * Validate source parameters
 */
export function validateSource(source: any): string[] {
  const errors: string[] = [];
  
  if (!source.component) {
    errors.push('Source component is required');
  }
  
  if (source.sourceType === 'continuous' || source.sourceType === 'cw') {
    if (!source.frequency && !source.fcen) {
      errors.push('Continuous source requires frequency');
    }
  }
  
  if (source.sourceType === 'gaussian' || source.sourceType === 'pulse') {
    if (!source.frequency && !source.fcen) {
      errors.push('Gaussian source requires frequency');
    }
    if (!source.width && !source.pulse_width) {
      errors.push('Gaussian source requires width');
    }
  }
  
  if (source.sourceType === 'eigenmode') {
    if (!source.frequency && !source.fcen) {
      errors.push('Eigenmode source requires frequency');
    }
  }
  
  return errors;
}