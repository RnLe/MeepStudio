import { Vector3 } from "./meepBaseTypes";

/* ---------- Meep Lattice Interface ---------- */
export interface MeepLattice {
  /** Basis vectors in real space */
  basis1: Vector3;
  basis2: Vector3;
  basis3?: Vector3; // Made optional for flexibility
  
  /** Size/scale factors for the basis vectors */
  basis_size: Vector3;
  
  /** Computed reciprocal basis vectors (k-space) */
  reciprocal_basis1?: Vector3;
  reciprocal_basis2?: Vector3;
  reciprocal_basis3?: Vector3;
  
  /** Transformation matrices between real and reciprocal space */
  transformationMatrices?: {
    MA: number[][];         // Real space basis matrix [a1, a2, a3] - 3x3
    MA_inv: number[][];     // Inverse of MA - 3x3
    MB: number[][];         // Reciprocal space basis matrix [b1, b2, b3] - 3x3
    MB_inv: number[][];     // Inverse of MB - 3x3
    realToReciprocal: number[][];  // 3x3 matrix
    reciprocalToReal: number[][];  // 3x3 matrix
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
  /** Cache key for optimization */
  cacheKey?: string;          // <─ added
}

/* ---------- Lattice Interface (standalone) ---------- */
export interface Lattice {
  /** Primary key, created with nanoid() */
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
    a: number;      // lattice constant a
    b: number;      // lattice constant b  
    c?: number;     // lattice constant c (for 3D), made optional
    alpha: number;  // angle between a and b (real space)
    beta?: number;   // angle between b1 and b2 (k-space), made optional
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

  /** Relationships */
  projectIds?: string[]; // Projects that use this lattice
}

/* ---------- Canvas Lattice Element Interface ---------- */
export interface CanvasLatticeElement {
  id: string;
  kind: "lattice";
  pos: { x: number; y: number };
  basis1: { x: number; y: number };
  basis2: { x: number; y: number };
  multiplier?: number;
  showMode?: "points" | "geometry";
  tiedGeometryId?: string;
  latticeDocumentId?: string;
  material?: string;
  orientation?: number;
  fillMode?: "manual" | "centerFill";
  calculatedPoints?: { x: number; y: number }[];
}
