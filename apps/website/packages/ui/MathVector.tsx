import React from "react";

interface MathVectorProps {
  values: number[];
  color?: string;
  size?: "sm" | "md" | "lg";
}

export const MathVector: React.FC<MathVectorProps> = ({ 
  values, 
  color = "text-gray-200",
  size = "md" 
}) => {
  const is2D = values.length === 2;
  
  const sizes = {
    sm: { 
      bracket: is2D ? "text-2xl" : "text-3xl", 
      value: "text-xs", 
      gap: "gap-0.5",
      height: is2D ? "h-6" : "h-8",
      scale: is2D ? 1.2 : 1.5
    },
    md: { 
      bracket: is2D ? "text-3xl" : "text-4xl", 
      value: "text-sm", 
      gap: "gap-1",
      height: is2D ? "h-8" : "h-10",
      scale: is2D ? 1.4 : 1.8
    },
    lg: { 
      bracket: is2D ? "text-4xl" : "text-5xl", 
      value: "text-base", 
      gap: "gap-1.5",
      height: is2D ? "h-10" : "h-12",
      scale: is2D ? 1.6 : 2
    }
  };
  
  const { bracket, value, gap, height, scale } = sizes[size];
  
  return (
    <div className={`inline-flex items-center ${color} ${gap}`}>
      {/* Left parenthesis */}
      <span 
        className={`${bracket} font-extralight leading-none select-none -mr-1.5`} 
        style={{ 
          transform: `scaleY(${scale}) scaleX(0.7) translateY(-4px)`,
          marginRight: '-2px'
        }}
      >
        (
      </span>
      
      {/* Values */}
      <div className={`flex flex-col justify-center ${height} font-mono`}>
        {values.map((val, index) => (
          <span key={index} className={`${value} text-center tabular-nums leading-tight`}>
            {Math.abs(val) < 0.001 ? "0.000" : val.toFixed(3)}
          </span>
        ))}
      </div>
      
      {/* Right parenthesis */}
      <span 
        className={`${bracket} font-extralight leading-none select-none -ml-1.5`} 
        style={{ 
          transform: `scaleY(${scale}) scaleX(0.7) translateY(-4px)`,
          marginLeft: '-2px'
        }}
      >
        )
      </span>
    </div>
  );
};

// Vector with label component
interface LabeledVectorProps {
  label: string;
  values: number[];
  color?: string;
  size?: "sm" | "md" | "lg";
}

export const LabeledVector: React.FC<LabeledVectorProps> = ({ 
  label, 
  values, 
  color = "text-gray-200",
  size = "md" 
}) => {
  const labelSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };
  
  return (
    <div className="inline-flex items-center gap-1">
      <span className={`${color} font-bold ${labelSizes[size]}`}>{label}</span>
      <span className="text-white">:</span>
      <MathVector values={values} color={color} size={size} />
    </div>
  );
};

// Alternative with square brackets
export const MathVectorSquare: React.FC<MathVectorProps> = ({ 
  values, 
  color = "text-gray-200",
  size = "md" 
}) => {
  const sizes = {
    sm: { 
      bracket: "text-2xl", 
      value: "text-xs", 
      gap: "gap-0.5",
      height: "h-8"
    },
    md: { 
      bracket: "text-3xl", 
      value: "text-sm", 
      gap: "gap-1",
      height: "h-10"
    },
    lg: { 
      bracket: "text-4xl", 
      value: "text-base", 
      gap: "gap-1.5",
      height: "h-12"
    }
  };
  
  const { bracket, value, gap, height } = sizes[size];
  
  return (
    <div className={`inline-flex items-center ${color} font-mono ${gap}`}>
      {/* Left bracket */}
      <span className={`${bracket} font-thin leading-none select-none`} style={{ transform: 'scaleY(1.2)' }}>
        [
      </span>
      
      {/* Values */}
      <div className={`flex flex-col justify-center ${height}`}>
        {values.map((val, index) => (
          <span key={index} className={`${value} text-center tabular-nums leading-tight`}>
            {Math.abs(val) < 0.001 ? "0.000" : val.toFixed(3)}
          </span>
        ))}
      </div>
      
      {/* Right bracket */}
      <span className={`${bracket} font-thin leading-none select-none`} style={{ transform: 'scaleY(1.2)' }}>
        ]
      </span>
    </div>
  );
};

// Inline vector for space-constrained areas
export const InlineVector: React.FC<{ values: number[]; color?: string }> = ({ values, color = "text-gray-200" }) => {
  return (
    <span className={`${color} font-mono text-xs`}>
      ({values.map(v => (Math.abs(v) < 0.001 ? "0" : v.toFixed(3))).join(", ")})
    </span>
  );
};
