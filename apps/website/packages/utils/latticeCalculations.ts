import { Vector3 } from "../types/meepProjectTypes";

/**
 * Calculate the 3D reciprocal basis vectors for real vectors
 * For 2D lattices, we use basis3 = [0, 0, 1] and get the standard 2D reciprocal lattice
 */
export function reciprocalBasis(a1: Vector3, a2: Vector3, a3?: Vector3): { b1: Vector3; b2: Vector3; b3: Vector3 } {
  // Default basis3 for 2D case
  const basis3 = a3 || { x: 0, y: 0, z: 1 };
  
  // Calculate the volume (3D triple product)
  const volume = 
    a1.x * (a2.y * basis3.z - a2.z * basis3.y) -
    a1.y * (a2.x * basis3.z - a2.z * basis3.x) +
    a1.z * (a2.x * basis3.y - a2.y * basis3.x);
  
  if (Math.abs(volume) < 1e-14) {
    throw new Error("Basis vectors are coplanar - cannot build reciprocal lattice.");
  }
  
  const factor = (2 * Math.PI) / volume;
  
  // b1 = 2π * (a2 × a3) / volume
  const b1: Vector3 = {
    x: (a2.y * basis3.z - a2.z * basis3.y) * factor,
    y: (a2.z * basis3.x - a2.x * basis3.z) * factor,
    z: (a2.x * basis3.y - a2.y * basis3.x) * factor
  };
  
  // b2 = 2π * (a3 × a1) / volume
  const b2: Vector3 = {
    x: (basis3.y * a1.z - basis3.z * a1.y) * factor,
    y: (basis3.z * a1.x - basis3.x * a1.z) * factor,
    z: (basis3.x * a1.y - basis3.y * a1.x) * factor
  };
  
  // b3 = 2π * (a1 × a2) / volume
  const b3: Vector3 = {
    x: (a1.y * a2.z - a1.z * a2.y) * factor,
    y: (a1.z * a2.x - a1.x * a2.z) * factor,
    z: (a1.x * a2.y - a1.y * a2.x) * factor
  };
  
  return { b1, b2, b3 };
}

/**
 * Create a 3x3 transformation matrix from basis vectors
 * Matrix columns are the basis vectors
 */
export function createTransformationMatrix(v1: Vector3, v2: Vector3, v3?: Vector3): number[][] {
  const basis3 = v3 || { x: 0, y: 0, z: 1 };
  return [
    [v1.x, v2.x, basis3.x],
    [v1.y, v2.y, basis3.y],
    [v1.z, v2.z, basis3.z]
  ];
}

/**
 * Calculate the inverse of a 3x3 matrix
 */
export function invertMatrix3x3(matrix: number[][]): number[][] {
  const [[a11, a12, a13], [a21, a22, a23], [a31, a32, a33]] = matrix;
  
  // Calculate determinant
  const det = 
    a11 * (a22 * a33 - a23 * a32) -
    a12 * (a21 * a33 - a23 * a31) +
    a13 * (a21 * a32 - a22 * a31);
  
  if (Math.abs(det) < 1e-14) {
    throw new Error("Matrix is singular - cannot invert.");
  }
  
  // Calculate cofactor matrix and transpose
  return [
    [
      (a22 * a33 - a23 * a32) / det,
      (a13 * a32 - a12 * a33) / det,
      (a12 * a23 - a13 * a22) / det
    ],
    [
      (a23 * a31 - a21 * a33) / det,
      (a11 * a33 - a13 * a31) / det,
      (a13 * a21 - a11 * a23) / det
    ],
    [
      (a21 * a32 - a22 * a31) / det,
      (a12 * a31 - a11 * a32) / det,
      (a11 * a22 - a12 * a21) / det
    ]
  ];
}

/**
 * Transform a point using a 3x3 transformation matrix
 */
export function transformPoint(point: Vector3, matrix: number[][]): Vector3 {
  return {
    x: matrix[0][0] * point.x + matrix[0][1] * point.y + matrix[0][2] * point.z,
    y: matrix[1][0] * point.x + matrix[1][1] * point.y + matrix[1][2] * point.z,
    z: matrix[2][0] * point.x + matrix[2][1] * point.y + matrix[2][2] * point.z
  };
}

/**
 * Calculate both transformation matrices for a lattice
 * Returns matrices to transform between real space and k-space
 * Note: This is kept for compatibility but should use WASM module for consistency
 */
export function calculateTransformationMatrices(a1: Vector3, a2: Vector3, a3?: Vector3): {
  realToReciprocal: number[][];
  reciprocalToReal: number[][];
} {
  // Calculate reciprocal basis
  const { b1, b2, b3 } = reciprocalBasis(a1, a2, a3);
  
  // Real space basis matrix (columns are a1, a2, a3)
  const realMatrix = createTransformationMatrix(a1, a2, a3);
  
  // Reciprocal space basis matrix (columns are b1, b2, b3)
  const reciprocalMatrix = createTransformationMatrix(b1, b2, b3);
  
  // To transform from real to reciprocal: use inverse of real matrix
  const realToReciprocal = invertMatrix3x3(realMatrix);
  
  // To transform from reciprocal to real: use inverse of reciprocal matrix
  const reciprocalToReal = invertMatrix3x3(reciprocalMatrix);
  
  return {
    realToReciprocal,
    reciprocalToReal
  };
}