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

/// Calculates lattice points within a viewport
/// b1x, b1y: first basis vector
/// b2x, b2y: second basis vector
/// viewport_width, viewport_height: size of the viewport in screen coordinates
/// scale: current zoom scale
/// offset_x, offset_y: pan offset
#[wasm_bindgen]
pub fn calculate_lattice_points(
    b1x: f64,
    b1y: f64,
    b2x: f64,
    b2y: f64,
    viewport_width: f64,
    viewport_height: f64,
    scale: f64,
    offset_x: f64,
    offset_y: f64,
) -> JsValue {
    let mut points = Vec::new();
    let mut max_distance: f64 = 0.0;
    
    // Calculate the inverse transformation to find which lattice points are visible
    // We need to solve: viewport_point = scale * (lattice_point) + offset
    // So: lattice_point = (viewport_point - offset) / scale
    
    // Calculate bounds in lattice space
    let half_width = viewport_width / 2.0;
    let half_height = viewport_height / 2.0;
    
    // Transform viewport corners to lattice space
    let corners = [
        ((-half_width - offset_x) / scale, (-half_height - offset_y) / scale),
        ((half_width - offset_x) / scale, (-half_height - offset_y) / scale),
        ((-half_width - offset_x) / scale, (half_height - offset_y) / scale),
        ((half_width - offset_x) / scale, (half_height - offset_y) / scale),
    ];
    
    // Calculate the determinant for basis change
    let det = b1x * b2y - b1y * b2x;
    if det.abs() < 1e-10 {
        // Degenerate basis, return empty
        return serde_wasm_bindgen::to_value(&LatticePointsResult {
            points,
            max_distance: 0.0,
        }).unwrap();
    }
    
    // Inverse basis transformation
    let inv_b1x = b2y / det;
    let inv_b1y = -b1y / det;
    let inv_b2x = -b2x / det;
    let inv_b2y = b1x / det;
    
    // Find the range of i, j indices by transforming viewport corners
    let mut min_i = i32::MAX;
    let mut max_i = i32::MIN;
    let mut min_j = i32::MAX;
    let mut max_j = i32::MIN;
    
    for &(x, y) in &corners {
        let fi = x * inv_b1x + y * inv_b1y;
        let fj = x * inv_b2x + y * inv_b2y;
        
        min_i = min_i.min(fi.floor() as i32 - 1);
        max_i = max_i.max(fi.ceil() as i32 + 1);
        min_j = min_j.min(fj.floor() as i32 - 1);
        max_j = max_j.max(fj.ceil() as i32 + 1);
    }
    
    // Clamp the range to prevent excessive computation
    let max_range = 100;
    min_i = min_i.max(-max_range);
    max_i = max_i.min(max_range);
    min_j = min_j.max(-max_range);
    max_j = max_j.min(max_range);
    
    // Generate lattice points
    for i in min_i..=max_i {
        for j in min_j..=max_j {
            let x = i as f64 * b1x + j as f64 * b2x;
            let y = i as f64 * b1y + j as f64 * b2y;
            
            // Check if point is within extended viewport (with some margin)
            let screen_x = x * scale + offset_x;
            let screen_y = y * scale + offset_y;
            let margin = 100.0; // Extra margin to ensure smooth transitions
            
            if screen_x >= -half_width - margin && screen_x <= half_width + margin &&
               screen_y >= -half_height - margin && screen_y <= half_height + margin {
                
                // Calculate distance from origin in lattice space
                let distance = (x * x + y * y).sqrt();
                max_distance = max_distance.max(distance);
                
                points.push(LatticePoint {
                    x,
                    y,
                    i,
                    j,
                    distance,
                });
            }
        }
    }
    
    serde_wasm_bindgen::to_value(&LatticePointsResult {
        points,
        max_distance,
    }).unwrap()
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

/// Calculate all lattice points that fill a bounding box
/// The number of points is determined by fixing 100 points along the shorter axis
#[wasm_bindgen]
pub fn calculate_all_lattice_points(
    b1x: f64,
    b1y: f64,
    b2x: f64,
    b2y: f64,
) -> JsValue {
    let mut points = Vec::new();
    let mut max_distance: f64 = 0.0;
    
    // Calculate the lengths of the basis vectors
    let len1 = (b1x * b1x + b1y * b1y).sqrt();
    let len2 = (b2x * b2x + b2y * b2y).sqrt();
    
    // Determine which is the shorter axis and fix it to 100 points
    let base_count = 100;
    let (n1, n2) = if len1 <= len2 {
        // b1 is shorter, fix it to base_count
        let ratio = len2 / len1;
        (base_count, (base_count as f64 * ratio).ceil() as i32)
    } else {
        // b2 is shorter, fix it to base_count
        let ratio = len1 / len2;
        ((base_count as f64 * ratio).ceil() as i32, base_count)
    };
    
    // To fill a bounding box, we need to consider all four corners
    // of the parallelogram formed by n1*b1 and n2*b2
    let corners = vec![
        (0.0, 0.0),
        (n1 as f64 * b1x, n1 as f64 * b1y),
        (n2 as f64 * b2x, n2 as f64 * b2y),
        (n1 as f64 * b1x + n2 as f64 * b2x, n1 as f64 * b1y + n2 as f64 * b2y),
    ];
    
    // Find bounding box
    let min_x = corners.iter().map(|(x, _)| *x).fold(f64::INFINITY, f64::min);
    let max_x = corners.iter().map(|(x, _)| *x).fold(f64::NEG_INFINITY, f64::max);
    let min_y = corners.iter().map(|(_, y)| *y).fold(f64::INFINITY, f64::min);
    let max_y = corners.iter().map(|(_, y)| *y).fold(f64::NEG_INFINITY, f64::max);
    
    // Calculate the determinant for basis change
    let det = b1x * b2y - b1y * b2x;
    if det.abs() < 1e-10 {
        return serde_wasm_bindgen::to_value(&LatticePointsResult {
            points,
            max_distance: 0.0,
        }).unwrap();
    }
    
    // Inverse basis transformation
    let inv_b1x = b2y / det;
    let inv_b1y = -b1y / det;
    let inv_b2x = -b2x / det;
    let inv_b2y = b1x / det;
    
    // Calculate the range of indices needed to fill the bounding box
    let mut min_i = i32::MAX;
    let mut max_i = i32::MIN;
    let mut min_j = i32::MAX;
    let mut max_j = i32::MIN;
    
    // Check corners of bounding box
    let bb_corners = vec![
        (min_x, min_y),
        (max_x, min_y),
        (min_x, max_y),
        (max_x, max_y),
    ];
    
    for (x, y) in bb_corners {
        let fi = x * inv_b1x + y * inv_b1y;
        let fj = x * inv_b2x + y * inv_b2y;
        
        min_i = min_i.min(fi.floor() as i32 - 1);
        max_i = max_i.max(fi.ceil() as i32 + 1);
        min_j = min_j.min(fj.floor() as i32 - 1);
        max_j = max_j.max(fj.ceil() as i32 + 1);
    }
    
    // Generate all lattice points within the bounding box
    for i in min_i..=max_i {
        for j in min_j..=max_j {
            let x = i as f64 * b1x + j as f64 * b2x;
            let y = i as f64 * b1y + j as f64 * b2y;
            
            // Check if point is within bounding box
            if x >= min_x && x <= max_x && y >= min_y && y <= max_y {
                let distance = (x * x + y * y).sqrt();
                max_distance = max_distance.max(distance);
                
                points.push(LatticePoint {
                    x,
                    y,
                    i,
                    j,
                    distance,
                });
            }
        }
    }
    
    serde_wasm_bindgen::to_value(&LatticePointsResult {
        points,
        max_distance,
    }).unwrap()
}

/// Generate a centred square of lattice points:
/// – create a dense ±100×100 grid,
/// – find the distance at which `target_count` distinct x or y columns are reached,
/// – keep every point with |x|,|y| ≤ cutoff (square window).
#[wasm_bindgen]
pub fn calculate_square_lattice_points(
    b1x: f64,
    b1y: f64,
    b2x: f64,
    b2y: f64,
    target_count: i32,
) -> JsValue {
    let mut raw = Vec::with_capacity(40_000);
    let mut x_coords: Vec<f64> = Vec::new();
    let mut y_coords: Vec<f64> = Vec::new();

    // generate symmetric grid (±100)
    for i in -100..=100 {
        for j in -100..=100 {
            let x = i as f64 * b1x + j as f64 * b2x;
            let y = i as f64 * b1y + j as f64 * b2y;
            raw.push((i, j, x, y, (x * x + y * y).sqrt()));
            x_coords.push(x);
            y_coords.push(y);
        }
    }

    // sort all coordinates (not just absolute values)
    x_coords.sort_by(|a, b| a.partial_cmp(b).unwrap());
    y_coords.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    // deduplicate to get unique coordinates
    x_coords.dedup_by(|a, b| (*a - *b).abs() < 1e-9);
    y_coords.dedup_by(|a, b| (*a - *b).abs() < 1e-9);

    // Find the range that gives us exactly target_count points on each side of zero
    // We want target_count points total, so target_count/2 on each side of zero
    let target_half = target_count / 2;
    
    // Find zero position in sorted arrays
    let x_zero_idx = x_coords.iter().position(|&x| x >= 0.0).unwrap_or(x_coords.len());
    let y_zero_idx = y_coords.iter().position(|&y| y >= 0.0).unwrap_or(y_coords.len());
    
    // Get cutoff values for target_half points on each side
    let x_cutoff_neg = if x_zero_idx >= target_half as usize {
        x_coords[x_zero_idx - target_half as usize].abs()
    } else {
        x_coords[0].abs()
    };
    
    let x_cutoff_pos = if (x_zero_idx + target_half as usize) < x_coords.len() {
        x_coords[x_zero_idx + target_half as usize - 1]
    } else {
        x_coords[x_coords.len() - 1]
    };
    
    let y_cutoff_neg = if y_zero_idx >= target_half as usize {
        y_coords[y_zero_idx - target_half as usize].abs()
    } else {
        y_coords[0].abs()
    };
    
    let y_cutoff_pos = if (y_zero_idx + target_half as usize) < y_coords.len() {
        y_coords[y_zero_idx + target_half as usize - 1]
    } else {
        y_coords[y_coords.len() - 1]
    };
    
    // Use the minimum cutoff to ensure we get at most target_count x target_count points
    let cutoff = x_cutoff_neg.min(x_cutoff_pos).min(y_cutoff_neg).min(y_cutoff_pos);

    // keep only points inside the centred square
    let mut points = Vec::new();
    let mut max_distance: f64 = 0.0;
    for (i, j, x, y, d) in raw {
        if x.abs() <= cutoff && y.abs() <= cutoff {
            max_distance = max_distance.max(d);
            points.push(LatticePoint { x, y, i, j, distance: d });
        }
    }

    serde_wasm_bindgen::to_value(&LatticePointsResult { points, max_distance }).unwrap()
}
