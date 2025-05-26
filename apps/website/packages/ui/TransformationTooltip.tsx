import React, { useRef, useEffect, useState } from "react";
import CustomLucideIcon, { CustomLucideIconProps } from "./CustomLucideIcon";
import { MathMatrix } from "./MathMatrix";

interface TransformationTooltipProps {
  title?: string;
  description?: string;
  iconSrc?: string;
  iconProps?: Omit<CustomLucideIconProps, 'src'>;
  matrix: number[][];
  matrixMode?: "2D" | "3D";
  iconSize?: number;
}

interface TooltipWrapperProps {
  children: React.ReactNode;
  tooltip: React.ReactNode;
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ children, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && wrapperRef.current && tooltipRef.current) {
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Calculate initial position (centered above the element)
      let x = wrapperRect.left + (wrapperRect.width / 2) - (tooltipRect.width / 2);
      let y = wrapperRect.top - tooltipRect.height - 8; // 8px gap
      
      // Check if tooltip goes beyond screen edges
      const padding = 10; // Padding from screen edges
      
      // Adjust horizontal position if needed
      if (x < padding) {
        x = padding;
      } else if (x + tooltipRect.width > window.innerWidth - padding) {
        x = window.innerWidth - tooltipRect.width - padding;
      }
      
      // If tooltip would go above screen, show it below instead
      if (y < padding) {
        y = wrapperRect.bottom + 8;
      }
      
      setTooltipPosition({ x, y });
    }
  }, [showTooltip]);

  return (
    <div 
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <div className="bg-neutral-800 text-white rounded-lg shadow-xl p-4 border border-neutral-700" 
               style={{ 
                 minWidth: '320px',
                 maxWidth: '400px'
               }}>
            {tooltip}
          </div>
        </div>
      )}
    </div>
  );
};

export const TransformationTooltip: React.FC<TransformationTooltipProps> = ({
  title,
  description,
  iconSrc,
  matrix,
  matrixMode = "2D",
  iconSize = 40
}) => {
  return (
    <div className="space-y-3">
      {title && (
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      )}
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
      {matrix && (
        <div className="flex items-center justify-center gap-2">
          {iconSrc && (
            <>
              <CustomLucideIcon
                src={iconSrc}
                size={iconSize}
                color="currentColor"
                className="text-gray-300 flex-shrink-0"
              />
              <span className="text-gray-300">:</span>
            </>
          )}
          <MathMatrix values={matrix} size="sm" mode={matrixMode} color="text-gray-300" />
        </div>
      )}
    </div>
  );
};
