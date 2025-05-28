// Base types for Meep FDTD solver

// Basic 3D vector type
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

// Volume specification for spatial regions in Meep
export interface Volume {
    // Center point of the volume
    center?: Vector3; // Default: (0,0,0)
    
    // Size of the volume in each direction
    size?: Vector3; // Default: (0,0,0) - single point
    
    // Dimensionality of the simulation
    dims?: number; // Default: 2
    
    // Whether using cylindrical coordinate system
    is_cylindrical?: boolean; // Default: false
    
    // Alternative specification using list of vertices
    // Center and size automatically computed from vertices
    vertices?: Vector3[]; // Default: empty array
}
