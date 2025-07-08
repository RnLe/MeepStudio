"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { RotateCcw, Infinity as InfinityIcon } from "lucide-react";

export type DialMode = "linear" | "10x";
export type ResetIconType = "reset" | "infinity";

interface DialProps {
  value: number;
  onChange: (value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  mode?: DialMode;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  label?: string;
  className?: string;
  allowModeSwitching?: boolean;
  defaultValue?: number;
  resetIcon?: ResetIconType;
  disabled?: boolean;
}

export const Dial: React.FC<DialProps> = ({
  value,
  onChange,
  onDragStart,
  onDragEnd,
  mode: initialMode = "linear",
  min = 1e-6,
  max = Infinity,
  step = 1e-8,
  size = 40,
  label,
  className = "",
  allowModeSwitching = true,
  defaultValue,
  resetIcon = "reset",
  disabled = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastAngle, setLastAngle] = useState(0);
  const [accumulatedRotation, setAccumulatedRotation] = useState(0);
  const [mode, setMode] = useState<DialMode>(initialMode);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showResetButton, setShowResetButton] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const lastClickTime = useRef<number>(0);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Internal minimum to avoid precision issues, but preserve negative ranges for linear mode only
  const internalMin = React.useMemo(() => 
    mode === "linear" ? (min < 0 ? min : Math.max(min, 1e-10)) : Math.max(min, 1e-10),
    [mode, min]
  );
  const effectiveStep = Math.max(step, 1e-10);

  // Check if value differs from default
  useEffect(() => {
    if (defaultValue !== undefined && Math.abs(value - defaultValue) > 1e-10) {
      setShowResetButton(true);
    } else {
      setShowResetButton(false);
    }
  }, [value, defaultValue]);

  // Keep edit value in sync with actual value when editing
  useEffect(() => {
    if (isEditing) {
      setEditValue(formatForEdit(value));
    }
  }, [value, isEditing]);

  // Convert value to total rotation (in radians)
  const valueToRotation = useCallback((val: number): number => {
    const clampedVal = Math.max(internalMin, Math.min(max, val));
    if (mode === "linear") {
      // In linear mode, value directly maps to rotations
      return clampedVal * 2 * Math.PI;
    } else {
      // 10x mode - exponential scaling, no sign switching
      if (clampedVal >= 1e19) {
        // For values near infinity, map to a high rotation value
        return 19 * 2 * Math.PI;
      }
      if (clampedVal <= 0) {
        // In exponential mode, never go to 0 or negative
        return Math.log10(Math.max(effectiveStep, 1e-10)) * 2 * Math.PI;
      }
      // Use log10 for exponential scaling
      const logVal = Math.log10(clampedVal);
      return logVal * 2 * Math.PI;
    }
  }, [mode, internalMin, max, effectiveStep]);

  // Convert total rotation to value
  const rotationToValue = useCallback((rotation: number): number => {
    if (mode === "linear") {
      // In linear mode, rotations directly map to value
      const val = rotation / (2 * Math.PI);
      return Math.max(internalMin, Math.min(max, val));
    } else {
      // 10x mode - exponential scaling, no sign switching
      const revolutions = rotation / (2 * Math.PI);
      if (revolutions >= 19) {
        // Near max rotation, return very large value
        return Math.min(max, 1e20);
      }
      
      // Convert log value back to actual value
      const val = Math.pow(10, revolutions);
      // Ensure we stay within bounds and never go below the effective step
      return Math.max(Math.max(effectiveStep, 1e-10), Math.min(max, val));
    }
  }, [mode, internalMin, max, effectiveStep]);

  // Initialize accumulated rotation from current value
  useEffect(() => {
    setAccumulatedRotation(valueToRotation(value));
  }, [value, valueToRotation]);

  // Get mouse angle relative to center (0 at top, increasing clockwise)
  const getMouseAngle = (e: MouseEvent | React.MouseEvent): number => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    // atan2 returns angle with 0 at right, we want 0 at top
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    // Normalize to [0, 2π]
    if (angle < 0) angle += 2 * Math.PI;
    return angle;
  };

  // Format number for input field with intelligent rounding
  const formatForEdit = (val: number): string => {
    // Handle very small numbers
    if (val < 0.001) {
      return val.toPrecision(4);
    }
    // Handle normal range
    else if (val < 1000) {
      // Round to remove floating point errors
      const rounded = Math.round(val * 1000) / 1000;
      return rounded.toString();
    }
    // Handle large numbers
    else {
      return val.toPrecision(4);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;
    
    if (timeSinceLastClick < 300) {
      // Double click - start editing
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(formatForEdit(value));
    } else if (!hasDragged.current && allowModeSwitching) {
      // Single click - toggle mode only if we didn't drag and mode switching is allowed
      setMode(prev => prev === "linear" ? "10x" : "linear");
    }
    
    lastClickTime.current = now;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing || disabled) return;
    e.preventDefault();
    setIsDragging(true);
    onDragStart?.(); // Notify parent that drag started
    hasDragged.current = false;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    const mouseAngle = getMouseAngle(e);
    setLastAngle(mouseAngle);
    // Initialize accumulated rotation from current value
    const currentRotation = valueToRotation(value);
    setAccumulatedRotation(currentRotation);
  };

  const handleInputSubmit = () => {
    const newValue = parseFloat(editValue);
    const effectiveMin = mode === "10x" ? Math.max(effectiveStep, 1e-10) : internalMin;
    if (!isNaN(newValue) && newValue >= effectiveMin && newValue <= max) {
      onChange(newValue);
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation of all key events to prevent parent components
    // from handling them (e.g., global delete shortcuts)
    e.stopPropagation();
    
    if (e.key === 'Enter') {
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
    // Allow all other keys (including Backspace) to work normally in the input
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (defaultValue !== undefined) {
      onChange(defaultValue);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Check if mouse has moved significantly
      if (mouseDownPos.current) {
        const dx = e.clientX - mouseDownPos.current.x;
        const dy = e.clientY - mouseDownPos.current.y;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          hasDragged.current = true;
        }
      }

      const currentAngle = getMouseAngle(e);
      let angleDiff = currentAngle - lastAngle;

      // Handle wrapping: if angle difference is too large, we wrapped around
      if (angleDiff > Math.PI) {
        angleDiff -= 2 * Math.PI;
      } else if (angleDiff < -Math.PI) {
        angleDiff += 2 * Math.PI;
      }

      // Update accumulated rotation
      const newRotation = accumulatedRotation + angleDiff;
      setAccumulatedRotation(newRotation);
      setLastAngle(currentAngle);

      // Convert to value and emit change
      const newValue = rotationToValue(newRotation);
      const snappedValue = Math.round(newValue / effectiveStep) * effectiveStep;
      onChange(snappedValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.(); // Notify parent that drag ended
      mouseDownPos.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, lastAngle, accumulatedRotation, rotationToValue, onChange, effectiveStep]);

  // Format value for display
  const formatValue = (val: number): string => {
    if (val >= 1e19) {
      return "∞";
    } else if (val <= -1e19) {
      return "-∞";
    } else if (Math.abs(val) >= 0.1) {
      if (Math.abs(val) >= 1000) {
        return val.toExponential(1).replace(/e\+?/, 'e');
      }
      return val.toFixed(3);
    } else if (val !== 0) {
      // Scientific notation for small values (positive or negative)
      const exponent = Math.floor(Math.log10(Math.abs(val)));
      const mantissa = val / Math.pow(10, exponent);
      
      if (exponent % 3 === 0) {
        return `${mantissa.toFixed(1)}e${exponent}`;
      }
      // Adjust to nearest multiple of 3
      const adjustedExp = Math.floor(exponent / 3) * 3;
      const adjustedMantissa = val / Math.pow(10, adjustedExp);
      return `${adjustedMantissa.toFixed(1)}e${adjustedExp}`;
    }
    // In exponential mode, never show 0
    if (mode === "10x") {
      const minValue = Math.max(effectiveStep, 1e-10);
      return formatValue(minValue);
    }
    return "0";
  };

  // Calculate visual rotation angle (0-360 degrees), normalized to single rotation
  const totalRotation = valueToRotation(value);
  const visualAngle = ((totalRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const visualAngleDegrees = visualAngle * (180 / Math.PI);

  const radius = size / 2;
  const strokeWidth = 2;
  const innerRadius = radius - strokeWidth * 2;
  
  // Colors based on mode
  const indicatorColor = mode === "linear" ? "#60a5fa" : "#fab560";
  const modeTooltip = allowModeSwitching 
    ? (mode === "linear" ? "Linear ×1 (click to switch)" : "Exponential ×10 (click to switch)")
    : (mode === "linear" ? "Linear ×1" : "Exponential ×10");

  // Get icon component
  const ResetIcon = resetIcon === "infinity" ? InfinityIcon : RotateCcw;

  return (
    <div 
      className={`flex flex-col items-center gap-1 dial-container prevent-scroll ${className} ${value === 0 ? 'opacity-50' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`} 
      ref={containerRef}
      data-prevents-scroll="true"
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onWheel={(e) => {
        if (disabled) return;
        
        // Prevent wheel events from bubbling to parent scrollable containers
        e.stopPropagation();
        e.preventDefault();
        
        // Calculate step based on mode and current value
        let wheelStep = effectiveStep;
        if (mode === "linear") {
          // For linear mode, use a more reasonable step size
          // If current step is very small, increase it for wheel scrolling
          wheelStep = Math.max(effectiveStep, 0.1);
          
          // For larger values, scale the step appropriately
          if (value >= 10) {
            wheelStep = Math.max(wheelStep, 1);
          } else if (value >= 1) {
            wheelStep = Math.max(wheelStep, 0.1);
          }
        } else if (mode === "10x") {
          // For 10x mode, use logarithmic stepping - multiply/divide by factor
          wheelStep = Math.max(value * 0.1, value / 10);
        }
        
        // Calculate new value
        let newValue = value;
        if (e.deltaY < 0) {
          if (mode === "10x") {
            // In exponential mode, multiply by a factor
            newValue = Math.min(max, value * 1.1);
          } else {
            newValue = Math.min(max, value + wheelStep);
          }
        } else if (e.deltaY > 0) {
          if (mode === "10x") {
            // In exponential mode, divide by a factor, but don't go below minimum
            const minExpValue = Math.max(effectiveStep, 1e-10);
            newValue = Math.max(minExpValue, value / 1.1);
          } else {
            newValue = Math.max(internalMin, value - wheelStep);
          }
        }
        
        // Snap to step (only for linear mode)
        const finalValue = mode === "linear" ? Math.round(newValue / effectiveStep) * effectiveStep : newValue;
        
        onChange(finalValue);
      }}
    >
      <div className="relative">
        <svg
          ref={svgRef}
          width={size}
          height={size}
          className={`select-none ${disabled ? 'cursor-not-allowed' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
          onMouseDown={disabled ? undefined : handleMouseDown}
          onClick={disabled ? undefined : handleClick}
        >
          <title>{disabled ? "Disabled" : modeTooltip}</title>
          {/* Background circle */}
          <circle
            cx={radius}
            cy={radius}
            r={innerRadius}
            fill={disabled ? "#1a1a1a" : "#262626"}
            stroke={disabled ? "#2a2a2a" : "#404040"}
            strokeWidth={strokeWidth}
          />
          
          {/* Mode indicator arc */}
          {mode === "10x" && !disabled && (
            <circle
              cx={radius}
              cy={radius}
              r={innerRadius - 4}
              fill="none"
              stroke="#4a4a4a"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}
          
          {/* Value indicator line */}
          <g transform={`rotate(${visualAngleDegrees} ${radius} ${radius})`}>
            <line
              x1={radius}
              y1={strokeWidth + 2}
              x2={radius}
              y2={radius - 2}
              stroke={disabled ? "#4a4a4a" : indicatorColor}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
          
          {/* Center dot */}
          <circle
            cx={radius}
            cy={radius}
            r={2}
            fill={disabled ? "#333" : "#666"}
          />
        </svg>
        
        {/* Reset button - positioned at top right */}
        {showResetButton && defaultValue !== undefined && isHovered && !disabled && (
          <button
            onClick={handleReset}
            className="absolute -top-1 -right-1 p-0.5 rounded-full flex items-center justify-center transition-colors group"
            title={resetIcon === "infinity" ? "Set to infinity" : "Reset to default"}
          >
            <ResetIcon size={10} className="text-gray-500 group-hover:text-white transition-colors" />
          </button>
        )}
        
        {/* Manual input overlay */}
        {isEditing && !disabled && (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleInputSubmit}
            onKeyDown={handleInputKeyDown}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag initiation
            onClick={(e) => e.stopPropagation()} // Prevent parent click handlers
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-[80px] px-2 py-1 text-center text-xs bg-neutral-800 border border-gray-600 rounded text-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none z-10"
            style={{ width: `${Math.max(80, editValue.length * 8 + 24)}px` }}
            autoFocus
            step="any"
          />
        )}
      </div>
      
      {/* Value display */}
      <div className={`text-xs font-mono min-w-[50px] text-center ${disabled ? 'text-gray-600' : 'text-gray-300'}`}>
        {formatValue(value)}
      </div>
      
      {/* Label */}
      {label && (
        <div className={`text-[9px] ${disabled ? 'text-gray-600' : 'text-gray-500'}`}>
          {label}
        </div>
      )}
    </div>
  );
};
