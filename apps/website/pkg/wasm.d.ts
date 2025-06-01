/* tslint:disable */
/* eslint-disable */
/**
 * WASM-exported function to calculate Brillouin zones
 */
export function calculate_brillouin_zones(a1_x: number, a1_y: number, a2_x: number, a2_y: number, max_zone: number): BrillouinZonesResult;
/**
 * WASM-exported function to calculate Wigner-Seitz zones (real space)
 */
export function calculate_wigner_seitz_zones(a1_x: number, a1_y: number, a2_x: number, a2_y: number, max_zone: number): BrillouinZonesResult;
/**
 * Calculate the minimum scale needed to show n lattice points
 * Returns the scale factor that would show approximately n points
 */
export function calculate_min_scale_for_points(b1x: number, b1y: number, b2x: number, b2y: number, viewport_width: number, viewport_height: number, target_points: number): number;
/**
 * Generate a centred square of lattice points:
 * – create a dense grid,
 * – find the distance at which `target_count` distinct x or y columns are reached,
 * – keep every point with |x|,|y| ≤ cutoff (square window).
 */
export function calculate_square_lattice_points(b1x: number, b1y: number, b2x: number, b2y: number, target_count: number, multiplier?: number | null): any;
/**
 * Adds two 32-bit integers.
 */
export function add(a: number, b: number): number;
/**
 * Advanced separation by computing polygon difference using line intersections.
 */
export function separate_brillouin_zones(raw: any): any;
/**
 * Calculate the inverse of a 2x2 matrix
 */
export function invert_matrix_2x2(a11: number, a12: number, a21: number, a22: number): any;
/**
 * Calculate the inverse of a 3x3 matrix
 */
export function invert_matrix_3x3(a11: number, a12: number, a13: number, a21: number, a22: number, a23: number, a31: number, a32: number, a33: number): any;
/**
 * Multiply two 2x2 matrices
 */
export function multiply_matrix_2x2(a11: number, a12: number, a21: number, a22: number, b11: number, b12: number, b21: number, b22: number): any;
/**
 * Multiply two 3x3 matrices
 */
export function multiply_matrix_3x3(a11: number, a12: number, a13: number, a21: number, a22: number, a23: number, a31: number, a32: number, a33: number, b11: number, b12: number, b13: number, b21: number, b22: number, b23: number, b31: number, b32: number, b33: number): any;
/**
 * Calculate transformation matrices for a 2D lattice
 */
export function calculate_lattice_transformations(a1x: number, a1y: number, a2x: number, a2y: number, b1x: number, b1y: number, b2x: number, b2y: number): any;
/**
 * WASM-exported structure for returning zones
 */
export class BrillouinZonesResult {
  private constructor();
  free(): void;
  readonly zones: any;
}
