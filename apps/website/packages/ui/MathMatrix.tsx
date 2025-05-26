import React from "react";

interface MathMatrixProps {
  values: number[][]; // 2x2 or 3x3 array
  color?: string;
  size?: "sm" | "md" | "lg";
  mode?: "2D" | "3D"; // for toggling between representations
}

export const MathMatrix: React.FC<MathMatrixProps> = ({ 
  values, 
  color = "text-gray-200",
  size = "md",
  mode 
}) => {
  // Handle undefined or invalid values
  if (!values || !Array.isArray(values) || values.length === 0) {
    const defaultMatrix = mode === "3D" ? [[0, 0, 0], [0, 0, 0], [0, 0, 0]] : [[0, 0], [0, 0]];
    values = defaultMatrix;
  }
  
  // Ensure each row is an array
  const safeValues = values.map(row => Array.isArray(row) ? row : []);
  
  // Determine if it's 2x2 or 3x3 based on input or mode
  const is2x2 = mode === "2D" || (safeValues.length === 2 && safeValues[0]?.length === 2);
  const displayValues = is2x2 
    ? safeValues.slice(0, 2).map(row => row.slice(0, 2).map(v => v ?? 0))
    : safeValues.slice(0, 3).map(row => row.slice(0, 3).map(v => v ?? 0));
  
  // Ensure we have the right dimensions
  while (displayValues.length < (is2x2 ? 2 : 3)) {
    displayValues.push(is2x2 ? [0, 0] : [0, 0, 0]);
  }
  displayValues.forEach((row, i) => {
    while (row.length < (is2x2 ? 2 : 3)) {
      row.push(0);
    }
  });
  
  const sizes = {
    sm: { 
      bracket: "text-2xl", 
      value: "text-xs", 
      gap: "gap-0.5",
      rowGap: "gap-0.5",
      padding: "px-1",
      height: is2x2 ? "h-12" : "h-16"
    },
    md: { 
      bracket: "text-3xl", 
      value: "text-sm", 
      gap: "gap-1",
      rowGap: "gap-1",
      padding: "px-1.5",
      height: is2x2 ? "h-16" : "h-20"
    },
    lg: { 
      bracket: "text-4xl", 
      value: "text-base", 
      gap: "gap-1.5",
      rowGap: "gap-1.5",
      padding: "px-2",
      height: is2x2 ? "h-20" : "h-24"
    }
  };
  
  const { bracket, value, gap, rowGap, padding, height } = sizes[size];
  
  return (
    <div className={`inline-flex items-center ${color} ${gap}`}>
      {/* Left bracket */}
      <span 
        className={`${bracket} font-extralight leading-none select-none`} 
        style={{ 
          transform: `scaleY(${is2x2 ? 1.8 : 2.2}) scaleX(0.7) translateY(-3px)`,
        }}
      >
        (
      </span>
      
      {/* Matrix values */}
      <div className={`flex flex-col justify-center ${height} ${rowGap} font-mono`}>
        {displayValues.map((row, rowIndex) => (
          <div key={rowIndex} className={`flex ${gap}`}>
            {row.map((val, colIndex) => (
              <span key={colIndex} className={`${value} text-center tabular-nums leading-tight w-12 ${padding}`}>
                {Math.abs(val) < 0.001 ? "0" : val.toFixed(2)}
              </span>
            ))}
          </div>
        ))}
      </div>
      
      {/* Right bracket */}
      <span 
        className={`${bracket} font-extralight leading-none select-none`} 
        style={{ 
          transform: `scaleY(${is2x2 ? 1.8 : 2.2}) scaleX(0.7) translateY(-3px)`,
        }}
      >
        )
      </span>
    </div>
  );
};

// Labeled matrix component
interface LabeledMatrixProps {
  label?: string;
  values: number[][];
  color?: string;
  size?: "sm" | "md" | "lg";
  mode?: "2D" | "3D";
}

export const LabeledMatrix: React.FC<LabeledMatrixProps> = ({ 
  label, 
  values, 
  color = "text-gray-200",
  size = "md",
  mode
}) => {
  const labelSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };
  
  if (label) {
    return (
      <div className="inline-flex items-center gap-1">
        <span className={`${color} font-bold ${labelSizes[size]}`}>{label}</span>
        <span className="text-white">:</span>
        <MathMatrix values={values} color={color} size={size} mode={mode} />
      </div>
    );
  }
  
  return <MathMatrix values={values} color={color} size={size} mode={mode} />;
};
