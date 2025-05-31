import React from "react";

interface SusceptibilityDisplayProps {
  susceptibility: string;
  className?: string;
  showLegend?: boolean; // New prop to control legend display
}

interface ParsedSusceptibility {
  type: string;
  parameters: Record<string, string | number>;
}

// Parse susceptibility string like "DrudeSusceptibility(frequency=0, gamma=0.042747, sigma=-53.04497)"
function parseSusceptibility(str: string): ParsedSusceptibility | null {
  const match = str.match(/^(\w+)\((.*)\)$/);
  if (!match) return null;
  
  const type = match[1];
  const paramsStr = match[2];
  const parameters: Record<string, string | number> = {};
  
  // Parse parameters
  const paramPairs = paramsStr.split(/,\s*/);
  paramPairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      // Try to parse as number
      const numValue = parseFloat(value);
      parameters[key.trim()] = isNaN(numValue) ? value.trim() : numValue;
    }
  });
  
  return { type, parameters };
}

// Format parameter names for display
function formatParamName(name: string): string {
  const nameMap: Record<string, string> = {
    frequency: "ω₀",
    gamma: "γ",
    sigma: "σ",
    width: "Δω",
    damping: "δ"
  };
  return nameMap[name] || name;
}

// Format numbers for display
function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toString();
  if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
    return value.toExponential(2);
  }
  const formatted = value.toFixed(6);
  return parseFloat(formatted).toString();
}

const SusceptibilityDisplay: React.FC<SusceptibilityDisplayProps> = ({ 
  susceptibility, 
  className = "",
  showLegend = false 
}) => {
  const parsed = parseSusceptibility(susceptibility);
  
  if (!parsed) {
    return <div className={`text-[10px] text-neutral-400 ${className}`}>{susceptibility}</div>;
  }
  
  // Get display name for susceptibility type
  const typeDisplayName = parsed.type.replace('Susceptibility', '');
  
  return (
    <>
      <div className={`border border-neutral-700 rounded p-2 ${className}`}>
        <div className="text-[10px] font-semibold text-neutral-300 mb-1">{typeDisplayName}</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {Object.entries(parsed.parameters).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-neutral-400 text-[10px]">{formatParamName(key)} :</span>
              <span className="font-mono text-[10px] text-neutral-200">
                {typeof value === 'number' ? formatNumber(value) : value}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend - only show on last susceptibility */}
      {showLegend && (
        <div className="mt-2 p-2 bg-neutral-800 rounded border border-neutral-600">
          <div className="text-[9px] text-neutral-400 font-semibold mb-1">Legend:</div>
          <div className="space-y-0.5 text-[9px] text-neutral-500">
            <div><span className="text-neutral-400">ω₀</span> = resonance frequency</div>
            <div><span className="text-neutral-400">γ</span> = damping/collision rate</div>
            <div><span className="text-neutral-400">σ</span> = oscillator strength</div>
          </div>
        </div>
      )}
    </>
  );
};

export default SusceptibilityDisplay;
