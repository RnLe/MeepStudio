// Region types for Meep FDTD solver - flux, energy, and force calculations

import { Vector3, Volume } from "./meepBaseTypes";

export interface FluxRegion {
    // Region for computing Poynting vector flux of Fourier-transformed fields
    // Flux computed in positive coordinate direction (use weight=-1 to flip)
    // ModeRegion is an alias for FluxRegion when used with add_mode_monitor
    
    // Center of the flux region
    center?: Vector3; // Required - no default
    
    // Size of flux region along coordinate axes
    size?: Vector3; // Default: (0,0,0) - single point
    
    // Direction to compute flux (0=AUTO, 1=X, 2=Y, 3=Z)
    // AUTO uses normal direction for planes/lines
    direction?: number; // Default: 0 (AUTO)
    
    // Direction sign (1 for positive, -1 for negative)
    directionSign?: number; // Default: 1 (positive)
    
    // Weight factor to multiply flux when computed
    weight?: number; // Default: 1.0, can be complex
    
    // Volume specification instead of center and size
    volume?: Volume;
}

export interface EnergyRegion extends FluxRegion {
    // Region for computing energy density integral of Fourier-transformed fields
    // Inherits center, size, weight from FluxRegion but not direction/volume
    
    // Center of the energy region
    center?: Vector3; // Required - no default
    
    // Size of energy region along coordinate axes  
    size?: Vector3; // Default: (0,0,0) - single point
    
    // Weight factor to multiply energy density when computed
    weight?: number; // Default: 1.0, can be complex
}

export interface ForceRegion extends FluxRegion {
    // Region for computing stress tensor integral of Fourier-transformed fields
    // For closed surfaces in vacuum enclosing objects experiencing force
    
    // Center of the force region
    center?: Vector3; // Required - no default
    
    // Size of force region along coordinate axes
    size?: Vector3; // Default: (0,0,0) - single point
    
    // Direction of force to compute (X, Y, Z) - must specify explicitly
    // No relationship between force direction and region orientation
    direction?: number; // Required - no default/AUTOMATIC
    
    // Weight factor to multiply force when computed
    weight?: number; // Default: 1.0, can be complex
    
    // Volume specification instead of center and size
    volume?: Volume;
}

// Direction constants for region specifications
export enum RegionDirection {
    AUTO = 0,
    X = 1,
    Y = 2, 
    Z = 3
}

// Type alias for mode monitor regions
export type ModeRegion = FluxRegion;
