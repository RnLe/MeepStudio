use ndarray::{Array1, ArrayView1};
use num_complex::Complex;
use rustfft::{FftPlanner, num_complex::Complex64};
use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct FftResult {
    pub real: Vec<f64>,
    pub imag: Vec<f64>,
    pub magnitude: Vec<f64>,
    pub phase: Vec<f64>,
    pub frequencies: Vec<f64>,
}

/// Compute the FFT of a real-valued signal
#[wasm_bindgen]
pub fn compute_fft(signal: &[f64], sample_rate: f64) -> Result<JsValue, JsValue> {
    let n = signal.len();
    
    // Convert to complex numbers
    let mut buffer: Vec<Complex64> = signal
        .iter()
        .map(|&x| Complex64::new(x, 0.0))
        .collect();
    
    // Create FFT planner and compute
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(n);
    fft.process(&mut buffer);
    
    // Calculate frequency bins
    let freq_resolution = sample_rate / n as f64;
    let frequencies: Vec<f64> = (0..=n/2)
        .map(|i| i as f64 * freq_resolution)
        .collect();
    
    // Extract results (only positive frequencies)
    let half_n = n / 2 + 1;
    let real: Vec<f64> = buffer[..half_n].iter().map(|c| c.re).collect();
    let imag: Vec<f64> = buffer[..half_n].iter().map(|c| c.im).collect();
    let magnitude: Vec<f64> = buffer[..half_n]
        .iter()
        .map(|c| {
            let mag = c.norm();
            if n > 0 { 2.0 * mag / n as f64 } else { mag }
        })
        .collect();
    let phase: Vec<f64> = buffer[..half_n]
        .iter()
        .map(|c| c.arg())
        .collect();
    
    let result = FftResult {
        real,
        imag,
        magnitude,
        phase,
        frequencies,
    };
    
    Ok(serde_wasm_bindgen::to_value(&result)?)
}

/// Compute the inverse FFT
#[wasm_bindgen]
pub fn compute_ifft(real: &[f64], imag: &[f64]) -> Result<Vec<f64>, JsValue> {
    let n = real.len();
    
    // Create complex buffer
    let mut buffer: Vec<Complex64> = real
        .iter()
        .zip(imag.iter())
        .map(|(&r, &i)| Complex64::new(r, i))
        .collect();
    
    // Create FFT planner and compute inverse
    let mut planner = FftPlanner::new();
    let ifft = planner.plan_fft_inverse(n);
    ifft.process(&mut buffer);
    
    // Extract real part and normalize
    let signal: Vec<f64> = buffer
        .iter()
        .map(|c| c.re / n as f64)
        .collect();
    
    Ok(signal)
}

/// Compute the Fourier transform of a Gaussian pulse
#[wasm_bindgen]
pub fn gaussian_pulse_spectrum(
    frequency: f64,
    width: f64,
    amplitude_real: f64,
    amplitude_imag: f64,
) -> Result<JsValue, JsValue> {
    // For a Gaussian pulse with carrier frequency f0 and width σ:
    // The spectrum is also Gaussian centered at f0 with width 1/(2πσ)
    
    let spectral_width = 1.0 / (2.0 * std::f64::consts::PI * width);
    let amplitude = Complex64::new(amplitude_real, amplitude_imag);
    
    // Generate frequency points
    let freq_max = frequency + 5.0 * spectral_width;
    let freq_min = (frequency - 5.0 * spectral_width).max(0.0);
    let n_points = 200;
    
    let frequencies: Vec<f64> = (0..n_points)
        .map(|i| freq_min + (freq_max - freq_min) * i as f64 / (n_points - 1) as f64)
        .collect();
    
    // Calculate spectrum magnitude
    let magnitude: Vec<f64> = frequencies
        .iter()
        .map(|&f| {
            let delta_f = f - frequency;
            let gaussian = (-delta_f * delta_f / (2.0 * spectral_width * spectral_width)).exp();
            amplitude.norm() * gaussian * width * (2.0 * std::f64::consts::PI).sqrt()
        })
        .collect();
    
    let result = serde_json::json!({
        "frequencies": frequencies,
        "magnitude": magnitude,
        "spectral_width": spectral_width,
        "center_frequency": frequency,
    });
    
    Ok(serde_wasm_bindgen::to_value(&result)?)
}
