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
  | "pmlBoundary"
  | "lattice"
  | "group"
  | "fluxRegion"
  | "regionBox";

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
  /** Custom name for the element - displayed in UI if set */
  name?: string;
  /** true ⇢ highlighted in UI (selection logic lives in context) */
  selected?: boolean;
  /** 
   * When true, element is hidden from canvas and excluded from simulations/code generation.
   * Used when geometry is tied to a lattice - it becomes a template that's replicated
   * at each lattice point rather than existing as a standalone element.
   */
  invisible?: boolean;
  /** Visual opacity (0-1) for rendering */
  opacity?: number;
  /** Prevents modification when true */
  locked?: boolean;
  /** Calculated bounding box for efficient rendering/selection */
  boundingBox?: { x: number; y: number; width: number; height: number };
  /** ID of parent group element */
  parent?: string;
}

interface BaseGeometry extends BaseElement {
  material?: string;
}

/* ---------- group ---------- */
export interface Group extends BaseGeometry {
  type: "group";
  /** Child elements contained in this group */
  children: CanvasElement[];
  /** Whether the group is expanded in the UI (for tree views) */
  expanded?: boolean;
  /** Whether to apply transformations to children */
  transformChildren?: boolean;
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

/* ---------- regions ---------- */
interface BaseRegion extends BaseElement {
  /** Direction to compute flux (X, Y, Z, or AUTO) */
  direction: number;
  /** Direction sign (1 for positive, -1 for negative) */
  directionSign?: number;
  /** Weight factor to multiply flux when computed */
  weight?: number;
  /** Visual size for display (region size in lattice units) */
  size?: Vector2d;
}

export interface FluxRegion extends BaseRegion {
  kind: "fluxRegion";
  /** Region type for different flux calculations */
  regionType?: "flux" | "energy" | "force";
}

/* ---------- region box ---------- */
export interface RegionBox extends BaseElement {
  kind: "regionBox";
  type: "regionBox";
  /** Width and height of the region box */
  width: number;
  height: number;
  /** Settings for each edge of the box */
  edges: {
    top: RegionBoxEdge;
    right: RegionBoxEdge;
    bottom: RegionBoxEdge;
    left: RegionBoxEdge;
  };
  /** Overall region type for all edges */
  regionType?: "flux" | "energy" | "force";
}

interface RegionBoxEdge {
  /** Weight for this edge (sign determines direction) */
  weight: number;
  /** Whether this edge is enabled */
  enabled: boolean;
}

/* ---------- lattice ---------- */
export interface SceneLattice extends BaseElement {
  kind: "lattice";
  /** Base vectors defining the lattice */
  basis1: Vector2d;
  basis2: Vector2d;
  /** Multiplier for how many lattice points to show */
  multiplier: number;
  /** ID of geometry tied to this lattice (if any) */
  tiedGeometryId?: string;
  /** Whether to show lattice points or replicated geometry */
  showMode: 'points' | 'geometry';
  /** Fill mode: manual multiplier or center&fill */
  fillMode?: 'manual' | 'centerFill';
  /** Pre-calculated lattice points for centerFill mode */
  calculatedPoints?: Array<{ x: number; y: number }>;
  /** Link to a full lattice document */
  latticeDocumentId?: string;
}

export type CanvasElement =
  | Cylinder
  | Rectangle
  | Triangle
  | ContinuousSource
  | GaussianSource
  | EigenModeSource
  | GaussianBeamSource
  | PmlBoundary
  | SceneLattice
  | Group
  | FluxRegion
  | RegionBox;
