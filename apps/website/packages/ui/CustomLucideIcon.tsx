import React, { useEffect, useState } from "react";

export interface CustomLucideIconProps extends React.SVGProps<SVGSVGElement> {
  src: string; // Path to the SVG file (relative to public/)
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  className?: string;
}

// Helper function to get the correct asset path with base path support
const getAssetPath = (src: string): string => {
  // Get the base path from the Next.js configuration
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.__NEXT_ROUTER_BASEPATH || '';
  
  // If src already starts with the base path, return as-is
  if (basePath && src.startsWith(basePath)) {
    return src;
  }
  
  // Add base path if it exists
  return basePath ? `${basePath}${src}` : src;
};

const CustomLucideIcon: React.FC<CustomLucideIconProps> = ({
  src,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  ...rest
}) => {
  const [svgInfo, setSvgInfo] = useState<{ inner: string; viewBox: string; w: number; h: number } | null>(null);

  useEffect(() => {
    const fullPath = getAssetPath(src);
    fetch(fullPath)
      .then((res) => res.text())
      .then((text) => {
        /* Extract original viewBox so the glyphs are not cropped.
           MathJax SVGs often have negative coordinates which we must keep. */
        const viewBoxMatch =
          text.match(/viewBox="([^"]+)"/i) || text.match(/viewBox='([^']+)'/i);
        const originalViewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";

        const viewBoxParts = originalViewBox.split(/\s+/).map(Number);
        const [, , w, h] = viewBoxParts.length === 4 ? viewBoxParts : [0, 0, 24, 24];

        // Strip any hard-coded stroke colors, keep fills and map non-none fills to currentColor.
        const cleanedText = text
          .replace(/stroke="[^"]*"/gi, "")
          .replace(/stroke='[^']*'/gi, "")
          // Only replace fill colors that are actual color values (not none, currentColor, or inherit)
          .replace(/fill="(#[0-9a-fA-F]{3,6}|rgb[^"]*|[a-z]+)"/gi, (match, color) => {
            // Preserve special values
            if (color === 'none' || color === 'currentColor' || color === 'inherit') {
              return match;
            }
            // Replace actual colors with currentColor
            return 'fill="currentColor"';
          })
          .replace(/fill='(#[0-9a-fA-F]{3,6}|rgb[^']*|[a-z]+)'/gi, (match, color) => {
            // Preserve special values
            if (color === 'none' || color === 'currentColor' || color === 'inherit') {
              return match;
            }
            // Replace actual colors with currentColor
            return "fill='currentColor'";
          });

        // Remove outer <svg> element
        const inner = cleanedText
          .replace(/^[\s\S]*?<svg[\s\S]*?>/i, "")
          .replace(/<\/svg>[\s\S]*$/i, "");

        setSvgInfo({ inner, viewBox: originalViewBox, w, h });
      })
      .catch(() => setSvgInfo(null));
  }, [src]);

  if (!svgInfo) return null;
  const { inner, viewBox, w, h } = svgInfo;
  const scale = typeof size === "number" ? Number(size) : parseFloat(String(size));
  const longer = Math.max(w, h) || 24;
  const width  = (w / longer) * scale;
  const height = (h / longer) * scale;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-custom-icon ${className}`}
      dangerouslySetInnerHTML={{ __html: inner }}
      {...rest}
    />
  );
};

export default CustomLucideIcon;
