use wasm_bindgen::prelude::*;

mod lattice_calculations {
    pub mod lattice_points;
    pub mod voronoi_cells;
    pub mod voronoi_separation;
    pub mod matrix_calculations;
}

// Re-export all items from latticePoints module
pub use lattice_calculations::lattice_points::*;
pub use lattice_calculations::voronoi_cells::*;
pub use lattice_calculations::voronoi_separation::*;
pub use lattice_calculations::matrix_calculations::*;

/// Adds two 32-bit integers.
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
