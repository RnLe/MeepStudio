import { LengthUnit } from "./meepProjectTypes";

export enum FrequencyUnit {
  HZ = "Hz",
  KHZ = "kHz",
  MHZ = "MHz",
  GHZ = "GHz",
  THZ = "THz",
  PHZ = "PHz",
  EHZ = "EHz",
}

export enum TimeUnit {
  AS = "as",  // attoseconds
  FS = "fs",  // femtoseconds
  PS = "ps",  // picoseconds
  NS = "ns",  // nanoseconds
  US = "μs",  // microseconds
  MS = "ms",  // milliseconds
  S = "s",    // seconds
}

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

// Get appropriate frequency unit based on length unit
export function getFrequencyUnit(lengthUnit: LengthUnit): FrequencyUnit {
  const meterScale = lengthToMeters[lengthUnit];
  const freqScale = C / meterScale;
  
  if (freqScale >= 1e18) return FrequencyUnit.EHZ;
  if (freqScale >= 1e15) return FrequencyUnit.PHZ;
  if (freqScale >= 1e12) return FrequencyUnit.THZ;
  if (freqScale >= 1e9) return FrequencyUnit.GHZ;
  if (freqScale >= 1e6) return FrequencyUnit.MHZ;
  if (freqScale >= 1e3) return FrequencyUnit.KHZ;
  return FrequencyUnit.HZ;
}

// Get appropriate time unit based on length unit
export function getTimeUnit(lengthUnit: LengthUnit): TimeUnit {
  const meterScale = lengthToMeters[lengthUnit];
  const timeScale = meterScale / C;
  
  if (timeScale <= 1e-18) return TimeUnit.AS;
  if (timeScale <= 1e-15) return TimeUnit.FS;
  if (timeScale <= 1e-12) return TimeUnit.PS;
  if (timeScale <= 1e-9) return TimeUnit.NS;
  if (timeScale <= 1e-6) return TimeUnit.US;
  if (timeScale <= 1e-3) return TimeUnit.MS;
  return TimeUnit.S;
}

// Convert frequency value based on units
export function convertFrequency(value: number, fromUnit: LengthUnit, toUnit: FrequencyUnit): number {
  const meterScale = lengthToMeters[fromUnit];
  const baseFreq = value * C / meterScale;
  
  const unitScale: Record<FrequencyUnit, number> = {
    [FrequencyUnit.HZ]: 1,
    [FrequencyUnit.KHZ]: 1e-3,
    [FrequencyUnit.MHZ]: 1e-6,
    [FrequencyUnit.GHZ]: 1e-9,
    [FrequencyUnit.THZ]: 1e-12,
    [FrequencyUnit.PHZ]: 1e-15,
    [FrequencyUnit.EHZ]: 1e-18,
  };
  
  return baseFreq * unitScale[toUnit];
}

// Convert time value based on units
export function convertTime(value: number, fromUnit: LengthUnit, toUnit: TimeUnit): number {
  const meterScale = lengthToMeters[fromUnit];
  const baseTime = value * meterScale / C;
  
  const unitScale: Record<TimeUnit, number> = {
    [TimeUnit.S]: 1,
    [TimeUnit.MS]: 1e3,
    [TimeUnit.US]: 1e6,
    [TimeUnit.NS]: 1e9,
    [TimeUnit.PS]: 1e12,
    [TimeUnit.FS]: 1e15,
    [TimeUnit.AS]: 1e18,
  };
  
  return baseTime * unitScale[toUnit];
}
