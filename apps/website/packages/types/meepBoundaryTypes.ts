// Boundary types for Meep FDTD solver - Perfectly Matched Layer (PML) and others

import { Vector3 } from "./meepBaseTypes";

export interface PMLBoundary {
    // PML (Perfectly Matched Layer) absorbing boundary condition
    // Always attached to simulation borders, facing inwards
    
    // Thickness of PML layer in units of distance
    thickness: number; // Default: 1.0
    
    // PML direction specification (+X, -X, +Y, -Y, +Z, -Z, or ALL)
    // ALL means PML on all boundaries
    direction?: PMLDirection | string; // Default: ALL
    
    // Side specification for 2D simulations (Low, High, or All)
    side?: PMLSide | string; // Default: All
    
    // PML profile parameters
    // Conductivity profile: σ(u) = σ_max * u^pml_profile.power
    // where u goes from 0 (inner) to 1 (outer) through PML thickness
    
    // Maximum conductivity (strength parameter)
    strength?: number; // Default: 1.0
    
    // Power law exponent for conductivity profile
    power?: number; // Default: 2.0
    
    // Asymptotic reflection error for automatic strength calculation
    // If specified, overrides manual strength setting
    R_asymptotic?: number; // Default: 1e-15
    
    // Mean wavelength for automatic parameter calculation
    mean_wavelength?: number; // Optional, uses source wavelength if not specified
}

// Direction constants for PML specification
export enum PMLDirection {
    X = "X",           // Both +X and -X boundaries
    Y = "Y",           // Both +Y and -Y boundaries  
    Z = "Z",           // Both +Z and -Z boundaries
    POS_X = "+X",      // Only +X boundary
    NEG_X = "-X",      // Only -X boundary
    POS_Y = "+Y",      // Only +Y boundary
    NEG_Y = "-Y",      // Only -Y boundary
    POS_Z = "+Z",      // Only +Z boundary
    NEG_Z = "-Z",      // Only -Z boundary
    ALL = "ALL"        // All boundaries
}

// Side specification for 2D simulations
export enum PMLSide {
    Low = "Low",       // Lower boundary only
    High = "High",     // Upper boundary only
    All = "All"        // Both boundaries
}

// Base interface for all canvas boundaries
export interface CanvasBoundaryBase {
  id: string;
  kind: string;
  name?: string;
}

// Individual PML edge parameters
export interface PMLEdgeParameters {
  thickness: number;
  R_asymptotic: number;
  active: boolean;
}

export type PMLParameterSets = {
  [key: number]: PMLEdgeParameters;
};

// Canvas representation of PML boundary
export interface CanvasPMLBoundary extends CanvasBoundaryBase {
  kind: "pmlBoundary";
  
  // Legacy properties for backwards compatibility
  thickness: number;
  direction: PMLDirection;
  side: PMLSide;
  strength: number;
  power: number;
  R_asymptotic: number;
  
  // New properties for individual edge control
  // Maps edge to parameter set index (0-3)
  edgeAssignments?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  
  // Parameter sets (up to 4 active)
  parameterSets?: {
    [index: number]: PMLEdgeParameters & { active: boolean };
  };
}

// Possible future boundary types
export interface PeriodicBoundary {
    // Periodic/Bloch boundary conditions
    k_point?: Vector3; // Bloch wave vector
    direction?: string; // X, Y, Z, or ALL
}

export interface SymmetryBoundary {
    // Mirror symmetry boundary
    direction?: string; // X, Y, or Z
    phase?: number; // Phase factor for symmetry
}
