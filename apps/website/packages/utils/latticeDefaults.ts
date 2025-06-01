import { LatticeType } from './latticeTypeChecker';
import { Vector3 } from '../types/meepBaseTypes';

// High symmetry point definitions as fractions of reciprocal lattice vectors
export interface HighSymmetryPoint {
  label: string;
  coordinates: { b1: number; b2: number }; // Fractions of b1 and b2
}

// Map of lattice types to their high symmetry points
export const LATTICE_SYMMETRY_POINTS: Record<LatticeType, HighSymmetryPoint[]> = {
  [LatticeType.OBLIQUE]: [
    { label: 'Γ', coordinates: { b1: 0, b2: 0 } }
  ],
  [LatticeType.RECTANGULAR]: [
    { label: 'Γ', coordinates: { b1: 0, b2: 0 } },
    { label: 'X', coordinates: { b1: 0.5, b2: 0 } },
    { label: 'M', coordinates: { b1: 0.5, b2: 0.5 } },
    { label: 'Y', coordinates: { b1: 0, b2: 0.5 } }
  ],
  [LatticeType.QUADRATIC]: [ // Square lattice
    { label: 'Γ', coordinates: { b1: 0, b2: 0 } },
    { label: 'X', coordinates: { b1: 0.5, b2: 0 } },
    { label: 'M', coordinates: { b1: 0.5, b2: 0.5 } }
  ],
  [LatticeType.TRIANGULAR]: [ // Hexagonal lattice
    { label: 'Γ', coordinates: { b1: 0, b2: 0 } },
    { label: 'M', coordinates: { b1: 0.5, b2: 0 } },
    { label: 'K', coordinates: { b1: 2/3, b2: 1/3 } } // Corrected K point
  ],
  [LatticeType.RHOMBIC]: [ // Use centered rectangular convention
    { label: 'Γ', coordinates: { b1: 0, b2: 0 } },
    { label: 'X', coordinates: { b1: 0.5, b2: 0 } },
    { label: 'M', coordinates: { b1: 0.5, b2: -0.5 } }, // Adjusted for rhombic
    { label: 'Y', coordinates: { b1: 0, b2: 0.5 } }
  ]
};

// High symmetry paths for band structure calculations
export interface HighSymmetryPath {
  from: string;
  to: string;
}

export const LATTICE_SYMMETRY_PATHS: Record<LatticeType, HighSymmetryPath[]> = {
  [LatticeType.OBLIQUE]: [],
  [LatticeType.RECTANGULAR]: [
    { from: 'Γ', to: 'X' },
    { from: 'X', to: 'M' },
    { from: 'M', to: 'Y' },
    { from: 'Y', to: 'Γ' }
  ],
  [LatticeType.QUADRATIC]: [
    { from: 'Γ', to: 'X' },
    { from: 'X', to: 'M' },
    { from: 'M', to: 'Γ' }
  ],
  [LatticeType.TRIANGULAR]: [
    { from: 'Γ', to: 'M' },
    { from: 'M', to: 'K' },
    { from: 'K', to: 'Γ' }
  ],
  [LatticeType.RHOMBIC]: [
    { from: 'Γ', to: 'X' },
    { from: 'X', to: 'M' },
    { from: 'M', to: 'Y' },
    { from: 'Y', to: 'Γ' }
  ]
};

// Helper function to calculate actual position from fractional coordinates
export function calculateHighSymmetryPosition(
  point: HighSymmetryPoint,
  b1: Vector3,
  b2: Vector3
): { x: number; y: number } {
  return {
    x: point.coordinates.b1 * b1.x + point.coordinates.b2 * b2.x,
    y: point.coordinates.b1 * b1.y + point.coordinates.b2 * b2.y
  };
}

// Helper to get symmetry points for a given lattice type
export function getSymmetryPointsForLattice(latticeType: LatticeType): HighSymmetryPoint[] {
  return LATTICE_SYMMETRY_POINTS[latticeType] || [];
}

// Helper to get symmetry paths for a given lattice type
export function getSymmetryPathsForLattice(latticeType: LatticeType): HighSymmetryPath[] {
  return LATTICE_SYMMETRY_PATHS[latticeType] || [];
}
