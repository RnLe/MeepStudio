import { Vector3 } from "../types/meepProjectTypes";

/**
 * Calculate the 2D reciprocal basis vectors (b₁, b₂) for real vectors (a₁, a₂)
 * According to: b_i = 2π * ε_ij * a_j / (a₁ × a₂)
 * where ε_ij is the 2D Levi-Civita tensor and the denominator is the cell area
 */
export function reciprocalBasis(a1: Vector3, a2: Vector3): { b1: Vector3; b2: Vector3 } {
  // Calculate the cell area (2D cross product)
  const area = a1.x * a2.y - a1.y * a2.x;
  
  if (Math.abs(area) < 1e-14) {
    throw new Error("Basis vectors are collinear - cannot build reciprocal lattice.");
  }
  
  const factor = (2 * Math.PI) / area;
  
  // Apply the 2D Levi-Civita tensor
  const b1: Vector3 = {
    x: a2.y * factor,
    y: -a2.x * factor,
    z: 0
  };
  
  const b2: Vector3 = {
    x: -a1.y * factor,
    y: a1.x * factor,
    z: 0
  };
  
  return { b1, b2 };
}

/**
 * Create a 2x2 transformation matrix from basis vectors
 * Matrix columns are the basis vectors
 */
export function createTransformationMatrix(v1: Vector3, v2: Vector3): number[][] {
  return [
    [v1.x, v2.x],
    [v1.y, v2.y]
  ];
}

/**
 * Calculate the inverse of a 2x2 matrix
 */
export function invertMatrix2x2(matrix: number[][]): number[][] {
  const [[a, b], [c, d]] = matrix;
  const det = a * d - b * c;
  
  if (Math.abs(det) < 1e-14) {
    throw new Error("Matrix is singular - cannot invert.");
  }
  
  return [
    [d / det, -b / det],
    [-c / det, a / det]
  ];
}

/**
 * Transform a point using a 2x2 transformation matrix
 */
export function transformPoint(point: Vector3, matrix: number[][]): Vector3 {
  return {
    x: matrix[0][0] * point.x + matrix[0][1] * point.y,
    y: matrix[1][0] * point.x + matrix[1][1] * point.y,
    z: 0
  };
}

/**
 * Calculate both transformation matrices for a lattice
 * Returns matrices to transform between real space and k-space
 */
export function calculateTransformationMatrices(a1: Vector3, a2: Vector3): {
  realToReciprocal: number[][];
  reciprocalToReal: number[][];
} {
  // Calculate reciprocal basis
  const { b1, b2 } = reciprocalBasis(a1, a2);
  
  // Real space basis matrix (columns are a1, a2)
  const realMatrix = createTransformationMatrix(a1, a2);
  
  // Reciprocal space basis matrix (columns are b1, b2)
  const reciprocalMatrix = createTransformationMatrix(b1, b2);
  
  // To transform from real to reciprocal: use inverse of real matrix
  const realToReciprocal = invertMatrix2x2(realMatrix);
  
  // To transform from reciprocal to real: use inverse of reciprocal matrix
  const reciprocalToReal = invertMatrix2x2(reciprocalMatrix);
  
  return {
    realToReciprocal,
    reciprocalToReal
  };
}