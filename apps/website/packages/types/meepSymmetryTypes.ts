// Symmetry types for Meep FDTD solver - structural and source symmetries

// Base symmetry class for all symmetry operations
export interface Symmetry {
    // Base class for symmetries that preserve both structure and sources
    // Cell can be reduced by factor of 4 (2D) or 8 (3D) maximum
    // Multiple non-redundant symmetries can be exploited simultaneously
    
    // Direction of symmetry (normal to mirror plane or rotation axis)
    // Only Cartesian/grid directions allowed (X, Y, Z)
    direction?: SymmetryDirection; // Required - no default
    
    // Phase factor applied when operating symmetry on fields
    // Specifies representation of symmetry group for field/source transformation
    phase?: number | string; // Default: +1 (can be complex, e.g. -1 for odd mirror)
}

export interface Mirror extends Symmetry {
    // Mirror symmetry plane
    // direction specifies the normal to the mirror plane
}

export interface Rotate2 extends Symmetry {
    // 180° (twofold) rotational symmetry (C2)
    // direction specifies the axis of rotation
}

export interface Rotate4 extends Symmetry {
    // 90° (fourfold) rotational symmetry (C4)
    // direction specifies the axis of rotation
}

export interface Identity extends Symmetry {
    // Identity symmetry (no transformation)
}

// Direction constants for symmetry specification
export enum SymmetryDirection {
    X = "X",
    Y = "Y", 
    Z = "Z"
}
