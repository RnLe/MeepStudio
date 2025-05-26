import React from "react";
import CustomLucideIcon, { CustomLucideIconProps } from "./CustomLucideIcon";
import { MathMatrix } from "./MathMatrix";

interface TransformationTooltipProps {
  title: string;
  description: string;
  iconSrc: string;
  iconProps?: Omit<CustomLucideIconProps, 'src'>;
  matrix: number[][];
  matrixMode?: "2D" | "3D";
}

export const TransformationTooltip: React.FC<TransformationTooltipProps> = ({
  title,
  description,
  iconSrc,
  iconProps = {},
  matrix,
  matrixMode = "2D"
}) => {
  return (
    <div className="bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px]">
      {/* Title */}
      <h3 className="text-base font-semibold text-white">{title}</h3>
      
      {/* Description */}
      <p className="text-sm text-gray-400 mt-1 mb-3">{description}</p>
      
      {/* Icon and Matrix */}
      <div className="flex items-center gap-2">
        <CustomLucideIcon 
          src={iconSrc} 
          size={24} 
          color="currentColor"
          className="text-blue-400 flex-shrink-0"
          {...iconProps}
        />
        <span className="text-white">:</span>
        <div className="flex-1 flex justify-center">
          <MathMatrix 
            values={matrix} 
            color="text-gray-200" 
            size="sm" 
            mode={matrixMode}
          />
        </div>
      </div>
    </div>
  );
};

// Wrapper component for hover functionality
interface TooltipWrapperProps {
  children: React.ReactNode;
  tooltip: React.ReactNode;
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ children, tooltip }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
    setIsVisible(true);
  };
  
  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  
  return (
    <div 
      ref={wrapperRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%) translateY(-8px)'
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
};
