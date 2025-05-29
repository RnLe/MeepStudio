import { SourceComponent } from "../types/meepSourceTypes";
import { Vector3 } from "../types/meepBaseTypes";

// Base source defaults (common to all sources)
export const BASE_SOURCE_DEFAULTS = {
  component: SourceComponent.Ez,
  center: { x: 0, y: 0, z: 0 } as Vector3,
  size: { x: 0, y: 0, z: 0 } as Vector3,
  amplitude: { real: 1, imag: 0 },
  is_integrated: false,
} as const;

// ContinuousSource specific defaults
export const CONTINUOUS_SOURCE_DEFAULTS = {
  frequency: 1,
  start_time: 0,
  end_time: 1e20,
  width: 0,
  slowness: 3.0,
  is_integrated: false,
} as const;

// GaussianSource specific defaults
export const GAUSSIAN_SOURCE_DEFAULTS = {
  frequency: 1,
  width: 1,
  start_time: 0,
  cutoff: 5.0,
  is_integrated: false,
} as const;

// EigenModeSource specific defaults
export const EIGENMODE_SOURCE_DEFAULTS = {
  eig_band: 1,
  direction: "AUTOMATIC",
  eig_match_freq: true,
  eig_kpoint: { x: 0, y: 0, z: 0 } as Vector3,
  eig_parity: "NO_PARITY",
  eig_tolerance: 1e-12,
  component: SourceComponent.ALL_COMPONENTS,
} as const;

// CustomSource specific defaults
export const CUSTOM_SOURCE_DEFAULTS = {
  start_time: -1e20,
  end_time: 1e20,
  is_integrated: false,
  center_frequency: 0,
  fwidth: 0,
} as const;

// Special values
export const INFINITY_TIME = 1e20;
export const NEGATIVE_INFINITY_TIME = -1e20;
export const INFINITY_THRESHOLD = 1e19;

// Helper function to check if a value should be treated as infinity
export const isInfinityTime = (value: number): boolean => {
  return value >= INFINITY_THRESHOLD;
};

// Type definitions for merged defaults - using Omit to avoid conflicts
type BaseDefaults = typeof BASE_SOURCE_DEFAULTS & { pos: Vector3 };

export type ContinuousSourceDefaults = Omit<BaseDefaults, 'component'> & 
  typeof CONTINUOUS_SOURCE_DEFAULTS & { 
    component: SourceComponent.Ex;
  };

export type GaussianSourceDefaults = Omit<BaseDefaults, 'component'> & 
  typeof GAUSSIAN_SOURCE_DEFAULTS & { 
    component: SourceComponent.Ez;
  };

export type CustomSourceDefaults = BaseDefaults & typeof CUSTOM_SOURCE_DEFAULTS;

export type EigenModeSourceDefaults = Omit<BaseDefaults, 'component'> & 
  typeof EIGENMODE_SOURCE_DEFAULTS;

// Overloaded function signatures for type safety
export function getSourceDefaults(sourceType: 'continuous'): ContinuousSourceDefaults;
export function getSourceDefaults(sourceType: 'gaussian'): GaussianSourceDefaults;
export function getSourceDefaults(sourceType: 'custom'): CustomSourceDefaults;
export function getSourceDefaults(sourceType: 'eigenmode'): EigenModeSourceDefaults;

// Implementation
export function getSourceDefaults(sourceType: 'continuous' | 'gaussian' | 'custom' | 'eigenmode') {
  const baseDefaults = {
    ...BASE_SOURCE_DEFAULTS,
    pos: BASE_SOURCE_DEFAULTS.center, // Using pos instead of center in UI
  };

  switch (sourceType) {
    case 'continuous':
      return {
        ...baseDefaults,
        component: SourceComponent.Ex as SourceComponent.Ex, // ContinuousSource typically uses Ex
        ...CONTINUOUS_SOURCE_DEFAULTS,
      };
    case 'gaussian':
      return {
        ...baseDefaults,
        component: SourceComponent.Ez as SourceComponent.Ez, // GaussianSource typically uses Ez
        ...GAUSSIAN_SOURCE_DEFAULTS,
      };
    case 'custom':
      return {
        ...baseDefaults,
        ...CUSTOM_SOURCE_DEFAULTS,
      };
    case 'eigenmode':
      return {
        ...baseDefaults,
        ...EIGENMODE_SOURCE_DEFAULTS,
      };
  }
}
