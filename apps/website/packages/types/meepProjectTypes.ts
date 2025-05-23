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
  description?: string;
}

/* ---------- (De)serialisers are now trivial ---------- */

export function serializeMeepProject(p: MeepProject): string {
  return JSON.stringify(p, null, 2);           // pretty-print for humans
}

export function deserializeMeepProject(raw: string): MeepProject {
  return JSON.parse(raw) as MeepProject;
}
