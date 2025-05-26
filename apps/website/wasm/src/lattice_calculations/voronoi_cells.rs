use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Vector2D {
    pub x: f64,
    pub y: f64,
}

impl Vector2D {
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    pub fn dot(&self, other: &Self) -> f64 {
        self.x * other.x + self.y * other.y
    }

    pub fn scale(&self, factor: f64) -> Self {
        Self {
            x: self.x * factor,
            y: self.y * factor,
        }
    }

    pub fn add(&self, other: &Self) -> Self {
        Self {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }

    pub fn angle(&self) -> f64 {
        self.y.atan2(self.x)
    }
}

/// WASM-exported structure for returning zones
#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct BrillouinZonesResult {
    zones: Vec<Vec<Vector2D>>,
}

#[wasm_bindgen]
impl BrillouinZonesResult {
    #[wasm_bindgen(getter)]
    pub fn zones(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.zones).unwrap()
    }
}

/// WASM-exported function to calculate Brillouin zones
#[wasm_bindgen]
pub fn calculate_brillouin_zones(
    a1_x: f64,
    a1_y: f64,
    a2_x: f64,
    a2_y: f64,
    max_zone: usize,
) -> Result<BrillouinZonesResult, JsValue> {
    let a1 = Vector2D::new(a1_x, a1_y);
    let a2 = Vector2D::new(a2_x, a2_y);
    
    match calculate_brillouin_zones_internal(a1, a2, max_zone) {
        Ok(zones) => Ok(BrillouinZonesResult { zones }),
        Err(e) => Err(JsValue::from_str(&e)),
    }
}

/// Internal function that does the actual calculation
fn calculate_brillouin_zones_internal(
    a1: Vector2D,
    a2: Vector2D,
    max_zone: usize,
) -> Result<Vec<Vec<Vector2D>>, String> {
    if max_zone == 0 {
        return Err("max_zone must be at least 1".into());
    }

    /* ---------- 1. collect and sort neighbours (unchanged) ------------------ */
    // search range grows with requested zone but is clamped for perf-reasons
    let search_range = (5 * max_zone as i32).min(25);
    let mut neighbors: Vec<Vector2D> = Vec::new();
    for i in -search_range..=search_range {
        for j in -search_range..=search_range {
            if i == 0 && j == 0 {
                continue;
            }
            neighbors.push(
                a1.scale(i as f64)
                    .add(&a2.scale(j as f64)),
            );
        }
    }

    // distance-sorted neighbours
    neighbors.sort_by(|a, b| {
        let da = a.dot(a);
        let db = b.dot(b);
        da.partial_cmp(&db).unwrap()
    });

    /* ---------- 2. split into distance shells (unchanged) ------------------- */
    let tol = 1e-6;
    let mut shells: Vec<Vec<Vector2D>> = Vec::new();
    for n in neighbors {
        let dist = n.dot(&n).sqrt();
        if let Some(last) = shells.last_mut() {
            let last_dist = last[0].dot(&last[0]).sqrt();
            if (dist - last_dist).abs() < tol {
                last.push(n);
                continue;
            }
        }
        shells.push(vec![n]);
    }

    /* ---------- 3. build one polygon per shell ------------------------------ */
    let mut zones: Vec<Vec<Vector2D>> = Vec::new();

    for zone_idx in 0..max_zone {
        if zone_idx >= shells.len() {
            break;                         // not enough shells found
        }

        // We start with the *single* current shell and, if that fails,
        // progressively add the next outer ones until we get a non-empty poly.
        let mut attempt_end = zone_idx;
        let polygon = loop {
            let mut this_shell_set: Vec<Vector2D> = Vec::new();
            for s in zone_idx..=attempt_end {
                this_shell_set.extend(&shells[s]);
            }

            match halfspace_intersection_with_neighbors(
                &Vector2D::new(0.0, 0.0),
                &Vector2D::new(0.0, 0.0),
                &this_shell_set,
            ) {
                Ok(poly) => break poly,             // success
                Err(_) if attempt_end + 1 < shells.len() => {
                    attempt_end += 1;                // add an outer shell and retry
                    continue;
                }
                Err(e) => return Err(e),             // gave up
            }
        };

        zones.push(polygon);
    }

    if zones.is_empty() {
        return Err("Failed to calculate any zones".into());
    }
    Ok(zones)
}

/// Compute the Wigner-Seitz polygon using a specific set of neighbors
fn halfspace_intersection_with_neighbors(
    _a1: &Vector2D,
    _a2: &Vector2D,
    neighbors: &[Vector2D],
) -> Result<Vec<Vector2D>, String> {
    let mut vertices: Vec<Vector2D> = Vec::new();
    
    // Find intersections of half-space boundaries
    for i in 0..neighbors.len() {
        let v_i = &neighbors[i];
        let a_i = v_i.dot(v_i) / 2.0;
        
        for j in (i + 1)..neighbors.len() {
            let v_j = &neighbors[j];
            
            // Create matrix M = [v_i, v_j]^T
            let det = v_i.x * v_j.y - v_i.y * v_j.x;
            
            // Check if vectors are parallel
            if det.abs() < 1e-12 {
                continue;
            }
            
            // Solve the linear system M * x = b
            let b_j = v_j.dot(v_j) / 2.0;
            let x_int = (a_i * v_j.y - b_j * v_i.y) / det;
            let y_int = (v_i.x * b_j - v_j.x * a_i) / det;
            
            let intersection = Vector2D::new(x_int, y_int);
            
            // Check if intersection satisfies all half-space constraints
            let mut valid = true;
            for v_k in neighbors {
                let constraint = v_k.dot(&intersection);
                let bound = v_k.dot(v_k) / 2.0 + 1e-7;   // ← relaxed tolerance
                if constraint > bound {
                    valid = false;
                    break;
                }
            }
            
            if valid {
                vertices.push(intersection);
            }
        }
    }
    
    // Remove duplicate vertices
    vertices = remove_duplicates(&vertices);
    
    if vertices.is_empty() {
        return Err("Half-space intersection produced an empty polygon".to_string());
    }
    
    // Sort vertices by angle
    Ok(sort_vertices_by_angle(&vertices))
}

/// Remove duplicate vertices with tolerance
fn remove_duplicates(vertices: &[Vector2D]) -> Vec<Vector2D> {
    let tolerance: f64 = 1e-9;
    let mut unique: Vec<Vector2D> = Vec::new();
    
    for v in vertices {
        let mut is_duplicate: bool = false;
        for u in &unique {
            let dist_sq: f64 = (v.x - u.x).powi(2) + (v.y - u.y).powi(2);
            if dist_sq < tolerance * tolerance {
                is_duplicate = true;
                break;
            }
        }
        if !is_duplicate {
            unique.push(*v);
        }
    }
    
    unique
}

/// Sort vertices by angle for proper polygon ordering
fn sort_vertices_by_angle(vertices: &[Vector2D]) -> Vec<Vector2D> {
    let mut indexed_vertices: Vec<(f64, Vector2D)> = vertices
        .iter()
        .map(|v| (v.angle(), *v))
        .collect();
    
    indexed_vertices.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
    
    indexed_vertices.into_iter().map(|(_, v)| v).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_square_lattice() {
        let a1 = Vector2D::new(1.0, 0.0);
        let a2 = Vector2D::new(0.0, 1.0);
        
        let result = calculate_brillouin_zones_internal(a1, a2, 1);
        assert!(result.is_ok());
        
        let zones = result.unwrap();
        assert_eq!(zones.len(), 1);
        assert_eq!(zones[0].len(), 4); // Square should have 4 vertices
    }

    #[test]
    fn test_hexagonal_lattice() {
        let a1 = Vector2D::new(1.0, 0.0);
        let a2 = Vector2D::new(0.5, 0.866025403784); // sqrt(3)/2
        
        let result = calculate_brillouin_zones_internal(a1, a2, 1);
        assert!(result.is_ok());
        
        let zones = result.unwrap();
        assert_eq!(zones.len(), 1);
        assert_eq!(zones[0].len(), 6); // Hexagonal should have 6 vertices
    }
}
