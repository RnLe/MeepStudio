use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct LatticePoint {
    pub x: f64,
    pub y: f64,
    pub i: i32,
    pub j: i32,
    pub distance: f64,
}

#[derive(Serialize, Deserialize)]
pub struct LatticePointsResult {
    pub points: Vec<LatticePoint>,
    pub max_distance: f64,
}

/// Calculate the minimum scale needed to show n lattice points
/// Returns the scale factor that would show approximately n points
#[wasm_bindgen]
pub fn calculate_min_scale_for_points(
    b1x: f64,
    b1y: f64,
    b2x: f64,
    b2y: f64,
    viewport_width: f64,
    viewport_height: f64,
    target_points: i32,
) -> f64 {
    // Calculate the area of the fundamental parallelogram
    let area = (b1x * b2y - b1y * b2x).abs();
    if area < 1e-10 {
        return 1.0;
    }
    
    // Calculate viewport area
    let viewport_area = viewport_width * viewport_height;
    
    // Points per unit area in lattice space
    let point_density = 1.0 / area;
    
    // Required lattice area to contain target_points
    let required_lattice_area = target_points as f64 / point_density;
    
    // Scale factor: viewport_area = scale^2 * lattice_area
    let scale = (viewport_area / required_lattice_area).sqrt();
    
    // Return a scale with some margin
    scale * 0.8
}

/// Generate a centred square of lattice points:
/// – create a dense grid,
/// – find the distance at which `target_count` distinct x or y columns are reached,
/// – keep every point with |x|,|y| ≤ cutoff (square window).
#[wasm_bindgen]
pub fn calculate_square_lattice_points(
    b1x: f64,
    b1y: f64,
    b2x: f64,
    b2y: f64,
    target_count: i32,
    multiplier: Option<i32>,
) -> JsValue {
    // Use provided multiplier or default to this value
    let mult = multiplier.unwrap_or(20);
    
    // ---- 1. square side length ------------------------------------------------
    let x_sum = b1x.abs() + b2x.abs();
    let y_sum = b1y.abs() + b2y.abs();
    let side = (x_sum.min(y_sum) * mult as f64).max(1e-9);        // avoid zero

    let half_side = side * 0.5;

    // ---- 2. derive search limits for i,j --------------------------------------
    let b1_len = (b1x * b1x + b1y * b1y).sqrt();
    let b2_len = (b2x * b2x + b2y * b2y).sqrt();
    let min_base_len = b1_len.min(b2_len).max(1e-9);

    // generous bound: side / min_len + small margin
    let n_max = (side / min_base_len).ceil() as i32 + 2;

    // ---- 3. generate points ----------------------------------------------------
    let mut points = Vec::new();
    let mut max_distance: f64 = 0.0;

    for i in -n_max..=n_max {
        for j in -n_max..=n_max {
            let x = i as f64 * b1x + j as f64 * b2x;
            let y = i as f64 * b1y + j as f64 * b2y;

            if x.abs() <= half_side && y.abs() <= half_side {
                let d = (x * x + y * y).sqrt();
                max_distance = max_distance.max(d);
                points.push(LatticePoint { x, y, i, j, distance: d });
            }
        }
    }

    // silence "unused variable" warning for target_count
    let _ = target_count;

    serde_wasm_bindgen::to_value(&LatticePointsResult { points, max_distance }).unwrap()
}
