/**
 * Color utility functions for generating high-contrast, visually pleasing border colors
 */

// Convert hex or rgba to RGB values
export function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1
      };
    }
  } else if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16),
      a: 1
    };
  }
  return { r: 128, g: 128, b: 128, a: 1 }; // fallback gray
}

// Calculate relative luminance using WCAG formula
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio between two colors
export function getContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Generate a selection border color with good contrast against both fill and canvas
 * @param fillColor - The fill color of the geometry (hex or rgba string)
 * @param canvasColor - The canvas background color (defaults to #d4d4d4)
 * @param minContrast - Minimum contrast ratio (WCAG AA is 4.5, we use 3 for more flexibility)
 * @returns Border color as rgba string
 */
export function getSelectionBorderColor(
  fillColor: string,
  canvasColor: string = "#d4d4d4",
  minContrast: number = 3
): string {
  const fill   = parseColor(fillColor);
  const canvas = parseColor(canvasColor);
  
  // Convert fill color to HSL
  const fillHsl = rgbToHsl(fill.r, fill.g, fill.b);
  
  // --- choose starting lightness -------------------------------------------------
  const fillLum = getLuminance(fill.r, fill.g, fill.b);
  let targetL = fillLum > 0.5 ? 20               // light fill  → dark border
               : fillLum < 0.1 ? 70              // very dark fill → mid-light (not white)
               : fillHsl.l > 50 ? 25 : 75;       // medium fill  → opposite side

  // --- keep saturation low to avoid neon (≤ 40 %) --------------------------------
  let targetS = Math.min(fillHsl.s * 0.4, 40);
  let targetH = fillHsl.h;
  if (fillHsl.s > 70) {
    targetH = (targetH + 180) % 360; // complementary hue
    targetS = 30;
  }

  // --- iterative contrast adjustment ---------------------------------------------
  let result = hslToRgb(targetH, targetS, targetL);
  for (let i = 0; i < 12; i++) {
    const c1 = getContrastRatio(fill,   result);
    const c2 = getContrastRatio(canvas, result);

    // success: good contrast to BOTH fill and canvas
    if (c1 >= minContrast && c2 >= minContrast) break;

    // Make darker if border is too close to canvas (canvas is light) or too light overall
    if (c2 < minContrast || targetL > 70) {
      targetL = Math.max(0, targetL - 10);
    } else {
      // Otherwise make it lighter
      targetL = Math.min(70, targetL + 10);
    }

    // never allow a border lighter than canvas (~#d4d4d4)
    if (targetL > 70) targetL = 70;

    result = hslToRgb(targetH, targetS, targetL);
  }

  return `rgb(${result.r}, ${result.g}, ${result.b})`;
}

/**
 * Get stroke width based on scale, with minimum visibility
 */
export function getSelectionStrokeWidth(scale: number, selected: boolean): number {
  if (!selected) return 0;
  
  // Ensure minimum visible width
  const baseWidth = 2;
  const scaledWidth = baseWidth / scale;
  const minWidth = 0.5 / scale;
  
  return Math.max(scaledWidth, minWidth);
}
