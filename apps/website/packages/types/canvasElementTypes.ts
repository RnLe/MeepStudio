import { Vector2d } from "konva/lib/types";

/** Discriminated union tag */
export type ElementType =
  | "cylinder"
  | "rectangle"
  | "triangle"
  | "continuousSource"
  | "gaussianSource"
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
export interface ContinuousSource extends BaseElement {
  kind: "continuousSource";
  wavelength: number;
  amplitude: number;
}

export interface GaussianSource extends BaseElement {
  kind: "gaussianSource";
  centreFreq: number;
  fwhm: number;
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
  | PmlBoundary;
