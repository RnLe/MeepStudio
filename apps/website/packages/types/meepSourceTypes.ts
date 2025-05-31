// Source types for Meep FDTD solver - current sources J(x,t) = A(x)⋅f(t)

import { Vector3 } from "./meepBaseTypes";
import { Volume } from "./meepBaseTypes";

export interface Source {
    // Time-dependence specification (SourceTime class)
    src: string; // SourceTime class name
    
    // Direction and type of current component (Ex, Ey, Ez, Hx, Hy, Hz)
    // Required - no default value
    component: SourceComponent | string;
    
    // Location of center of current source in cell
    center?: Vector3;
    
    // Size of current distribution along each direction
    size?: Vector3; // Default: (0,0,0) - point-dipole source
    
    // Volume specification instead of center and size
    volume?: Volume;
    
    // Overall complex amplitude multiplying the current source
    amplitude?: number | string; // Default: 1.0, can be complex
    
    // Function name that takes Vector3 position and returns complex amplitude
    amp_func?: string; // Function name, default: None
    
    // HDF5 file path for amplitude function interpolation
    amp_func_file?: string; // Format: "path.h5:dataset", default: ""
    
    // NumPy array for amplitude function interpolation
    amp_data?: any; // numpy.ndarray with dtype=numpy.complex128, default: None
    
    // Optional label for identification
    label?: string;
}

// Component constants for source specification
export enum SourceComponent {
    Ex = "Ex",
    Ey = "Ey", 
    Ez = "Ez",
    Hx = "Hx",
    Hy = "Hy",
    Hz = "Hz",
    ALL_COMPONENTS = "ALL_COMPONENTS"
}

export interface EigenModeSource extends Omit<Source, 'component'> {
    // EigenModeSource: Uses MPB to compute eigenmode current profiles
    // Normalized for unit power transmission in time-harmonic simulations
    // Note: Only supports dispersionless, non-magnetic materials; ignores PML
    
    // Band index (1,2,3,...) where 1 is lowest frequency, or DiffractedPlanewave class
    eig_band?: number | string; // Default: 1
    
    // Search direction for mode matching (X, Y, Z, AUTOMATIC, NO_DIRECTION)
    // AUTOMATIC: normal to source region, NO_DIRECTION: allows oblique waveguides
    direction?: string; // Default: AUTOMATIC
    
    // Whether to find mode matching src frequency by scanning k-vectors
    eig_match_freq?: boolean; // Default: true
    
    // k-vector in Meep units (2π/unit length) - initial guess or exact specification
    // Plane components default to zero unless cell spans entire direction with Bloch BC
    eig_kpoint?: Vector3; // Default: (0,0,0)
    
    // Mode parity for structures with mirror symmetry (NO_PARITY, EVEN_Z, ODD_Z, etc.)
    // Can combine multiple: EVEN_Z + ODD_Y. Useful for 2D polarization control
    eig_parity?: string; // Default: NO_PARITY
    
    // Spatial resolution for MPB eigenmode calculation
    eig_resolution?: number; // Default: 2*resolution
    
    // Tolerance for MPB eigensolver convergence
    eig_tolerance?: number; // Default: 1e-12
    
    // Which current components to include
    // For EigenModeSource, defaults to ALL_COMPONENTS (overrides Source.component requirement)
    component?: SourceComponent | string; // Default: ALL_COMPONENTS
    
    // Optional larger unit cell for MPB calculation (for periodic media)
    // Must enclose the actual source volume (size/center)
    eig_lattice_size?: Vector3;
    eig_lattice_center?: Vector3;
    
    // Alternative volume specification for MPB unit cell
    eig_vol?: Volume;
}

// Direction constants for eigenmode source
export enum EigenModeDirection {
    X = "X",
    Y = "Y", 
    Z = "Z",
    AUTOMATIC = "AUTOMATIC",
    NO_DIRECTION = "NO_DIRECTION"
}

// Parity constants for eigenmode calculation
export enum EigenModeParity {
    NO_PARITY = "NO_PARITY",
    EVEN_Z = "EVEN_Z",
    ODD_Z = "ODD_Z", 
    EVEN_Y = "EVEN_Y",
    ODD_Y = "ODD_Y"
}

export interface GaussianBeam3DSource extends Omit<Source, 'component'> {
    // GaussianBeam3DSource: Transverse electromagnetic Gaussian beam mode
    // Uses "complex point-source" method in 3D for exact beam solution
    // Source region must be line (2D) or plane (3D). Component parameter ignored.
    // Best accuracy near source center frequency with narrow-band time dependence
    
    // Location of beam focus relative to source center
    // Focus can be anywhere (inside/outside cell, independent of source position)
    beam_x0?: Vector3; // Default: (0,0,0)
    
    // Propagation direction of beam (length ignored)
    // Wavelength determined by src center frequency and refractive index at source center
    beam_kdir?: Vector3; // Default: (0,0,0)
    
    // Beam waist radius - independent parameter defining beam geometry
    beam_w0?: number; // Required for beam definition
    
    // Polarization vector of beam (can be complex for circular polarization)
    // Must be parallel to source region for transverse mode generation
    beam_E0?: Vector3; // Default: (0,0,0)
    
    // Component is handled automatically for Gaussian beams
    component?: SourceComponent | string; // Default: ALL_COMPONENTS (ignored)
}

export interface GaussianBeam2DSource extends GaussianBeam3DSource {
    // GaussianBeam2DSource: 2D-specific Gaussian beam implementation
    // Identical to GaussianBeam3DSource but uses true 2D beam solution
    // More accurate than 3D cross-section approximation for 2D simulations
}

// Base interface for source time dependence
export interface SourceTime {
    // Base class for time-dependent source functions
    frequency?: number; // Center frequency in units of c/distance or 2πc/distance
    wavelength?: number; // Alternative to frequency: wavelength=1/frequency
    period?: number; // Alternative to frequency: period=1/frequency
}

export interface ContinuousSource extends SourceTime {
    // Continuous-wave source proportional to exp(-iωt) with optional smooth turn-on/off
    // Never produces exact single-frequency response in practice
    
    // Center frequency in units of c/distance or 2πc/distance
    frequency?: number; // Required - no default
    
    // Starting time for the source
    start_time?: number; // Default: 0 (turn on at t=0)
    
    // End time for the source
    end_time?: number; // Default: 1e20 (never turn off)
    
    // Temporal width of smoothing (inverse of exponential rate)
    width?: number; // Default: 0 (no smoothing)
    
    // Frequency width (synonym for width=1/fwidth)
    fwidth?: number; // Default: inf
    
    // Cutoff parameter for smoothing
    cutoff?: number; // Default: varies
    
    // Controls turn-on gradient - larger means more gradual
    slowness?: number; // Default: 3.0
    
    // If true, source is integral of current (dipole moment)
    // Little difference except for planewaves in PML
    is_integrated?: boolean; // Default: false
}

export interface GaussianSource extends SourceTime {
    // Gaussian pulse source proportional to exp(-iωt - (t-t0)²/2w²)
    // Actually discrete-time derivative of Gaussian for numerical reasons
    
    // Center frequency in units of c/distance or 2πc/distance
    frequency?: number; // Required - no default
    
    // Gaussian width parameter w
    width?: number; // Required - no default
    
    // Frequency width (synonym for width=1/fwidth)
    fwidth?: number; // Default: inf
    
    // Starting time for source (not peak time)
    start_time?: number; // Default: 0
    
    // Decay widths before cutoff (both turn-on and turn-off)
    // Peak occurs at: start_time + cutoff*width
    cutoff?: number; // Default: 5.0
    
    // If true, source is integral of current (guaranteed zero after turn-off)
    is_integrated?: boolean; // Default: false
}

export interface CustomSource extends SourceTime {
    // User-specified source function f(t) with optional start/end times
    // Must specify end_time for run functions like until_after_sources to work
    // For EigenModeSource use: must specify center_frequency parameter
    
    // Function name specifying time-dependence f(t)
    // Should take time argument and return complex number
    src_func: string; // Required - function name
    
    // Starting time for the source
    start_time?: number; // Default: -1e20 (turn on at t=-∞)
    
    // End time for the source (required for proper simulation control)
    end_time?: number; // Default: 1e20 (never turn off)
    
    // If true, source is integral of current (guaranteed zero after turn-off)
    is_integrated?: boolean; // Default: false
    
    // Center frequency for EigenModeSource compatibility
    // Required when using CustomSource within EigenModeSource
    center_frequency?: number; // Default: 0
    
    // Optional bandwidth in frequency units
    // Used for automatic decimation factor in DFT field monitors
    fwidth?: number; // Default: 0
}
