// src/types/meepProjectTypes.ts
//
// Plain-file equivalent of the old Strapi DTO.
//
// A file stored on disk is literally JSON.stringify(MeepProject, null, 2)

/* ---------- Base Geometry Interface ---------- */
export interface GeometryObject {
  id: string;
  kind: string;
  // ...geometry-specific fields (e.g., for cylinder, rectangle, etc.)
  [key: string]: any;
}

/* ---------- Project Scene Interface ---------- */
export interface ProjectScene {
  /** Scene dimension (2D/3D) */
  dimension: number;
  /** Scene width */
  rectWidth: number;
  /** Scene height */
  rectHeight: number;
  /** Resolution of the scene/simulation grid. Must be an integer. Default: 4 */
  resolution: number;
  /**
   * All geometry objects for this scene (2D only for now).
   * Each geometry has at least: id, kind, and geometry-specific fields.
   */
  geometries: GeometryObject[];
}

/* ---------- Project Code Interface ---------- */
export interface ProjectCode {
  /** Python code content */
  pythonCode: string;
  /** Last execution timestamp (ISO string) */
  lastExecution?: string;
  /** Console logs from last execution */
  lastExecutionConsoleLogs?: string[];
  /** Additional code files or snippets */
  additionalFiles?: Record<string, string>;
}

/* ---------- Meep Lattice Interface ---------- */
export interface Vector3 {
  x: number;
  y: number;
  z?: number;
}

export interface MeepLattice {
  /** Basis vectors in real space */
  basis1: Vector3;
  basis2: Vector3;
  basis3?: Vector3;
  
  /** Size/scale factors for the basis vectors */
  basis_size: Vector3;
  
  /** Computed reciprocal basis vectors (k-space) */
  reciprocal_basis1?: Vector3;
  reciprocal_basis2?: Vector3;
  reciprocal_basis3?: Vector3;
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
    alpha?: number;  // angle between b and c
    beta?: number;   // angle between a and c
    gamma?: number;  // angle between a and b
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
}

/* ---------- Project Lattice Interface ---------- */
export interface ProjectLattice {
  /** Reference to a lattice by ID */
  latticeId?: string;
  /** Inline lattice data (for backwards compatibility) */
  latticeData?: any;
}

/* ---------- Main Project Interface ---------- */
export interface MeepProject {
  /** Primary key = folder prefix, created with nanoid() */
  documentId: string;
  /** ISO strings for historical sorting */
  createdAt: string;
  updatedAt: string;

  /* Metadata */
  title: string;
  description?: string;

  /* Sub-components */
  scene: ProjectScene;
  code?: ProjectCode;
  lattice?: ProjectLattice;
}

/* ---------- (De)serialisers are now trivial ---------- */

export function serializeMeepProject(p: MeepProject): string {
  return JSON.stringify(p, null, 2);           // pretty-print for humans
}

export function deserializeMeepProject(raw: string): MeepProject {
  return JSON.parse(raw) as MeepProject;
}

// When serializing/deserializing, geometries are now included as part of the MeepProject object.
// No changes needed here since JSON.stringify/parse will handle the new field.
