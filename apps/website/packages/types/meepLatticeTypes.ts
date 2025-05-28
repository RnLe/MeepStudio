import { Vector3 } from "./meepBaseTypes";

/* ---------- Meep Lattice Interface ---------- */
export interface MeepLattice {
  /** Basis vectors in real space */
  basis1: Vector3;
  basis2: Vector3;
  basis3: Vector3;  // Make basis3 required
  
  /** Size/scale factors for the basis vectors */
  basis_size: Vector3;
  
  /** Computed reciprocal basis vectors (k-space) */
  reciprocal_basis1?: Vector3;
  reciprocal_basis2?: Vector3;
  reciprocal_basis3?: Vector3;  // Add reciprocal_basis3
  
  /** Transformation matrices between real and reciprocal space */
  transformationMatrices?: {
    realToReciprocal: number[][];  // 3x3 matrix
    reciprocalToReal: number[][];  // 3x3 matrix
    MA: number[][];         // Real space basis matrix [a1, a2, a3] - 3x3
    MA_inv: number[][];     // Inverse of MA - 3x3
    MB: number[][];         // Reciprocal space basis matrix [b1, b2, b3] - 3x3
    MB_inv: number[][];     // Inverse of MB - 3x3
  };
}

/* ---------- Voronoi Cell Interface ---------- */
export interface VoronoiCell {
  vertices: Vector3[];
  zone: number;
}

export interface VoronoiData {
  /** Wigner-Seitz cell (1st Brillouin zone in real space) */
  wignerSeitzCell?: VoronoiCell;
  /** Additional real space zones (for multiple Wigner-Seitz cells) */
  realSpaceZones?: VoronoiCell[];
  /** Brillouin zones (in reciprocal space) */
  brillouinZones?: VoronoiCell[];
  /** Calculation parameters used */
  calculationParams?: {
    maxZone: number;
    searchRange: number;
    timestamp: string;
  };
}

/* ---------- Lattice Interface (standalone) ---------- */
export interface Lattice {
  /** Primary key = unique identifier */
  documentId: string;
  /** ISO strings for historical sorting */
  createdAt: string;
  updatedAt: string;
  
  /** Metadata */
  title: string;
  description?: string;
  
  /** Lattice type */
  latticeType: 'square' | 'rectangular' | 'hexagonal' | 'rhombic' | 'oblique' | 'custom';
  
  /** Core lattice definition */
  meepLattice: MeepLattice;
  
  /** Lattice parameters for easier UI manipulation */
  parameters: {
    a?: number;      // lattice constant a
    b?: number;      // lattice constant b  
    c?: number;      // lattice constant c (for 3D)
    alpha?: number;  // angle between a and b (real space)
    beta?: number;   // angle between b1 and b2 (k-space)
    gamma?: number;  // reserved for future 3D use
  };
  
  /** Display settings */
  displaySettings?: {
    showWignerSeitz: boolean;
    showBrillouinZone: boolean;
    showHighSymmetryPoints: boolean;
    showReciprocal: boolean;
  };
  
  /** Generated lattice data */
  latticeData?: any;
  
  /** Voronoi cell data (Wigner-Seitz and Brillouin zones) */
  voronoiData?: VoronoiData;
}
