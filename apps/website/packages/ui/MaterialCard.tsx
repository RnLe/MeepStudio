import React, { useState, useRef, useEffect } from "react";
import { Medium } from "../types/meepMediumTypes";
import { Star, Logs, X } from "lucide-react";
import { useMaterialColorStore } from "../providers/MaterialColorStore";
import { HexColorPicker } from "react-colorful";
import { MEDIUM_DEFAULTS, isDefaultValue } from "../constants/meepMaterialPresets";
import SusceptibilityDisplay from "./SusceptibilityDisplay";

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
  colorCustomizationMode?: boolean;
  isScrolling?: boolean;
  columnIndex?: number;
  onColorPickerOpen?: (element: HTMLElement) => void;
  showAllProperties?: boolean;
  isHovered?: boolean;
}

// Vintage color palette - 8 distinct colors with vintage/strong variants
const VINTAGE_COLORS = {
  light: [
    '#F5F5DC', // Beige (vintage white)
    '#B0C4DE', // Light Steel Blue (vintage blue)
    '#F0E68C', // Khaki (vintage yellow)
    '#8FBC8F', // Dark Sea Green (vintage green)
    '#F4A460', // Sandy Brown (vintage orange)
    '#BC8F8F', // Rosy Brown (vintage red)
    '#DDA0DD', // Plum (vintage purple)
    '#D2B48C', // Tan (vintage brown)
  ],
  strong: [
    '#000000', // Black (strong white counterpart)
    '#0000FF', // Blue
    '#FFD700', // Gold (strong yellow)
    '#00FF00', // Lime (strong green)
    '#FF8C00', // Dark Orange
    '#FF0000', // Red
    '#9400D3', // Violet (strong purple)
    '#8B4513', // Saddle Brown
  ]
};

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
  hideCategory = false,
  colorCustomizationMode = false,
  isScrolling = false,
  columnIndex = 0,
  onColorPickerOpen,
  showAllProperties: globalShowAllProperties = false,
  isHovered: externalIsHovered = false
}) => {
  const [isLocalHovered, setIsLocalHovered] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDraggingFont, setIsDraggingFont] = useState(false);
  const [showAllProperties, setShowAllProperties] = useState(globalShowAllProperties);
  const [isClosingColorPicker, setIsClosingColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const fontSliderRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { getMaterialColor, setMaterialColor, getMaterialFontColor, setMaterialFontColor } = useMaterialColorStore();
  const currentColor = getMaterialColor(materialKey, material.color) || material.color || "#888";
  const currentFontColor = getMaterialFontColor(materialKey) || (currentColor && isLightColor(currentColor) ? "#000" : "#fff");

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

  // Format number to appropriate precision
  const formatNumber = (value: number): string => {
    if (Number.isInteger(value)) return value.toString();
    
    // For very small or very large numbers, use exponential notation
    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
      return value.toExponential(2);
    }
    
    // Otherwise, format to remove trailing zeros
    const formatted = value.toFixed(6);
    return parseFloat(formatted).toString();
  };

  // Calculate epsilon from n or vice versa (assuming mu=1)
  const getEpsilon = (): number => {
    if (material.epsilon !== undefined) return material.epsilon;
    if (material.index !== undefined) return material.index * material.index;
    return 1; // default
  };

  // Calculate refractive index from epsilon or index field
  const getRefractiveIndex = (): number => {
    if (material.index !== undefined) return material.index;
    if (material.epsilon !== undefined) return Math.sqrt(material.epsilon);
    return 1; // default
  };

  // Get value with default fallback
  const getValue = (fieldName: keyof typeof MEDIUM_DEFAULTS): any => {
    const value = material[fieldName];
    return value !== undefined ? value : MEDIUM_DEFAULTS[fieldName];
  };

  const { index, epsilon } = material;

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

  // Handle click outside color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsClosingColorPicker(true);   // <─ mark that we’re closing via outside-click
        setShowColorPicker(false);
        setTimeout(() => setIsClosingColorPicker(false), 100); // reset shortly after
      }
    };
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker]);

  // Close color picker when scrolling
  useEffect(() => {
    if (isScrolling && showColorPicker) {
      setShowColorPicker(false);
    }
  }, [isScrolling, showColorPicker]);

  const handleCardClick = () => {
    if (isClosingColorPicker) return;  // <─ ignore the trailing click

    if (colorCustomizationMode) {
      if (showColorPicker) {
        setIsClosingColorPicker(true);
        setShowColorPicker(false);
        setTimeout(() => setIsClosingColorPicker(false), 100);
      } else {
        setShowColorPicker(true);
        if (onColorPickerOpen && cardRef.current) onColorPickerOpen(cardRef.current);
      }
    } else {
      onSelect(materialKey);
    }
  };

  const handleColorChange = (color: string) => {
    setMaterialColor(materialKey, color);
  };

  const handleFontColorChange = (brightness: number) => {
    // Convert brightness (0-1) to grayscale hex
    const gray = Math.round(brightness * 255);
    const hex = gray.toString(16).padStart(2, '0');
    setMaterialFontColor(materialKey, `#${hex}${hex}${hex}`);
  };

  // Handle font color dragging
  const handleFontMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingFont(true);
    updateFontColor(e);
  };

  const updateFontColor = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!fontSliderRef.current) return;
    const rect = fontSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const brightness = x / rect.width;
    handleFontColorChange(brightness);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingFont) {
        updateFontColor(e);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingFont(false);
    };

    if (isDraggingFont) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingFont]);

  // Determine if color picker should appear on left (for 4th and 5th columns)
  const showPickerOnLeft = columnIndex >= 3;

  // Check if a field is explicitly set in the material preset
  const isExplicitlySet = (fieldName: keyof Medium): boolean => {
    return material[fieldName] !== undefined;
  };

  // Check if we should show a property in compact mode
  const shouldShowInCompactMode = (fieldName: keyof Medium): boolean => {
    // Always show n and epsilon if either is set
    if ((fieldName === 'index' || fieldName === 'epsilon') && 
        (isExplicitlySet('index') || isExplicitlySet('epsilon'))) {
      return true;
    }
    return isExplicitlySet(fieldName);
  };

  // Sync with global state when it changes
  useEffect(() => {
    setShowAllProperties(globalShowAllProperties);
  }, [globalShowAllProperties]);

  // Use external hover state if provided, otherwise use local hover
  const isHovered = externalIsHovered || isLocalHovered;

  return (
    <div
      ref={cardRef}
      className={`bg-neutral-800 rounded-lg p-4 cursor-pointer transition-all flex flex-col h-full relative
        ${colorCustomizationMode ? 'ring-2 ring-[#8B6F47] ring-opacity-0 hover:ring-opacity-50' : ''}
        ${isHovered && !showColorPicker ? 'bg-neutral-600 ring-2 ring-[#60a5fa]/50' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsLocalHovered(true)}
      onMouseLeave={() => setIsLocalHovered(false)}
    >
      {/* Favorite star - moved to top right of card */}
      {(isFavorite || (isHovered && canAddFavorite)) && onToggleFavorite && (
        <button
          className="absolute top-1 right-1 z-10 p-1 hover:bg-neutral-600/50 rounded transition-all"
          onClick={handleToggleFavorite}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star 
            size={18}  // Changed from 16 to 18
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
        style={{ backgroundColor: currentColor }}
      >
        {/* Placeholder for future image */}
        <div className="absolute inset-0 opacity-10">
          {/* Image placeholder - add src when images are available */}
          {/* <img src={`/materials/${materialKey}.png`} alt={material.abbreviation} className="w-full h-full object-cover" /> */}
        </div>
        
        {/* Abbreviation with custom font color */}
        <span 
          className="font-bold select-none relative"
          style={{ 
            fontSize: `${Math.min(60, 120 / (material.abbreviation?.length || 1))}px`,
            color: currentFontColor,
            textShadow: `0 0 10px ${currentFontColor === '#000' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}`
          }}
        >
          {searchInNames ? highlightText(material.abbreviation || "") : material.abbreviation}
        </span>
      </div>

      {/* Material Properties */}
      <div className="flex-grow">
        <h3 className="font-semibold mb-2 text-sm flex items-center justify-between">
          <span>{searchInNames ? highlightText(material.name || materialKey) : (material.name || materialKey)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllProperties(!showAllProperties);
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              setIsLocalHovered(false);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setIsLocalHovered(true);
            }}
            className={`p-1 rounded transition-all cursor-pointer ${
              showAllProperties ? 'bg-neutral-600 text-white hover:bg-neutral-500' : 'hover:bg-neutral-600 text-neutral-400 hover:text-neutral-200'
            }`}
            title={showAllProperties ? "Show compact view" : "Show all properties"}
          >
            <Logs size={12} />
          </button>
        </h3>
        
        {/* Properties Grid */}
        <div className="text-xs space-y-1.5">
          {/* Optical Properties - Row 1 */}
          {(showAllProperties || shouldShowInCompactMode('index') || shouldShowInCompactMode('epsilon')) && (
            <div className="grid grid-cols-2 gap-x-3">
              <div className="flex justify-between items-center" title="Refractive Index">
                <span className="text-neutral-400 text-[11px]">n :</span>
                <span className={`font-mono text-[11px] ${isExplicitlySet('index') || isExplicitlySet('epsilon') ? 'text-neutral-200' : 'text-neutral-500'}`}>
                  {formatNumber(getRefractiveIndex())}
                </span>
              </div>
            </div>
          )}
          
          {/* Permittivity & Permeability - Row 2 */}
          {(showAllProperties || shouldShowInCompactMode('epsilon') || shouldShowInCompactMode('mu')) && (
            <div className="grid grid-cols-2 gap-x-3">
              {(showAllProperties || shouldShowInCompactMode('epsilon')) && (
                <div className="flex justify-between items-center" title="Permittivity">
                  <span className="text-neutral-400 text-[11px]">ε :</span>
                  <span className={`font-mono text-[11px] ${isExplicitlySet('epsilon') || isExplicitlySet('index') ? 'text-neutral-200' : 'text-neutral-500'}`}>
                    {formatNumber(getEpsilon())}
                  </span>
                </div>
              )}
              {(showAllProperties || shouldShowInCompactMode('mu')) && (
                <div className="flex justify-between items-center" title="Permeability">
                  <span className="text-neutral-400 text-[11px]">μ :</span>
                  <span className={`font-mono text-[11px] ${isExplicitlySet('mu') ? 'text-neutral-200' : 'text-neutral-500'}`}>
                    {formatNumber(getValue('mu'))}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Conductivity - Row 3 */}
          {(showAllProperties || shouldShowInCompactMode('D_conductivity') || shouldShowInCompactMode('B_conductivity')) && (
            <div className="grid grid-cols-2 gap-x-3">
              {(showAllProperties || shouldShowInCompactMode('D_conductivity')) && (
                <div className="flex justify-between items-center" title="Electric Conductivity">
                  <span className="text-neutral-400 text-[11px]">σ<sub>D</sub> :</span>
                  <span className={`font-mono text-[11px] ${isExplicitlySet('D_conductivity') ? 'text-neutral-200' : 'text-neutral-500'}`}>
                    {searchInProperties ? highlightText(formatNumber(getValue('D_conductivity'))) : formatNumber(getValue('D_conductivity'))}
                  </span>
                </div>
              )}
              {(showAllProperties || shouldShowInCompactMode('B_conductivity')) && (
                <div className="flex justify-between items-center" title="Magnetic Conductivity">
                  <span className="text-neutral-400 text-[11px]">σ<sub>B</sub> :</span>
                  <span className={`font-mono text-[11px] ${isExplicitlySet('B_conductivity') ? 'text-neutral-200' : 'text-neutral-500'}`}>
                    {searchInProperties ? highlightText(formatNumber(getValue('B_conductivity'))) : formatNumber(getValue('B_conductivity'))}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Nonlinearity - Only show if any nonlinear property is set or in detailed mode */}
          {(showAllProperties || isExplicitlySet('chi2') || isExplicitlySet('E_chi2') || isExplicitlySet('chi3') || isExplicitlySet('E_chi3')) && (
            <>
              <div className="border-t border-neutral-700 my-1"></div>
              {/* Non-Linearities label */}
              <div className="text-[10px] text-neutral-400 font-semibold mb-1">Non-Linearities:</div>
              <div className="grid grid-cols-2 gap-x-3">
                {(showAllProperties || isExplicitlySet('chi2') || isExplicitlySet('E_chi2')) && (
                  <div className="flex justify-between items-center" title="Second-order susceptibility">
                    <span className="text-neutral-400 text-[11px]">χ<sup>(2)</sup> :</span>
                    <span className={`font-mono text-[11px] ${(isExplicitlySet('chi2') || isExplicitlySet('E_chi2')) ? 'text-neutral-200' : 'text-neutral-500'}`}>
                      {formatNumber(material.chi2 || material.E_chi2 || 0)}
                    </span>
                  </div>
                )}
                {(showAllProperties || isExplicitlySet('chi3') || isExplicitlySet('E_chi3')) && (
                  <div className="flex justify-between items-center" title="Third-order susceptibility">
                    <span className="text-neutral-400 text-[11px]">χ<sup>(3)</sup> :</span>
                    <span className={`font-mono text-[11px] ${(isExplicitlySet('chi3') || isExplicitlySet('E_chi3')) ? 'text-neutral-200' : 'text-neutral-500'}`}>
                      {formatNumber(material.chi3 || material.E_chi3 || 0)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Dispersion - Show if susceptibilities are defined or in detailed mode */}
          {(material.E_susceptibilities && material.E_susceptibilities.length > 0) && (
            <>
              <div className="border-t border-neutral-700 my-1"></div>
              {!showAllProperties ? (
                <div className="text-[10px] text-neutral-400">
                  Dispersive: {material.E_susceptibilities.length} term{material.E_susceptibilities.length > 1 ? 's' : ''}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-[10px] text-neutral-400 font-semibold">E-Susceptibilities:</div>
                  {material.E_susceptibilities.map((susc, idx) => (
                    <SusceptibilityDisplay 
                      key={idx} 
                      susceptibility={susc} 
                      showLegend={idx === material.E_susceptibilities!.length - 1} 
                    />
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* H-Susceptibilities in detailed mode */}
          {showAllProperties && material.H_susceptibilities && material.H_susceptibilities.length > 0 && (
            <>
              <div className="border-t border-neutral-700 my-1"></div>
              <div className="space-y-1">
                <div className="text-[10px] text-neutral-400 font-semibold">H-Susceptibilities:</div>
                {material.H_susceptibilities.map((susc, idx) => (
                  <SusceptibilityDisplay 
                    key={idx} 
                    susceptibility={susc} 
                    showLegend={idx === material.H_susceptibilities!.length - 1} 
                  />
                ))}
              </div>
            </>
          )}
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

      {/* Enhanced Color Picker Popup */}
      {showColorPicker && (
        <div 
          ref={colorPickerRef}
          className={`absolute top-0 z-30 bg-neutral-900 rounded-lg shadow-xl p-4 min-w-[320px] transition-opacity duration-200 ${
            isScrolling ? 'opacity-0 pointer-events-none' : 'opacity-100'
          } ${
            showPickerOnLeft ? 'right-full mr-2' : 'left-full ml-2'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Material Color</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsClosingColorPicker(true);
                setShowColorPicker(false);
                // Reset the flag after a short delay
                setTimeout(() => setIsClosingColorPicker(false), 100);
              }}
              className="text-neutral-400 hover:text-white transition-colors p-1 rounded hover:bg-neutral-800"
              title="Close color picker"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* React Colorful Picker */}
          <HexColorPicker 
            color={currentColor} 
            onChange={handleColorChange}
            style={{ width: '100%', height: '160px' }}
          />
          
          {/* Hex input */}
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-neutral-400">Hex:</label>
            <input
              type="text"
              value={currentColor}
              onChange={(e) => {
                const hex = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(hex)) {
                  handleColorChange(hex);
                }
              }}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs font-mono"
              placeholder="#000000"
            />
          </div>

          {/* Vintage color presets - 16 colors total */}
          <div className="mt-3 space-y-1">
            <div className="flex gap-1">
              {VINTAGE_COLORS.light.map(color => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border border-neutral-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                />
              ))}
            </div>
            <div className="flex gap-1">
              {VINTAGE_COLORS.strong.map(color => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border border-neutral-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Font Color Control */}
          <div className="mt-4 border-t border-neutral-700 pt-3">
            <div className="mb-2 text-sm font-semibold">Font Color</div>
            <div className="flex items-center gap-3">
              <div 
                ref={fontSliderRef}
                className="flex-1 h-8 bg-gradient-to-r from-black to-white rounded cursor-pointer relative select-none overflow-hidden"
                onMouseDown={handleFontMouseDown}
              >
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white border-x border-black pointer-events-none"
                  style={{ 
                    left: `calc(${Math.min(100, Math.max(0, (parseInt(currentFontColor.slice(1, 3), 16) / 255) * 100))}% - 2px)`,
                  }}
                />
              </div>
              <div 
                className="w-8 h-8 rounded border border-neutral-600"
                style={{ backgroundColor: currentFontColor }}
              />
            </div>
          </div>
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
