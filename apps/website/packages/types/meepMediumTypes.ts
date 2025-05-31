// Medium types for Meep FDTD solver - electromagnetic material properties

import { Vector3 } from "./meepBaseTypes";

export interface Medium {
    // Electromagnetic medium specification - possibly nonlinear and/or dispersive
    // Can model: dielectrics, metals (via predefined objects), dispersive materials
    // Material functions: can specify materials as position-dependent functions
    // Complex ε/μ: use conductivity for narrow-band loss, Lorentzian/Drude for broadband
    
    // === PERMITTIVITY (ε) ===
    
    // Frequency-independent isotropic relative permittivity/dielectric constant
    epsilon?: number; // Default: 1, synonym for epsilon_diag=(ε,ε,ε)
    
    // Refractive index - synonym for epsilon=n²
    // Note: not true refractive index if μ≠1, since true index = √(με)
    index?: number; // Synonym for epsilon=n*n
    
    // Diagonal components of permittivity tensor ε
    epsilon_diag?: Vector3; // Default: (1,1,1) - identity matrix diagonal
    
    // Off-diagonal components of permittivity tensor ε
    // Forms symmetric tensor: [[a,u,v], [u,b,w], [v,w,c]]
    epsilon_offdiag?: Vector3; // Default: (0,0,0) - off-diagonal elements
    
    // === PERMEABILITY (μ) ===
    
    // Frequency-independent isotropic relative permeability
    mu?: number; // Default: 1, synonym for mu_diag=(μ,μ,μ)
    
    // Diagonal components of permeability tensor μ
    mu_diag?: Vector3; // Default: (1,1,1) - identity matrix diagonal
    
    // Off-diagonal components of permeability tensor μ
    mu_offdiag?: Vector3; // Default: (0,0,0) - off-diagonal elements
    
    // === CONDUCTIVITY ===
    
    // Frequency-independent electric conductivity σD
    D_conductivity?: number; // Default: 0, isotropic conductivity
    
    // Diagonal electric conductivity tensor
    D_conductivity_diag?: Vector3; // Default: (0,0,0) - anisotropic conductivity
    
    // Off-diagonal electric conductivity tensor
    D_conductivity_offdiag?: Vector3; // Default: (0,0,0)
    
    // Frequency-independent magnetic conductivity σB
    B_conductivity?: number; // Default: 0, isotropic conductivity
    
    // Diagonal magnetic conductivity tensor
    B_conductivity_diag?: Vector3; // Default: (0,0,0) - anisotropic conductivity
    
    // Off-diagonal magnetic conductivity tensor
    B_conductivity_offdiag?: Vector3; // Default: (0,0,0)
    
    // === NONLINEARITY ===
    
    // Electric Pockels susceptibility χ⁽²⁾ (quadratic nonlinearity)
    chi2?: number; // Default: 0, synonym for E_chi2
    E_chi2?: number; // Electric quadratic nonlinearity
    H_chi2?: number; // Magnetic quadratic nonlinearity
    
    // Diagonal anisotropic quadratic nonlinearity χ⁽²⁾ᵢEᵢ²
    E_chi2_diag?: Vector3; // Default: [E_chi2, E_chi2, E_chi2]
    H_chi2_diag?: Vector3; // Default: [H_chi2, H_chi2, H_chi2]
    
    // Electric Kerr susceptibility χ⁽³⁾ (cubic nonlinearity)
    chi3?: number; // Default: 0, synonym for E_chi3
    E_chi3?: number; // Electric cubic nonlinearity
    H_chi3?: number; // Magnetic cubic nonlinearity
    
    // Diagonal anisotropic cubic nonlinearity χ⁽³⁾ᵢ|E|²Eᵢ
    E_chi3_diag?: Vector3; // Default: [E_chi3, E_chi3, E_chi3]
    H_chi3_diag?: Vector3; // Default: [H_chi3, H_chi3, H_chi3]
    
    // === MATERIAL DISPERSION ===
    
    // List of dispersive susceptibilities added to ε for material dispersion
    // Use Lorentzian/Drude resonances for frequency-dependent materials
    E_susceptibilities?: string[]; // List of Susceptibility class names
    
    // List of dispersive susceptibilities added to μ for material dispersion
    H_susceptibilities?: string[]; // List of Susceptibility class names
    
    // === FREQUENCY RANGE ===
    
    // Valid frequency range for material model
    valid_freq_range?: FreqRange; // Default: (-1e20, 1e20) - all frequencies
    
    // === UI/DISPLAY PROPERTIES ===
    
    // Human-readable name for UI display (e.g., "Silicon", "Titanium Dioxide")
    name?: string;
    
    // Short abbreviation for UI display (e.g., "Si", "Au", "GaN")
    abbreviation?: string;
    
    // Helpful hints or notes about this material
    hint?: string;
    
    // Color for visualization in UI (hex color string)
    color?: string;
    
    // Category for organizing materials in UI
    category?: "Basic" | "Semiconductors" | "Non-Linear Materials" | "Plasmonic Metals";
}

// Frequency range specification for material validity
export interface FreqRange {
    min: number; // Minimum valid frequency
    max: number; // Maximum valid frequency
}

// Base class for material susceptibilities (dispersion models)
export interface Susceptibility {
    // Base class for dispersive material models
    // Subclasses: LorentzianSusceptibility, DrudeSusceptibility, etc.
}

// Predefined material constants (referenced as strings in actual implementation)
export enum PredefinedMaterials {
    METAL = "metal", // Perfect conductor
    PERFECT_ELECTRIC_CONDUCTOR = "perfect_electric_conductor",
    PERFECT_MAGNETIC_CONDUCTOR = "perfect_magnetic_conductor"
}

// Predefined material presets for common electromagnetic media
export const MaterialPresets = {
    // Vacuum - free space with ε=1, μ=1
    vacuum: { epsilon: 1 } as Medium,
    
    // Air - essentially same as vacuum
    air: { epsilon: 1 } as Medium,
    
    // Perfect conductor - infinite conductivity (ε=-∞)
    metal: { epsilon: Number.NEGATIVE_INFINITY } as Medium,
    
    // Perfect electric conductor - infinite electric conductivity
    perfect_electric_conductor: { epsilon: Number.NEGATIVE_INFINITY } as Medium,
    
    // Perfect magnetic conductor - infinite magnetic permeability
    perfect_magnetic_conductor: { mu: Number.NEGATIVE_INFINITY } as Medium
};
