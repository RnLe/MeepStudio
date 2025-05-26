use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Matrix2x2 {
    pub data: [[f64; 2]; 2],
}

#[derive(Serialize, Deserialize)]
pub struct Matrix3x3 {
    pub data: [[f64; 3]; 3],
}

/// Calculate the inverse of a 2x2 matrix
#[wasm_bindgen]
pub fn invert_matrix_2x2(a11: f64, a12: f64, a21: f64, a22: f64) -> Result<JsValue, String> {
    let det = a11 * a22 - a12 * a21;
    
    if det.abs() < 1e-10 {
        return Err("Matrix is singular (determinant is zero)".to_string());
    }
    
    let inv_det = 1.0 / det;
    
    let result = Matrix2x2 {
        data: [
            [a22 * inv_det, -a12 * inv_det],
            [-a21 * inv_det, a11 * inv_det],
        ],
    };
    
    serde_wasm_bindgen::to_value(&result).map_err(|e| e.to_string())
}

/// Calculate the inverse of a 3x3 matrix
#[wasm_bindgen]
pub fn invert_matrix_3x3(
    a11: f64, a12: f64, a13: f64,
    a21: f64, a22: f64, a23: f64,
    a31: f64, a32: f64, a33: f64,
) -> Result<JsValue, String> {
    // Calculate determinant
    let det = a11 * (a22 * a33 - a23 * a32)
            - a12 * (a21 * a33 - a23 * a31)
            + a13 * (a21 * a32 - a22 * a31);
    
    if det.abs() < 1e-10 {
        return Err("Matrix is singular (determinant is zero)".to_string());
    }
    
    let inv_det = 1.0 / det;
    
    // Calculate cofactor matrix and transpose
    let result = Matrix3x3 {
        data: [
            [
                (a22 * a33 - a23 * a32) * inv_det,
                (a13 * a32 - a12 * a33) * inv_det,
                (a12 * a23 - a13 * a22) * inv_det,
            ],
            [
                (a23 * a31 - a21 * a33) * inv_det,
                (a11 * a33 - a13 * a31) * inv_det,
                (a13 * a21 - a11 * a23) * inv_det,
            ],
            [
                (a21 * a32 - a22 * a31) * inv_det,
                (a12 * a31 - a11 * a32) * inv_det,
                (a11 * a22 - a12 * a21) * inv_det,
            ],
        ],
    };
    
    serde_wasm_bindgen::to_value(&result).map_err(|e| e.to_string())
}

/// Multiply two 2x2 matrices
#[wasm_bindgen]
pub fn multiply_matrix_2x2(
    a11: f64, a12: f64, a21: f64, a22: f64,
    b11: f64, b12: f64, b21: f64, b22: f64,
) -> Result<JsValue, String> {
    let result = Matrix2x2 {
        data: [
            [a11 * b11 + a12 * b21, a11 * b12 + a12 * b22],
            [a21 * b11 + a22 * b21, a21 * b12 + a22 * b22],
        ],
    };
    
    serde_wasm_bindgen::to_value(&result).map_err(|e| e.to_string())
}

/// Multiply two 3x3 matrices
#[wasm_bindgen]
pub fn multiply_matrix_3x3(
    a11: f64, a12: f64, a13: f64,
    a21: f64, a22: f64, a23: f64,
    a31: f64, a32: f64, a33: f64,
    b11: f64, b12: f64, b13: f64,
    b21: f64, b22: f64, b23: f64,
    b31: f64, b32: f64, b33: f64,
) -> Result<JsValue, String> {
    let result = Matrix3x3 {
        data: [
            [
                a11 * b11 + a12 * b21 + a13 * b31,
                a11 * b12 + a12 * b22 + a13 * b32,
                a11 * b13 + a12 * b23 + a13 * b33,
            ],
            [
                a21 * b11 + a22 * b21 + a23 * b31,
                a21 * b12 + a22 * b22 + a23 * b32,
                a21 * b13 + a22 * b23 + a23 * b33,
            ],
            [
                a31 * b11 + a32 * b21 + a33 * b31,
                a31 * b12 + a32 * b22 + a33 * b32,
                a31 * b13 + a32 * b23 + a33 * b33,
            ],
        ],
    };
    
    serde_wasm_bindgen::to_value(&result).map_err(|e| e.to_string())
}

/// Calculate transformation matrices for a 2D lattice
#[wasm_bindgen]
pub fn calculate_lattice_transformations(
    a1x: f64, a1y: f64,
    a2x: f64, a2y: f64,
    b1x: f64, b1y: f64,
    b2x: f64, b2y: f64,
) -> Result<JsValue, String> {
    // MA = [a1, a2] (column vectors)
    let ma = [[a1x, a2x], [a1y, a2y]];
    
    // MB = [b1, b2] (column vectors)
    let mb = [[b1x, b2x], [b1y, b2y]];
    
    // Calculate MA inverse
    let det_ma = ma[0][0] * ma[1][1] - ma[0][1] * ma[1][0];
    if det_ma.abs() < 1e-10 {
        return Err("MA is singular (determinant is zero)".to_string());
    }
    let inv_det_ma = 1.0 / det_ma;
    let ma_inv = [
        [ma[1][1] * inv_det_ma, -ma[0][1] * inv_det_ma],
        [-ma[1][0] * inv_det_ma, ma[0][0] * inv_det_ma],
    ];
    
    // Calculate MB inverse
    let det_mb = mb[0][0] * mb[1][1] - mb[0][1] * mb[1][0];
    if det_mb.abs() < 1e-10 {
        return Err("MB is singular (determinant is zero)".to_string());
    }
    let inv_det_mb = 1.0 / det_mb;
    let mb_inv = [
        [mb[1][1] * inv_det_mb, -mb[0][1] * inv_det_mb],
        [-mb[1][0] * inv_det_mb, mb[0][0] * inv_det_mb],
    ];
    
    // T_AB = MB^-1 * MA
    let t_ab = [
        [
            mb_inv[0][0] * ma[0][0] + mb_inv[0][1] * ma[1][0],
            mb_inv[0][0] * ma[0][1] + mb_inv[0][1] * ma[1][1],
        ],
        [
            mb_inv[1][0] * ma[0][0] + mb_inv[1][1] * ma[1][0],
            mb_inv[1][0] * ma[0][1] + mb_inv[1][1] * ma[1][1],
        ],
    ];
    
    // T_BA = MA^-1 * MB
    let t_ba = [
        [
            ma_inv[0][0] * mb[0][0] + ma_inv[0][1] * mb[1][0],
            ma_inv[0][0] * mb[0][1] + ma_inv[0][1] * mb[1][1],
        ],
        [
            ma_inv[1][0] * mb[0][0] + ma_inv[1][1] * mb[1][0],
            ma_inv[1][0] * mb[0][1] + ma_inv[1][1] * mb[1][1],
        ],
    ];
    
    #[derive(Serialize)]
    struct TransformationResult {
        #[serde(rename = "MA")]
        ma: [[f64; 2]; 2],
        #[serde(rename = "MA_inv")]
        ma_inv: [[f64; 2]; 2],
        #[serde(rename = "MB")]
        mb: [[f64; 2]; 2],
        #[serde(rename = "MB_inv")]
        mb_inv: [[f64; 2]; 2],
        #[serde(rename = "realToReciprocal")]
        real_to_reciprocal: [[f64; 2]; 2],
        #[serde(rename = "reciprocalToReal")]
        reciprocal_to_real: [[f64; 2]; 2],
    }
    
    let result = TransformationResult {
        ma,
        ma_inv,
        mb,
        mb_inv,
        real_to_reciprocal: t_ab,
        reciprocal_to_real: t_ba,
    };
    
    serde_wasm_bindgen::to_value(&result).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invert_matrix_2x2() {
        // Test identity matrix
        let result = invert_matrix_2x2(1.0, 0.0, 0.0, 1.0).unwrap();
        // Result should be identity matrix
    }

    #[test]
    fn test_multiply_matrix_2x2() {
        // Test identity multiplication
        let result = multiply_matrix_2x2(
            1.0, 0.0, 0.0, 1.0,
            2.0, 3.0, 4.0, 5.0
        ).unwrap();
        // Result should be the second matrix
    }
}
