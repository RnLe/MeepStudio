import React, { useEffect, useState } from "react";

export interface CustomLucideIconProps extends React.SVGProps<SVGSVGElement> {
  src: string; // Path to the SVG file (relative to public/)
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  className?: string;
}

const CustomLucideIcon: React.FC<CustomLucideIconProps> = ({
  src,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  ...rest
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    fetch(src)
      .then((res) => res.text())
      .then((text) => {
        // Remove any hardcoded stroke colors and replace with currentColor
        const cleanedText = text
          .replace(/stroke="[^"]*"/g, '')
          .replace(/stroke='[^']*'/g, '')
          .replace(/fill="[^"]*"/g, 'fill="none"')
          .replace(/fill='[^']*'/g, "fill='none'");
        setSvgContent(cleanedText);
      })
      .catch(() => setSvgContent(null));
  }, [src]);

  if (!svgContent) return null;

  // Remove outer <svg> and inject Lucide props
  const inner = svgContent.replace(/^[\s\S]*?<svg[\s\S]*?>/i, "").replace(/<\/svg>[\s\S]*$/i, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
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
