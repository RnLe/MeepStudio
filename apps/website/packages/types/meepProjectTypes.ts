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

/* ---------- Project Lattice Interface ---------- */
export interface ProjectLattice {
  /** Lattice type (e.g., 'square', 'triangular', 'hexagonal') */
  latticeType: string;
  /** Lattice parameters */
  parameters: Record<string, any>;
  /** Generated lattice data */
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
