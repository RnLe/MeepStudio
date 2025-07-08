import { Vector3 } from "../types/meepBaseTypes";
import { RegionDirection } from "../types/meepRegionTypes";

// Base flux region defaults
export const FLUX_REGION_DEFAULTS = {
  center: { x: 0, y: 0, z: 0 } as Vector3,
  size: { x: 0, y: 0, z: 0 } as Vector3, // Single point by default
  direction: RegionDirection.AUTO, // Automatic direction detection
  directionSign: 1, // Positive direction
  weight: 1.0, // Default weight multiplier
} as const;

// Flux region type-specific defaults
export const FLUX_REGION_TYPE_DEFAULTS = {
  point: {
    ...FLUX_REGION_DEFAULTS,
    direction: RegionDirection.X, // Points default to X direction
    size: { x: 0, y: 0, z: 0 } as Vector3,
  },
  line: {
    ...FLUX_REGION_DEFAULTS,
    size: { x: 1, y: 0, z: 0 } as Vector3, // 1-unit line in X direction
  },
  area: {
    ...FLUX_REGION_DEFAULTS,
    size: { x: 1, y: 1, z: 0 } as Vector3, // 1x1 area in XY plane
  },
} as const;

// Helper function to get defaults for a specific region type
export function getRegionDefaults(regionType: 'point' | 'line' | 'area') {
  return FLUX_REGION_TYPE_DEFAULTS[regionType];
}

// Helper function to determine region type from size
export function getRegionTypeFromSize(size: Vector3): 'point' | 'line' | 'area' {
  const nonZeroDimensions = [size.x, size.y, size.z].filter(d => d > 0).length;
  
  switch (nonZeroDimensions) {
    case 0:
      return 'point';
    case 1:
      return 'line';
    case 2:
    default:
      return 'area';
  }
}

// Helper function to get direction options based on region type
export function getAvailableDirections(regionType: 'point' | 'line' | 'area'): RegionDirection[] {
  switch (regionType) {
    case 'point':
      // For points, direction must be specified explicitly (no auto)
      return [RegionDirection.X, RegionDirection.Y, RegionDirection.Z];
    case 'line':
      // For lines, AUTO calculates normal direction, but can be overridden
      return [RegionDirection.AUTO, RegionDirection.X, RegionDirection.Y, RegionDirection.Z];
    case 'area':
      // For areas, AUTO calculates normal direction, but can be overridden
      return [RegionDirection.AUTO, RegionDirection.X, RegionDirection.Y, RegionDirection.Z];
    default:
      return [RegionDirection.X, RegionDirection.Y, RegionDirection.Z];
  }
}

// Helper function to calculate normal direction for auto mode
export function calculateNormalDirection(size: Vector3, orientation: number = 0): RegionDirection {
  const sizeX = size.x || 0;
  const sizeY = size.y || 0;
  const sizeZ = size.z || 0;
  
  // Count non-zero dimensions to determine geometry type
  const nonZeroDimensions = [sizeX, sizeY, sizeZ].filter(d => d > 0).length;
  
  if (nonZeroDimensions === 0) {
    // Point - default to X direction
    return RegionDirection.X;
  } else if (nonZeroDimensions === 1) {
    // Line - calculate normal considering orientation
    // For a line, the normal is perpendicular to the line direction
    
    if (sizeX > 0 && sizeY === 0) {
      // Line along X direction (horizontal line)
      // Normal should be in Y direction, but consider rotation
      return getRotatedNormal(RegionDirection.Y, orientation);
    } else if (sizeY > 0 && sizeX === 0) {
      // Line along Y direction (vertical line)  
      // Normal should be in X direction, but consider rotation
      return getRotatedNormal(RegionDirection.X, orientation);
    } else {
      // Line along Z direction
      return RegionDirection.X; // Default normal
    }
    
  } else if (nonZeroDimensions === 2) {
    // Area - normal to the plane
    if (sizeZ === 0) {
      // Area in XY plane - normal is typically Z
      // For 2D, rotation doesn't typically change the Z normal unless it's extreme
      return RegionDirection.Z;
    } else if (sizeY === 0) {
      // Area in XZ plane
      return RegionDirection.Y;
    } else {
      // Area in YZ plane
      return RegionDirection.X;
    }
  }
  
  // Default fallback
  return RegionDirection.Z;
}

// Helper function to determine normal direction based on rotation
function getRotatedNormal(baseNormal: RegionDirection, orientation: number): RegionDirection {
  // Normalize orientation to 0-2π range
  const normalizedAngle = ((orientation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  
  // Determine which quadrant we're in (0°, 90°, 180°, 270°)
  const degrees = (normalizedAngle * 180) / Math.PI;
  
  // For lines, we mainly care about which axis the normal should point to
  // after rotation. Meep only uses positive directions (sign handled by weight)
  
  if (baseNormal === RegionDirection.Y) {
    // Original normal was Y, after rotation:
    if (degrees >= 315 || degrees < 45) {
      return RegionDirection.Y; // Still Y
    } else if (degrees >= 45 && degrees < 135) {
      return RegionDirection.X; // Rotated to X  
    } else if (degrees >= 135 && degrees < 225) {
      return RegionDirection.Y; // Back to Y (but flipped)
    } else {
      return RegionDirection.X; // Rotated to X (but flipped)
    }
  } else if (baseNormal === RegionDirection.X) {
    // Original normal was X, after rotation:
    if (degrees >= 315 || degrees < 45) {
      return RegionDirection.X; // Still X
    } else if (degrees >= 45 && degrees < 135) {
      return RegionDirection.Y; // Rotated to Y
    } else if (degrees >= 135 && degrees < 225) {
      return RegionDirection.X; // Back to X (but flipped)
    } else {
      return RegionDirection.Y; // Rotated to Y (but flipped)
    }
  }
  
  return baseNormal; // Fallback to original
}
