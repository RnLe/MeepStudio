import { ConversionContext, generateSectionSeparator } from './codeAssemblyConversion2D';
import { CodeBlock } from '../providers/CodeAssemblyStore';
import { FluxRegion } from '../types/canvasElementTypes';
import { RegionDirection } from '../types/meepRegionTypes';

export interface RegionsResult {
  success: boolean;
  error?: string;
}

/**
 * Convert canvas region to Meep flux/force/energy region parameters
 */
function convertRegionToMeepParams(region: FluxRegion): string {
  const center = `mp.Vector3(${region.pos.x}, ${region.pos.y}, 0)`;
  const size = `mp.Vector3(${region.size?.x || 0}, ${region.size?.y || 0}, 0)`;
  const weight = region.weight || 1.0;
  
  // Calculate the actual direction (handle AUTO mode)
  let actualDirection = region.direction ?? RegionDirection.AUTO;
  const directionSign = region.directionSign ?? 1;
  
  // Handle AUTO direction calculation (stubbed for now)
  if (actualDirection === RegionDirection.AUTO) {
    // Auto is stubbed out - just use X direction
    actualDirection = RegionDirection.X;
  }
  
  // Convert direction enum to Meep direction (canvas coordinates)
  let direction = '';
  switch (actualDirection) {
    case RegionDirection.X:
      direction = 'mp.X';
      break;
    case RegionDirection.Y:
      direction = 'mp.Y';
      break;
    case RegionDirection.Z:
      direction = 'mp.Z';
      break;
    default:
      direction = 'mp.AUTOMATIC';
      break;
  }
  
  // Apply direction sign to weight (Meep convention)
  const finalWeight = weight * directionSign;
  
  return `    center=${center},
    size=${size},
    direction=${direction},
    weight=${finalWeight}`;
}

/**
 * Generate regions code block from canvas state
 */
export async function generateRegionsCode(context: ConversionContext): Promise<RegionsResult> {
  try {
    const { canvasState, codeState } = context;
    const regions = canvasState.regions || [];
    
    const lines: string[] = [
      generateSectionSeparator('REGIONS'),
      '',
      '# Define flux regions and field output regions',
      ''
    ];
    
    if (regions.length === 0) {
      lines.push(
        '# No regions defined yet',
        '# Regions are used for:',
        '# - Flux calculations (Poynting vector)',
        '# - Energy density measurements',
        '# - Force calculations',
        '',
        'flux_regions = []',
        'dft_fields = []',
        ''
      );
    } else {
      // Group regions by type
      const fluxRegions = regions.filter(r => (r.regionType || 'flux') === 'flux');
      const energyRegions = regions.filter(r => r.regionType === 'energy');
      const forceRegions = regions.filter(r => r.regionType === 'force');        // Generate flux regions
        if (fluxRegions.length > 0) {
          lines.push('# Flux regions for Poynting vector calculations');
          lines.push('# Direction arrows in the GUI show the actual measurement direction');
          lines.push('# AUTO direction is currently stubbed to X direction');
          lines.push('# Note: Meep only uses positive directions (mp.X, mp.Y, mp.Z)');
          lines.push('# Direction sign is handled by the weight parameter (negative weight = negative direction)');
          fluxRegions.forEach((region, index) => {
            const params = convertRegionToMeepParams(region);
            const actualDir = region.direction === RegionDirection.AUTO ? 
              RegionDirection.X : // Auto stubbed to X
              region.direction;
            const dirName = actualDir === RegionDirection.X ? 'X' : 
                           actualDir === RegionDirection.Y ? 'Y' : 'Z';
            const sign = region.directionSign ?? 1;
            lines.push(
              `# Region ${index + 1}: ${dirName} direction, ${sign > 0 ? 'positive' : 'negative'} flux`,
              `flux_region_${index + 1} = mp.FluxRegion(`,
              params,
              ')',
              ''
            );
          });
          
          const regionList = fluxRegions.map((_, i) => `flux_region_${i + 1}`).join(', ');
          lines.push(`flux_regions = [${regionList}]`, '');
        } else {
          lines.push('flux_regions = []', '');
        }
      
      // Generate energy regions
      if (energyRegions.length > 0) {
        lines.push('# Energy regions for energy density calculations');
        energyRegions.forEach((region, index) => {
          const params = convertRegionToMeepParams(region);
          lines.push(
            `energy_region_${index + 1} = mp.FluxRegion(  # Energy regions use FluxRegion`,
            params,
            ')',
            ''
          );
        });
        
        const regionList = energyRegions.map((_, i) => `energy_region_${i + 1}`).join(', ');
        lines.push(`energy_regions = [${regionList}]`, '');
      } else {
        lines.push('energy_regions = []', '');
      }
      
      // Generate force regions
      if (forceRegions.length > 0) {
        lines.push('# Force regions for Maxwell stress tensor calculations');
        forceRegions.forEach((region, index) => {
          const params = convertRegionToMeepParams(region);
          lines.push(
            `force_region_${index + 1} = mp.ForceRegion(`,
            params,
            ')',
            ''
          );
        });
        
        const regionList = forceRegions.map((_, i) => `force_region_${i + 1}`).join(', ');
        lines.push(`force_regions = [${regionList}]`, '');
      } else {
        lines.push('force_regions = []', '');
      }
      
      // Add DFT field monitoring
      lines.push(
        '# DFT field monitoring for frequency-domain analysis',
        'dft_fields = []',
        ''
      );
    }
    
    // Create code block
    const codeBlock: CodeBlock = {
      key: 'regions',
      label: 'Regions',
      content: lines.join('\n'),
      imports: [],
      dependencies: ['initialization', 'materials', 'geometries']
    };
    
    // Store in code state
    codeState.setCodeBlock('regions', codeBlock);
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate regions code'
    };
  }
}

/**
 * Parse regions code and convert to canvas regions (for import)
 */
export function parseRegionsCode(code: string): any[] {
  // TODO: Implement parsing logic
  // This would parse Python code and extract region definitions
  
  const regions: any[] = [];
  
  // Placeholder implementation
  // Would need proper Python parsing to extract region definitions
  
  return regions;
}

/**
 * Validate region parameters
 */
export function validateRegions(regions: FluxRegion[]): string[] {
  const errors: string[] = [];
  
  regions.forEach((region, index) => {
    const regionName = `Region ${index + 1} (${region.regionType || 'flux'})`;
    
    // Check for valid position
    if (!region.pos) {
      errors.push(`${regionName}: Missing position`);
    }
    
    // Check for valid size (regions should have some dimension)
    if (!region.size || (region.size.x === 0 && region.size.y === 0)) {
      // Allow point regions for specific use cases, but warn about limitations
      if (region.regionType === 'flux') {
        // Point flux regions can be useful for specific flux measurements
      } else if (region.regionType === 'energy') {
        errors.push(`${regionName}: Energy regions should have non-zero size for meaningful measurements`);
      } else {
        errors.push(`${regionName}: Force regions should have non-zero size`);
      }
    }
    
    // Validate weight parameter
    if (region.weight !== undefined) {
      if (region.weight === 0) {
        errors.push(`${regionName}: Weight should not be zero (region will have no effect)`);
      }
      if (Math.abs(region.weight) > 1000) {
        errors.push(`${regionName}: Weight value ${region.weight} seems unusually large`);
      }
    }
    
    // Check direction for force regions (they need explicit direction)
    if (region.regionType === 'force') {
      const actualDirection = region.direction === RegionDirection.AUTO ? 
        RegionDirection.X : // Auto stubbed to X
        region.direction;
      
      if (actualDirection === RegionDirection.AUTO) {
        errors.push(`${regionName}: Force regions require explicit direction (X, Y, or Z), not AUTO`);
      }
    }
    
    // Validate direction sign
    if (region.directionSign !== undefined && Math.abs(region.directionSign) !== 1) {
      errors.push(`${regionName}: Direction sign must be +1 or -1, got ${region.directionSign}`);
    }
    
    // Check for reasonable size values
    if (region.size) {
      if (region.size.x < 0 || region.size.y < 0) {
        errors.push(`${regionName}: Region size cannot be negative`);
      }
      if (region.size.x > 1000 || region.size.y > 1000) {
        errors.push(`${regionName}: Region size seems unusually large (${region.size.x} × ${region.size.y})`);
      }
    }
    
    // Validate region type
    const validTypes = ['flux', 'energy', 'force'];
    if (region.regionType && !validTypes.includes(region.regionType)) {
      errors.push(`${regionName}: Invalid region type '${region.regionType}'. Must be one of: ${validTypes.join(', ')}`);
    }
  });
  
  // Check for overlapping regions of same type (might cause issues)
  const typeGroups = new Map<string, FluxRegion[]>();
  regions.forEach(region => {
    const type = region.regionType || 'flux';
    if (!typeGroups.has(type)) {
      typeGroups.set(type, []);
    }
    typeGroups.get(type)!.push(region);
  });
  
  typeGroups.forEach((regionGroup, type) => {
    if (regionGroup.length > 1) {
      // Check for potential overlaps (simplified check)
      for (let i = 0; i < regionGroup.length; i++) {
        for (let j = i + 1; j < regionGroup.length; j++) {
          const r1 = regionGroup[i];
          const r2 = regionGroup[j];
          if (r1.pos && r2.pos && r1.size && r2.size) {
            const dist = Math.sqrt(
              Math.pow(r1.pos.x - r2.pos.x, 2) + 
              Math.pow(r1.pos.y - r2.pos.y, 2)
            );
            const minSeparation = Math.min(r1.size.x + r2.size.x, r1.size.y + r2.size.y) / 2;
            if (dist < minSeparation) {
              errors.push(`Warning: ${type} regions ${i + 1} and ${j + 1} may be overlapping`);
            }
          }
        }
      }
    }
  });
  
  return errors;
}
