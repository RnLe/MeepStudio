import { Vector3 } from '../types/meepBaseTypes';

// Enum for 2D lattice types
export enum LatticeType {
  QUADRATIC = 'quadratic',     // a = b, angle = 90°
  RECTANGULAR = 'rectangular', // a ≠ b, angle = 90°
  RHOMBIC = 'rhombic',         // a = b, angle ≠ 90°
  TRIANGULAR = 'triangular',   // a = b, angle = 60° or 120°
  OBLIQUE = 'oblique'          // a ≠ b, angle ≠ 90°
}

// Type for lattice validation result
export interface LatticeValidationResult {
  isValid: boolean;
  violations: string[];
  actualValues: {
    lengthA: number;
    lengthB: number;
    angle: number; // in degrees
    lengthRatio: number; // b/a
  };
}

// Type for lattice detection result
export interface LatticeDetectionResult {
  type: LatticeType;
  confidence: number; // 0-1, how well it matches the detected type
  parameters: {
    lengthA: number;
    lengthB: number;
    angle: number; // in degrees
  };
}

// Constants for tolerance in comparisons
export const TOLERANCE = {
  LENGTH: 1e-6,      // Relative tolerance for length comparisons
  ANGLE: 0.1,        // Angle tolerance in degrees
  TRIANGULAR: 0.5    // Special tolerance for triangular lattice angles
} as const;

// Helper function to get 2D magnitude (ignoring z)
function getMagnitude2D(vector: Vector3): number {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

// Helper function to get 2D dot product (ignoring z)
function dotProduct2D(v1: Vector3, v2: Vector3): number {
  return v1.x * v2.x + v1.y * v2.y;
}

// Helper function to calculate angle between two 2D vectors in degrees
function getAngle2D(v1: Vector3, v2: Vector3): number {
  const mag1 = getMagnitude2D(v1);
  const mag2 = getMagnitude2D(v2);
  
  if (mag1 === 0 || mag2 === 0) {
    throw new Error('Cannot calculate angle with zero-length vector');
  }
  
  const cosAngle = dotProduct2D(v1, v2) / (mag1 * mag2);
  // Clamp to [-1, 1] to handle numerical errors
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  const angleRad = Math.acos(clampedCos);
  return angleRad * 180 / Math.PI;
}

// Helper function to check if two values are approximately equal
function approxEqual(a: number, b: number, tolerance: number = TOLERANCE.LENGTH): boolean {
  const avg = (Math.abs(a) + Math.abs(b)) / 2;
  if (avg === 0) return Math.abs(a - b) < tolerance;
  return Math.abs(a - b) / avg < tolerance;
}

// Main function to detect lattice type from two base vectors
export function detectLatticeType(v1: Vector3, v2: Vector3): LatticeDetectionResult {
  const lengthA = getMagnitude2D(v1);
  const lengthB = getMagnitude2D(v2);
  const angle = getAngle2D(v1, v2);
  
  // Check for degenerate cases
  if (lengthA === 0 || lengthB === 0) {
    throw new Error('Base vectors must have non-zero length');
  }
  
  const equalLengths = approxEqual(lengthA, lengthB);
  const angle90 = approxEqual(angle, 90, TOLERANCE.ANGLE);
  const angle60 = approxEqual(angle, 60, TOLERANCE.TRIANGULAR);
  const angle120 = approxEqual(angle, 120, TOLERANCE.TRIANGULAR);
  
  let type: LatticeType;
  let confidence = 1.0;
  
  // Determine lattice type based on conditions
  if (equalLengths && angle90) {
    type = LatticeType.QUADRATIC;
  } else if (!equalLengths && angle90) {
    type = LatticeType.RECTANGULAR;
  } else if (equalLengths && (angle60 || angle120)) {
    type = LatticeType.TRIANGULAR;
  } else if (equalLengths && !angle90) {
    type = LatticeType.RHOMBIC;
  } else {
    type = LatticeType.OBLIQUE;
  }
  
  // Calculate confidence based on how well it matches the ideal conditions
  if (type === LatticeType.QUADRATIC) {
    const lengthError = Math.abs(lengthA - lengthB) / Math.max(lengthA, lengthB);
    const angleError = Math.abs(angle - 90) / 90;
    confidence = Math.max(0, 1 - lengthError - angleError);
  } else if (type === LatticeType.TRIANGULAR) {
    const lengthError = Math.abs(lengthA - lengthB) / Math.max(lengthA, lengthB);
    const angleError = Math.min(Math.abs(angle - 60), Math.abs(angle - 120)) / 60;
    confidence = Math.max(0, 1 - lengthError - angleError);
  }
  
  return {
    type,
    confidence,
    parameters: {
      lengthA,
      lengthB,
      angle
    }
  };
}

// Function to validate if vectors conform to a specific lattice type
export function validateLatticeType(
  v1: Vector3, 
  v2: Vector3, 
  expectedType: LatticeType
): LatticeValidationResult {
  const lengthA = getMagnitude2D(v1);
  const lengthB = getMagnitude2D(v2);
  const angle = getAngle2D(v1, v2);
  const lengthRatio = lengthB / lengthA;
  
  const violations: string[] = [];
  let isValid = true;
  
  switch (expectedType) {
    case LatticeType.QUADRATIC:
      if (!approxEqual(lengthA, lengthB)) {
        isValid = false;
        violations.push(`Lengths must be equal (a=${lengthA.toFixed(6)}, b=${lengthB.toFixed(6)})`);
      }
      if (!approxEqual(angle, 90, TOLERANCE.ANGLE)) {
        isValid = false;
        violations.push(`Angle must be 90° (actual: ${angle.toFixed(2)}°)`);
      }
      break;
      
    case LatticeType.RECTANGULAR:
      if (approxEqual(lengthA, lengthB)) {
        isValid = false;
        violations.push(`Lengths must be different (a=${lengthA.toFixed(6)}, b=${lengthB.toFixed(6)})`);
      }
      if (!approxEqual(angle, 90, TOLERANCE.ANGLE)) {
        isValid = false;
        violations.push(`Angle must be 90° (actual: ${angle.toFixed(2)}°)`);
      }
      break;
      
    case LatticeType.TRIANGULAR:
      if (!approxEqual(lengthA, lengthB)) {
        isValid = false;
        violations.push(`Lengths must be equal (a=${lengthA.toFixed(6)}, b=${lengthB.toFixed(6)})`);
      }
      if (!approxEqual(angle, 60, TOLERANCE.TRIANGULAR) && 
          !approxEqual(angle, 120, TOLERANCE.TRIANGULAR)) {
        isValid = false;
        violations.push(`Angle must be 60° or 120° (actual: ${angle.toFixed(2)}°)`);
      }
      break;
      
    case LatticeType.RHOMBIC:
      if (!approxEqual(lengthA, lengthB)) {
        isValid = false;
        violations.push(`Lengths must be equal (a=${lengthA.toFixed(6)}, b=${lengthB.toFixed(6)})`);
      }
      if (approxEqual(angle, 90, TOLERANCE.ANGLE)) {
        isValid = false;
        violations.push(`Angle must not be 90° (actual: ${angle.toFixed(2)}°)`);
      }
      break;
      
    case LatticeType.OBLIQUE:
      if (approxEqual(lengthA, lengthB)) {
        isValid = false;
        violations.push(`Lengths must be different (a=${lengthA.toFixed(6)}, b=${lengthB.toFixed(6)})`);
      }
      if (approxEqual(angle, 90, TOLERANCE.ANGLE)) {
        isValid = false;
        violations.push(`Angle must not be 90° (actual: ${angle.toFixed(2)}°)`);
      }
      break;
  }
  
  return {
    isValid,
    violations,
    actualValues: {
      lengthA,
      lengthB,
      angle,
      lengthRatio
    }
  };
}

// Utility function to get human-readable description of a lattice type
export function getLatticeDescription(type: LatticeType): string {
  const descriptions: Record<LatticeType, string> = {
    [LatticeType.QUADRATIC]: 'Square lattice with equal sides and 90° angles',
    [LatticeType.RECTANGULAR]: 'Rectangular lattice with unequal sides and 90° angles',
    [LatticeType.TRIANGULAR]: 'Triangular/hexagonal lattice with equal sides and 60° or 120° angles',
    [LatticeType.RHOMBIC]: 'Rhombic lattice with equal sides and non-90° angles',
    [LatticeType.OBLIQUE]: 'General oblique lattice with unequal sides and non-90° angles'
  };
  
  return descriptions[type];
}

// Utility function to suggest corrections for invalid lattice
export function suggestCorrections(
  v1: Vector3, 
  v2: Vector3, 
  targetType: LatticeType
): { v1: Vector3; v2: Vector3 } {
  const lengthA = getMagnitude2D(v1);
  const lengthB = getMagnitude2D(v2);
  
  // Create normalized 2D vectors
  const norm1 = { x: v1.x / lengthA, y: v1.y / lengthA, z: 0 };
  let correctedV1 = { ...v1 };
  let correctedV2 = { ...v2 };
  
  switch (targetType) {
    case LatticeType.QUADRATIC:
      // Make v2 perpendicular to v1 with same length
      correctedV2 = {
        x: -v1.y,
        y: v1.x,
        z: v2.z
      };
      break;
      
    case LatticeType.RECTANGULAR:
      // Keep lengths but make perpendicular
      const scale = lengthB / lengthA;
      correctedV2 = {
        x: -v1.y * scale,
        y: v1.x * scale,
        z: v2.z
      };
      break;
      
    case LatticeType.TRIANGULAR:
      // Make 60° angle with equal lengths
      const cos60 = 0.5;
      const sin60 = Math.sqrt(3) / 2;
      correctedV2 = {
        x: v1.x * cos60 - v1.y * sin60,
        y: v1.x * sin60 + v1.y * cos60,
        z: v2.z
      };
      break;
      
    case LatticeType.RHOMBIC:
      // Keep equal lengths but ensure non-90° angle
      const currentAngle = getAngle2D(v1, v2);
      if (approxEqual(currentAngle, 90, TOLERANCE.ANGLE)) {
        // Rotate v2 by 30° if it's currently 90°
        const cos30 = Math.sqrt(3) / 2;
        const sin30 = 0.5;
        correctedV2 = {
          x: v2.x * cos30 - v2.y * sin30,
          y: v2.x * sin30 + v2.y * cos30,
          z: v2.z
        };
        // Scale to match v1 length
        const newLength = getMagnitude2D(correctedV2);
        const scaleFactor = lengthA / newLength;
        correctedV2.x *= scaleFactor;
        correctedV2.y *= scaleFactor;
      }
      break;
      
    case LatticeType.OBLIQUE:
      // Already oblique if called, just return original
      break;
  }
  
  return { v1: correctedV1, v2: correctedV2 };
}
