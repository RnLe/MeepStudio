/**
 * Default values for Meep simulation parameters
 */

export const SIMULATION_DEFAULTS = {
  // Scene defaults
  scene: {
    material: "Air", // Default material key from MaterialCatalog
    resolution: 10,
    rectWidth: 10,
    rectHeight: 10,
    a: 1.0,
    unit: "nm" as const,
  },
  
  // Source defaults (for future use)
  sources: {
    continuous: {
      frequency: 1.0,
      wavelength: 1.0,
    },
    gaussian: {
      frequency: 1.0,
      fwidth: 0.1,
      wavelength: 1.0,
    },
    eigenmode: {
      frequency: 1.0,
      wavelength: 1.0,
      eig_resolution: 32,
    },
  },
  
  // Boundary defaults (for future use)
  boundaries: {
    pml: {
      thickness: 1.0,
      strength: 1.0,
      power: 2.0,
      R_asymptotic: 1e-15,
    },
  },
  
  // Simulation parameters (for future use)
  simulation: {
    time_steps: 1000,
    courant: 0.5,
    force_complex_fields: false,
  },
};

export type SimulationDefaults = typeof SIMULATION_DEFAULTS;
