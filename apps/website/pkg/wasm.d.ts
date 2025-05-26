/* tslint:disable */
/* eslint-disable */
/**
 * Calculates lattice points within a viewport
 * b1x, b1y: first basis vector
 * b2x, b2y: second basis vector
 * viewport_width, viewport_height: size of the viewport in screen coordinates
 * scale: current zoom scale
 * offset_x, offset_y: pan offset
 */
export function calculate_lattice_points(b1x: number, b1y: number, b2x: number, b2y: number, viewport_width: number, viewport_height: number, scale: number, offset_x: number, offset_y: number): any;
/**
 * Calculate the minimum scale needed to show n lattice points
 * Returns the scale factor that would show approximately n points
 */
export function calculate_min_scale_for_points(b1x: number, b1y: number, b2x: number, b2y: number, viewport_width: number, viewport_height: number, target_points: number): number;
/**
 * Calculate all lattice points that fill a bounding box
 * The number of points is determined by fixing 100 points along the shorter axis
 */
export function calculate_all_lattice_points(b1x: number, b1y: number, b2x: number, b2y: number): any;
/**
 * Generate a centred square of lattice points:
 * – create a dense ±100×100 grid,
 * – find the distance at which `target_count` distinct x or y columns are reached,
 * – keep every point with |x|,|y| ≤ cutoff (square window).
 */
export function calculate_square_lattice_points(b1x: number, b1y: number, b2x: number, b2y: number, target_count: number): any;
/**
 * WASM-exported function to calculate Brillouin zones
 */
export function calculate_brillouin_zones(a1_x: number, a1_y: number, a2_x: number, a2_y: number, max_zone: number): BrillouinZonesResult;
/**
 * Adds two 32-bit integers.
 */
export function add(a: number, b: number): number;
/**
 * Advanced separation by computing polygon difference using line intersections.
 */
export function separate_brillouin_zones(raw: any): any;
/**
 * WASM-exported structure for returning zones
 */
export class BrillouinZonesResult {
  private constructor();
  free(): void;
  readonly zones: any;
}
