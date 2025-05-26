use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Serialize, Deserialize, Debug)]
struct Point {
    x: f64,
    y: f64,
}

#[derive(Serialize, Deserialize)]
struct BrillouinZones {
    zones: Vec<Vec<Point>>,
}

const EPS: f64 = 1e-9;

// Compute intersection point of segments (p1, p2) and (p3, p4)
fn line_intersection(p1: Point, p2: Point, p3: Point, p4: Point) -> Option<Point> {
    let denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if denom.abs() < EPS {
        return None;
    }
    let x = ((p1.x*p2.y - p1.y*p2.x)*(p3.x - p4.x) - (p1.x - p2.x)*(p3.x*p4.y - p3.y*p4.x)) / denom;
    let y = ((p1.x*p2.y - p1.y*p2.x)*(p3.y - p4.y) - (p1.y - p2.y)*(p3.x*p4.y - p3.y*p4.x)) / denom;
    Some(Point { x, y })
}

// Given an edge defined by clip_start -> clip_end (assumed CCW order for inner polygon),
// returns true if point p is outside the inner half-plane.
fn is_outside(p: Point, clip_start: Point, clip_end: Point) -> bool {
    // Compute cross product: if negative, p is outside (or on boundary if near zero)
    let cross = (clip_end.x - clip_start.x) * (p.y - clip_start.y)
              - (clip_end.y - clip_start.y) * (p.x - clip_start.x);
    cross < -EPS
}

// Clip polygon "poly" against one edge (clip_start, clip_end).
fn clip_polygon(poly: &[Point], clip_start: Point, clip_end: Point) -> Vec<Point> {
    let mut output = Vec::new();
    let len = poly.len();
    if len == 0 {
        return output;
    }
    for i in 0..len {
        let cur = poly[i];
        let nxt = poly[(i + 1) % len];
        let cur_out = is_outside(cur, clip_start, clip_end);
        let nxt_out = is_outside(nxt, clip_start, clip_end);
        if !cur_out && !nxt_out {
            // Both outside: keep nxt
            output.push(nxt);
        } else if !cur_out && nxt_out {
            // Exiting clip, add intersection
            if let Some(ip) = line_intersection(cur, nxt, clip_start, clip_end) {
                output.push(ip);
            }
        } else if cur_out && !nxt_out {
            // Entering clip: add intersection and nxt
            if let Some(ip) = line_intersection(cur, nxt, clip_start, clip_end) {
                output.push(ip);
            }
            output.push(nxt);
        }
        // Both inside: add nothing.
    }
    output
}

// Calculate the difference: outer minus inner (inner assumed convex)
fn polygon_difference(outer: &[Point], inner: &[Point]) -> Vec<Point> {
    // Clip outer polygon against each edge of the inner polygon.
    let mut result = outer.to_vec();
    let len = inner.len();
    for i in 0..len {
        let clip_start = inner[i];
        let clip_end = inner[(i + 1) % len];
        result = clip_polygon(&result, clip_start, clip_end);
        if result.len() < 3 {
            break;
        }
    }
    result
}

/// Advanced separation by computing polygon difference using line intersections.
#[wasm_bindgen]
pub fn separate_brillouin_zones(raw: &JsValue) -> JsValue {
    // Parse the input using serde_wasm_bindgen
    let input: BrillouinZones = serde_wasm_bindgen::from_value(raw.clone())
        .unwrap_or(BrillouinZones { zones: vec![] });

    let mut separated: Vec<Vec<Point>> = Vec::with_capacity(input.zones.len());

    for (idx, zone) in input.zones.iter().enumerate() {
        if idx == 0 {
            separated.push(zone.clone());
        } else {
            let inner = &input.zones[idx - 1];
            // Compute proper polygon difference between current zone and previous one.
            let diff = polygon_difference(zone, inner);
            // Fallback if result is invalid.
            separated.push(if diff.len() >= 3 { diff } else { zone.clone() });
        }
    }

    // Convert back to JsValue
    serde_wasm_bindgen::to_value(&BrillouinZones { zones: separated }).unwrap()
}
