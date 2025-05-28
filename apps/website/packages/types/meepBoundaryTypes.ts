// PML (Perfectly Matched Layer) boundary types for Meep FDTD solver

export interface PML {
    // Spatial thickness of the PML layer extending from boundary towards inside of cell
    thickness: number;
    
    // Direction of boundaries to apply PML (X, Y, Z, or ALL for all directions)
    direction?: number; // Default: ALL (-1)
    
    // Which side of boundary (Low, High, or ALL for both sides)
    side?: number; // Default: ALL (-1)
    
    // Asymptotic reflection limit for infinite resolution/thickness from air
    R_asymptotic?: number; // Default: 1e-15
    
    // Mean stretch parameter for PML
    mean_stretch?: number; // Default: 1.0
    
    // PML profile function name - determines absorption profile shape
    // Default is quadratic: f(u) = u^2 where u goes from 0 to 1
    pml_profile?: string; // Function name, default: "quadratic"
}

// Direction constants for PML specification
export enum PMLDirection {
    X = 0,
    Y = 1,
    Z = 2,
    ALL = -1
}

// Side constants for PML specification  
export enum PMLSide {
    Low = 0,
    High = 1,
    ALL = -1
}

// Absorber interface that extends PML for alternative boundary absorption
export interface Absorber extends PML {
    // Drop-in replacement for PML using scalar conductivity instead of true PML
    // Uses same parameters as PML but implements different absorption mechanism
    // Better for: periodic media, backward-wave modes, angled waveguides
}
