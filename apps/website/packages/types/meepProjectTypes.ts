import { Vector3 } from "./meepBaseTypes";

/* ---------- Unit Enum ---------- */
export enum LengthUnit {
  AM = "am",  // attometers
  FM = "fm",  // femtometers
  PM = "pm",  // picometers
  NM = "nm",  // nanometers
  UM = "μm",  // micrometers
  MM = "mm",  // millimeters
  CM = "cm",  // centimeters
  M = "m",    // meters
  KM = "km",  // kilometers
}

/* ---------- Base Geometry Interface ---------- */
export interface GeometryObject {
  id: string;
  kind: string;
  /** orientation in radians (0 to 2π, ccw positive) */
  orientation?: number; // Optional for backward compatibility during migration
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
  /** Characteristic length scale */
  a: number;
  /** Unit for the characteristic length */
  unit: LengthUnit;
  /** Material key for the scene background (default: Air) */
  material?: string;
  /**
   * All geometry objects for this scene (2D only for now).
   * Each geometry has at least: id, kind, and geometry-specific fields.
   */
  geometries: GeometryObject[];
  /**
   * All source objects for this scene.
   * Each source has at least: id, kind, and source-specific fields.
   */
  sources?: GeometryObject[]; // Using GeometryObject type for now, can be refined later
  /**
   * All boundary objects for this scene.
   * Each boundary has at least: id, kind, and boundary-specific fields.
   */
  boundaries?: any[]; // Add if missing
  /**
   * All lattice objects for this scene.
   * Each lattice has at least: id, kind, and lattice-specific fields.
   */
  lattices?: any[]; // Change from GeometryObject[] to any[] for now
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
  /** References to lattices by ID */
  latticeIds?: string[]; // Changed to array for many-to-many
  /** Inline lattice data (for backwards compatibility) */
  latticeData?: any;
}

/* ---------- Main Project Interface ---------- */
export interface MeepProject {
  /** Primary key, created with nanoid() */
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
