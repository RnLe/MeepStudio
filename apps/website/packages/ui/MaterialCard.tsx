import React, { useState } from "react";
import { Medium } from "../types/meepMediumTypes";
import { Star } from "lucide-react";

interface MaterialCardProps {
  material: Medium;
  materialKey: string;
  onSelect: (materialKey: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (materialKey: string) => void;
  canAddFavorite?: boolean;
  searchQuery?: string;
  searchInNames?: boolean;
  searchInProperties?: boolean;
  searchInDescriptions?: boolean;
  hideCategory?: boolean;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ 
  material, 
  materialKey, 
  onSelect,
  isFavorite = false,
  onToggleFavorite,
  canAddFavorite = true,
  searchQuery = "",
  searchInNames = false,
  searchInProperties = false,
  searchInDescriptions = false,
  hideCategory = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Helper function to highlight search matches
  const highlightText = (text: string, shouldHighlight: boolean = true): React.ReactNode => {
    if (!searchQuery || !shouldHighlight) return text;
    
    // Escape special regex characters in the search query
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    
    return parts.map((part, index) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={index} className="bg-[#60a5fa] text-white rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Format value for display with optional highlighting
  const formatValue = (value: any, shouldHighlight: boolean = false): React.ReactNode => {
    let formatted: string;
    if (typeof value === "number") {
      // Format numbers to remove trailing zeros after decimal
      if (Math.abs(value) < 0.001 || Math.abs(value) > 1000) {
        formatted = value.toExponential(2);
      } else {
        // Convert to string and remove trailing zeros
        formatted = parseFloat(value.toFixed(10)).toString();
      }
    } else if (Array.isArray(value)) {
      formatted = `[${value.join(", ")}]`;
    } else if (typeof value === "object" && value !== null) {
      formatted = `(${Object.values(value).join(", ")})`;
    } else {
      formatted = String(value);
    }
    
    return highlightText(formatted, shouldHighlight);
  };

  // Get all defined properties (excluding UI properties and optionally category)
  const materialProperties = Object.entries(material).filter(
    ([key, value]) => 
      value !== undefined && 
      !["abbreviation", "hint", "color"].includes(key) &&
      !(hideCategory && key === "category")
  );

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card select
    if (onToggleFavorite && (isFavorite || canAddFavorite)) {
      onToggleFavorite(materialKey);
    }
  };

  return (
    <div 
      className="bg-neutral-800 rounded-lg p-4 cursor-pointer hover:bg-neutral-700 transition-all flex flex-col h-full relative"
      onClick={() => onSelect(materialKey)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Favorite star - moved to top right of card */}
      {(isFavorite || (isHovered && canAddFavorite)) && onToggleFavorite && (
        <button
          className="absolute top-1 right-1 z-20 p-1 hover:bg-neutral-600/50 rounded transition-all"
          onClick={handleToggleFavorite}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star 
            size={16} 
            className={isFavorite ? "text-yellow-500 fill-yellow-500" : "text-white"}
            fill={isFavorite ? "currentColor" : "none"}
            style={{ 
              stroke: "#000",
              strokeWidth: 1
            }}
          />
        </button>
      )}

      {/* Material Preview Square */}
      <div 
        className="w-full aspect-square rounded-md mb-3 flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: material.color || "#888" }}
      >
        {/* Placeholder for future image */}
        <div className="absolute inset-0 opacity-10">
          {/* Image placeholder - add src when images are available */}
          {/* <img src={`/materials/${materialKey}.png`} alt={material.abbreviation} className="w-full h-full object-cover" /> */}
        </div>
        
        {/* Abbreviation with highlighting */}
        <span 
          className="font-bold select-none z-10"
          style={{ 
            fontSize: `${Math.min(60, 120 / (material.abbreviation?.length || 1))}px`,
            color: material.color && isLightColor(material.color) ? "#000" : "#fff",
            textShadow: material.color && isLightColor(material.color) 
              ? "0 0 10px rgba(0,0,0,0.3)" 
              : "0 0 10px rgba(255,255,255,0.3)"
          }}
        >
          {searchInNames ? highlightText(material.abbreviation || "") : material.abbreviation}
        </span>
      </div>

      {/* Material Properties */}
      <div className="flex-grow">
        <h3 className="font-semibold mb-2 text-sm">
          {searchInNames ? highlightText(materialKey) : materialKey}
        </h3>
        
        <div className="text-xs space-y-1 text-neutral-400">
          {materialProperties.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-2">
              <span className="text-neutral-500">{key}:</span>
              <span className="text-neutral-300 font-mono text-right">
                {formatValue(value, searchInProperties)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hint with highlighting */}
      {material.hint && (
        <div className="mt-3 pt-3 border-t border-neutral-700">
          <p className="text-xs text-neutral-500 italic">
            {searchInDescriptions ? highlightText(material.hint) : material.hint}
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to determine if a color is light
function isLightColor(color: string): boolean {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

export default MaterialCard;
