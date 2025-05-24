// src/types/meepProjectTypes.ts
//
// Plain-file equivalent of the old Strapi DTO.
//
// A file stored on disk is literally JSON.stringify(MeepProject, null, 2)

export interface MeepStudioCustomData {
  lastExecution?: string;             // ISO timestamp
  lastExecutionConsoleLogs?: string[]; // stdout/stderr of last run
  pythonCode?: string;                // cached code snapshot
}

export interface MeepProject extends MeepStudioCustomData {
  /** Primary key = folder prefix, created with nanoid() */
  documentId: string;
  /** ISO strings for historical sorting */
  createdAt: string;
  updatedAt: string;

  /* Domain-specific fields */
  title: string;
  dimension: number;
  rectWidth: number;
  rectHeight: number;
  description?: string;

  /**
   * All geometry objects for this project (2D only for now).
   * Each geometry has at least: id, kind, and geometry-specific fields.
   */
  geometries: Array<{
    id: string;
    kind: string;
    // ...geometry-specific fields (e.g., for cylinder, rectangle, etc.)
    [key: string]: any;
  }>;

  /**
   * Resolution of the project (e.g. grid or simulation resolution).
   * Must be an integer. Default: 4
   */
  resolution: number;
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
