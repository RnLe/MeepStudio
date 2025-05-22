use wasm_bindgen::prelude::*;

/// Adds two 32-bit integers.
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
