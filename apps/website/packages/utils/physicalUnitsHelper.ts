import { LengthUnit } from "../types/meepProjectTypes";

// Speed of light in m/s
const C = 299792458;

// Conversion factors to meters
const lengthToMeters: Record<LengthUnit, number> = {
  [LengthUnit.AM]: 1e-18,
  [LengthUnit.FM]: 1e-15,
  [LengthUnit.PM]: 1e-12,
  [LengthUnit.NM]: 1e-9,
  [LengthUnit.UM]: 1e-6,
  [LengthUnit.MM]: 1e-3,
  [LengthUnit.CM]: 1e-2,
  [LengthUnit.M]: 1,
  [LengthUnit.KM]: 1e3,
};

// Unit prefixes and their scales
const prefixes = [
  { prefix: 'Y', scale: 1e24 },   // yotta
  { prefix: 'Z', scale: 1e21 },   // zetta
  { prefix: 'E', scale: 1e18 },   // exa
  { prefix: 'P', scale: 1e15 },   // peta
  { prefix: 'T', scale: 1e12 },   // tera
  { prefix: 'G', scale: 1e9 },    // giga
  { prefix: 'M', scale: 1e6 },    // mega
  { prefix: 'k', scale: 1e3 },    // kilo
  { prefix: '', scale: 1 },        // base
  { prefix: 'm', scale: 1e-3 },   // milli
  { prefix: 'μ', scale: 1e-6 },   // micro
  { prefix: 'n', scale: 1e-9 },   // nano
  { prefix: 'p', scale: 1e-12 },  // pico
  { prefix: 'f', scale: 1e-15 },  // femto
  { prefix: 'a', scale: 1e-18 },  // atto
  { prefix: 'z', scale: 1e-21 },  // zepto
  { prefix: 'y', scale: 1e-24 },  // yocto
];

/**
 * Format a number with appropriate SI prefix
 * @param value The value to format
 * @param unit The base unit (e.g., 'm', 's', 'Hz')
 * @param digits Number of significant digits (default: 3)
 * @returns Formatted string with appropriate prefix and unit
 */
function formatWithPrefix(value: number, unit: string, digits: number = 3): string {
  if (value === 0) return `0 ${unit}`;
  if (!isFinite(value)) return `∞ ${unit}`;
  
  const absValue = Math.abs(value);
  
  // Find the appropriate prefix
  let selectedPrefix = prefixes[8]; // default to base unit
  for (const prefix of prefixes) {
    if (absValue >= prefix.scale * 0.999) {
      selectedPrefix = prefix;
      break;
    }
  }
  
  // Scale the value
  const scaledValue = value / selectedPrefix.scale;
  
  // Format the number
  let formatted: string;
  if (Math.abs(scaledValue) >= 100) {
    formatted = scaledValue.toFixed(0);
  } else if (Math.abs(scaledValue) >= 10) {
    formatted = scaledValue.toFixed(1);
  } else if (Math.abs(scaledValue) >= 1) {
    formatted = scaledValue.toFixed(2);
  } else {
    formatted = scaledValue.toPrecision(digits);
  }
  
  return `${formatted} ${selectedPrefix.prefix}${unit}`;
}

/**
 * Convert scale-free length to physical units
 * @param value Scale-free value (in units of 'a')
 * @param projectA Characteristic length scale
 * @param projectUnit Unit of characteristic length
 * @returns Formatted string with physical units
 */
export function convertLength(value: number, projectA: number, projectUnit: LengthUnit): string {
  const meters = value * projectA * lengthToMeters[projectUnit];
  return formatWithPrefix(meters, 'm');
}

/**
 * Convert scale-free frequency to physical units
 * Frequency in Meep is c/a in scale-free units
 * @param value Scale-free frequency value
 * @param projectA Characteristic length scale
 * @param projectUnit Unit of characteristic length
 * @returns Formatted string with physical units
 */
export function convertFrequency(value: number, projectA: number, projectUnit: LengthUnit): string {
  const aInMeters = projectA * lengthToMeters[projectUnit];
  const hertz = value * C / aInMeters;
  return formatWithPrefix(hertz, 'Hz');
}

/**
 * Convert scale-free time to physical units
 * Time in Meep is a/c in scale-free units
 * @param value Scale-free time value
 * @param projectA Characteristic length scale
 * @param projectUnit Unit of characteristic length
 * @returns Formatted string with physical units
 */
export function convertTime(value: number, projectA: number, projectUnit: LengthUnit): string {
  const aInMeters = projectA * lengthToMeters[projectUnit];
  const seconds = value * aInMeters / C;
  return formatWithPrefix(seconds, 's');
}

/**
 * Convert scale-free wavelength to physical units
 * Wavelength = 1/frequency in scale-free units
 * @param value Scale-free wavelength value
 * @param projectA Characteristic length scale
 * @param projectUnit Unit of characteristic length
 * @returns Formatted string with physical units
 */
export function convertWavelength(value: number, projectA: number, projectUnit: LengthUnit): string {
  return convertLength(value, projectA, projectUnit);
}

/**
 * Generic converter that determines the type based on unit hint
 * @param value Scale-free value
 * @param unitHint Hint about what kind of unit ('m', 's', 'Hz', etc.)
 * @param projectA Characteristic length scale
 * @param projectUnit Unit of characteristic length
 * @returns Formatted string with physical units
 */
export function convertToPhysicalUnit(
  value: number, 
  unitHint: string, 
  projectA: number, 
  projectUnit: LengthUnit
): string {
  switch (unitHint.toLowerCase()) {
    case 'm':
    case 'meter':
    case 'length':
      return convertLength(value, projectA, projectUnit);
    case 's':
    case 'second':
    case 'time':
      return convertTime(value, projectA, projectUnit);
    case 'hz':
    case 'hertz':
    case 'frequency':
      return convertFrequency(value, projectA, projectUnit);
    case 'wavelength':
    case 'lambda':
    case 'λ':
      return convertWavelength(value, projectA, projectUnit);
    default:
      // If we don't recognize the unit, just return the value with the hint
      return `${value.toPrecision(3)} ${unitHint}`;
  }
}

/* ---------- Numeric converters (scale-free → SI) ---------- */

/** scale-free length → meters */
export function lengthToMetersSF(value: number, projectA: number, projectUnit: LengthUnit): number {
  return value * projectA * lengthToMeters[projectUnit];
}

/** scale-free frequency → hertz */
export function frequencyToHzSF(value: number, projectA: number, projectUnit: LengthUnit): number {
  const aInMeters = projectA * lengthToMeters[projectUnit];
  return value * C / aInMeters;
}

/** scale-free time → seconds */
export function timeToSecondsSF(value: number, projectA: number, projectUnit: LengthUnit): number {
  const aInMeters = projectA * lengthToMeters[projectUnit];
  return value * aInMeters / C;
}

/**
 * Convert scale-free flux measurement units to physical units
 * Flux is power (Watts) through a surface
 * In scale-free units: power = c*ε₀*|E|²*a² (for electric field flux)
 * @param value Scale-free flux weight value
 * @param projectA Characteristic length scale
 * @param projectUnit Unit of characteristic length
 * @returns Formatted string with physical units
 */
export function convertFluxWeight(value: number, projectA: number, projectUnit: LengthUnit): string {
  // In Meep scale-free units, power scales as c*a
  // But the weight is dimensionless - it's a multiplier for the flux measurement
  // So we show it as dimensionless but indicate the measurement units
  return `${value.toPrecision(3)} × W`;
}

/**
 * Convert scale-free energy measurement units to physical units
 * Energy density integrated over volume gives energy (Joules)
 * @param value Scale-free energy weight value
 * @param projectA Characteristic length scale
 * @param projectUnit Unit of characteristic length
 * @returns Formatted string with physical units
 */
export function convertEnergyWeight(value: number, projectA: number, projectUnit: LengthUnit): string {
  // Weight is dimensionless multiplier for energy measurement
  return `${value.toPrecision(3)} × J`;
}

/**
 * Convert scale-free force measurement units to physical units
 * Force from Maxwell stress tensor (Newtons)
 * @param value Scale-free force weight value
 * @param projectA Characteristic length scale
 * @param projectUnit Unit of characteristic length
 * @returns Formatted string with physical units
 */
export function convertForceWeight(value: number, projectA: number, projectUnit: LengthUnit): string {
  // Weight is dimensionless multiplier for force measurement
  return `${value.toPrecision(3)} × N`;
}

/**
 * Get the appropriate unit conversion for a region type
 * @param regionType Type of region ('flux', 'energy', 'force')
 * @param value Scale-free weight value
 * @param projectA Characteristic length scale
 * @param projectUnit Unit of characteristic length
 * @returns Formatted string with appropriate physical units
 */
export function convertRegionWeight(
  regionType: string,
  value: number, 
  projectA: number, 
  projectUnit: LengthUnit
): string {
  switch (regionType) {
    case 'flux':
      return convertFluxWeight(value, projectA, projectUnit);
    case 'energy':
      return convertEnergyWeight(value, projectA, projectUnit);
    case 'force':
      return convertForceWeight(value, projectA, projectUnit);
    default:
      return convertFluxWeight(value, projectA, projectUnit);
  }
}
