// meep-material-presets.ts
// Pure TypeScript definitions of common FDTD materials for Meep,
// conforming to the provided Medium interface (./meepBaseTypes.ts).

import { Medium } from "../types/meepMediumTypes";

export const Air: Medium = {
  index: 1.000293,  // Accurate refractive index of air at 20°C, 1 atm, 589 nm
  abbreviation: "Air",
  hint: "Standard atmospheric air at room temperature (20°C, 1 atm). Refractive index n = 1.000293 at 589 nm.",
  color: "#87ceeb", // Changed from #e3f2fd to a more visible sky blue
  category: "Basic"
};

export const Vacuum: Medium = {
  index: 1.0,
  abbreviation: "Vac",
  hint: "Perfect vacuum with n=1. Reference medium for all optical calculations.",
  color: "#f5f5f5",
  category: "Basic"
};

/* ─────  SEMICONDUCTORS & DIELECTRICS  ───── */

// Silicon (Si) @ 1.55 µm, n ≈ 3.48
export const Silicon: Medium = {
  index: 3.48,
  abbreviation: "Si",
  hint: "Crystalline silicon at 1.55 µm. Standard material for photonic integrated circuits.",
  color: "#424242",
  category: "Semiconductors"
};

// Germanium (Ge) @ 1.55 µm, n ≈ 4.00
export const Germanium: Medium = {
  index: 4.00,
  abbreviation: "Ge",
  hint: "High refractive index semiconductor, transparent in mid-IR range.",
  color: "#616161",
  category: "Semiconductors"
};

// Gallium Arsenide (GaAs) @ 1.55 µm, n ≈ 3.40
export const GalliumArsenide: Medium = {
  index: 3.40,
  abbreviation: "GaAs",
  hint: "III-V semiconductor with direct bandgap. Used in lasers and high-speed electronics.",
  color: "#7e57c2",
  category: "Semiconductors"
};

// Indium Phosphide (InP) @ 1.55 µm, n ≈ 3.17
export const IndiumPhosphide: Medium = {
  index: 3.17,
  abbreviation: "InP",
  hint: "III-V semiconductor platform for telecom wavelength photonics and lasers.",
  color: "#5e35b1",
  category: "Semiconductors"
};

// Gallium Nitride (GaN) @ 1.55 µm, n ≈ 2.31
export const GalliumNitride: Medium = {
  index: 2.31,
  abbreviation: "GaN",
  hint: "Wide bandgap semiconductor for blue LEDs and high-power electronics.",
  color: "#1e88e5",
  category: "Semiconductors"
};

// Silicon Carbide (4H-SiC) @ 1.55 µm, n ≈ 2.55
export const SiliconCarbide: Medium = {
  index: 2.55,
  abbreviation: "SiC",
  hint: "Wide bandgap semiconductor with excellent thermal properties.",
  color: "#546e7a",
  category: "Semiconductors"
};

// Fused Silica (SiO₂) @ 1.55 µm, n ≈ 1.444
export const Silica: Medium = {
  index: 1.444,
  abbreviation: "SiO₂",
  hint: "Glass/fused silica. Low-loss dielectric for waveguide cladding and substrates.",
  color: "#e0e0e0",
  category: "Semiconductors"
};

// Alumina (Al₂O₃) @ 1.55 µm, n ≈ 1.76
export const Alumina: Medium = {
  index: 1.76,
  abbreviation: "Al₂O₃",
  hint: "Aluminum oxide ceramic. Hard, chemically inert dielectric material.",
  color: "#f5f5f5",
  category: "Semiconductors"
};

// Indium Tin Oxide (ITO), transparent conductor: moderately lossy in the NIR.
export const ITO: Medium = {
  index: 1.9,
  D_conductivity: 1.0e5,
  abbreviation: "ITO",
  hint: "Transparent conductor with finite conductivity. Lossy at infrared wavelengths.",
  color: "#b0bec5",
  category: "Semiconductors"
};

/* ─────  NONLINEAR / PHOTONIC PLATFORMS  ───── */

// Lithium Niobate (LiNbO₃), extraordinary axis @ 1.55 µm, nₑ ≈ 2.14
export const LithiumNiobate: Medium = {
  index: 2.14,
  chi2: 4.5e-12,
  abbreviation: "LN",
  hint: "Ferroelectric crystal with strong χ⁽²⁾ nonlinearity. Used for modulators and frequency conversion.",
  color: "#ff7043",
  category: "Non-Linear Photonics"
};

// Silicon Nitride (Si₃N₄) @ 1.55 µm, n ≈ 2.05
export const SiliconNitride: Medium = {
  index: 2.05,
  abbreviation: "Si₃N₄",
  hint: "Low-loss dielectric for visible and near-IR integrated photonics.",
  color: "#4a148c",
  category: "Non-Linear Photonics"
};

// Titanium Dioxide (TiO₂, anatase) @ 1.55 µm, n ≈ 2.40
export const TitaniumDioxide: Medium = {
  index: 2.40,
  abbreviation: "TiO₂",
  hint: "High-index dielectric, photocatalyst. Used in thin-film optics.",
  color: "#fafafa",
  category: "Non-Linear Photonics"
};

// BCB polymer (e.g. Cyclotene) @ 1.55 µm, n ≈ 1.535, Kerr χ^(3) ~1×10⁻²⁰ m²/V²
export const BCB: Medium = {
  index: 1.535,
  chi3: 1.0e-20,
  abbreviation: "BCB",
  hint: "Benzocyclobutene polymer. Low-k dielectric with weak Kerr nonlinearity.",
  color: "#ffd54f",
  category: "Non-Linear Photonics"
};

/* ─────  PLASMONIC METALS (Drude fits)  ───── */

// Gold (Au):
export const Gold: Medium = {
  epsilon: 1.0,
  E_susceptibilities: [
    "DrudeSusceptibility(frequency=0, gamma=0.042747, sigma=-53.04497)"
  ],
  abbreviation: "Au",
  hint: "Noble metal with plasmonic response. Drude model fit for optical frequencies.",
  color: "#ffd700",
  category: "Plasmonic Metals"
};

// Silver (Ag):
export const Silver: Medium = {
  epsilon: 1.0,
  E_susceptibilities: [
    "DrudeSusceptibility(frequency=0, gamma=0.0169377, sigma=-52.81026)"
  ],
  abbreviation: "Ag",
  hint: "Best plasmonic metal with lowest losses in visible range. Drude model fit.",
  color: "#c0c0c0",
  category: "Plasmonic Metals"
};

// Aluminium (Al):
export const Aluminium: Medium = {
  epsilon: 1.0,
  E_susceptibilities: [
    "DrudeSusceptibility(frequency=0, gamma=0.120983, sigma=-146.3697)"
  ],
  abbreviation: "Al",
  hint: "Abundant metal with UV plasmonic response. Higher losses than Au/Ag in visible.",
  color: "#b0bec5",
  category: "Plasmonic Metals"
};

/* ─────  COLLECTION OF ALL PRESETS ───── */
export const MaterialCatalog = {
  // Basic materials
  Air,
  Vacuum,
  
  // Semiconductors & dielectrics
  Silicon,
  Germanium,
  GalliumArsenide,
  IndiumPhosphide,
  GalliumNitride,
  SiliconCarbide,
  Silica,
  Alumina,
  ITO,

  // Nonlinear / photonic platforms
  LithiumNiobate,
  SiliconNitride,
  TitaniumDioxide,
  BCB,

  // Plasmonic metals
  Gold,
  Silver,
  Aluminium
};
