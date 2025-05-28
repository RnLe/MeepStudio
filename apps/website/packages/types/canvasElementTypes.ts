import { Vector2d } from "konva/lib/types";

/** Discriminated union tag */
export type ElementType =
  | "cylinder"
  | "rectangle"
  | "triangle"
  | "continuousSource"
  | "gaussianSource"
  | "eigenModeSource"
  | "gaussianBeamSource"
  | "pmlBoundary";

// Geometry types
// Sphere, Cylinder, Wedge, Cone, Block, Ellipsoid, Prism

/** Common to *all* drawables */
interface BaseElement {
  /** stable id – never re-use, generated with nanoid() */
  id: string;
  type: ElementType;
  /** centre position in lattice units (a = 1) */
  pos: Vector2d;
  /** orientation in radians (0 to 2π, ccw positive) */
  orientation: number;
  /** true ⇢ highlighted in UI (selection logic lives in context) */
  selected?: boolean;
}

interface BaseGeometry extends BaseElement {
  material?: string;
}

/* ---------- geometry ---------- */
export interface Cylinder extends BaseGeometry {
  kind: "cylinder";
  radius: number;
}

export interface Rectangle extends BaseGeometry {
  kind: "rectangle";
  width: number;
  height: number;
}

export interface Triangle extends BaseGeometry {
  kind: "triangle";
  /** 3 vertices, each in lattice units (a = 1) */
  vertices: [Vector2d, Vector2d, Vector2d];
}

/* ---------- sources ---------- */
interface BaseSource extends BaseElement {
  /** Component direction (Ex, Ey, Ez, etc.) */
  component: string;
  /** Visual size for display (not the actual source size) */
  displaySize?: Vector2d;
  /** Amplitude (complex number stored as {real, imag}) */
  amplitude?: { real: number; imag: number };
}

export interface ContinuousSource extends BaseSource {
  kind: "continuousSource";
  /** Center frequency in units of c/distance */
  frequency: number;
  /** Start time */
  startTime?: number;
  /** End time */
  endTime?: number;
  /** Temporal width for smoothing */
  width?: number;
}

export interface GaussianSource extends BaseSource {
  kind: "gaussianSource";
  /** Center frequency in units of c/distance */
  frequency: number;
  /** Gaussian width parameter */
  width: number;
  /** Start time */
  startTime?: number;
  /** Cutoff parameter */
  cutoff?: number;
}

export interface EigenModeSource extends BaseSource {
  kind: "eigenModeSource";
  /** Band index */
  eigBand?: number;
  /** Direction (X, Y, Z, AUTOMATIC) */
  direction?: string;
  /** k-vector */
  eigKpoint?: { x: number; y: number; z: number };
  /** Mode parity */
  eigParity?: string;
}

export interface GaussianBeamSource extends BaseSource {
  kind: "gaussianBeamSource";
  /** Beam focus location relative to source */
  beamX0?: { x: number; y: number; z: number };
  /** Beam propagation direction */
  beamKdir?: { x: number; y: number; z: number };
  /** Beam waist radius */
  beamW0: number;
  /** Polarization vector */
  beamE0?: { x: number; y: number; z: number };
}

/* ---------- boundaries ---------- */
export interface PmlBoundary extends BaseElement {
  kind: "pmlBoundary";
  thickness: number;
}

export type CanvasElement =
  | Cylinder
  | Rectangle
  | Triangle
  | ContinuousSource
  | GaussianSource
  | EigenModeSource
  | GaussianBeamSource
  | PmlBoundary;
