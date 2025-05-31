import React, { useState, useMemo } from "react";
import { MaterialCatalog } from "../constants/meepMaterialPresets";
import { Medium } from "../types/meepMediumTypes";
import MaterialCard from "./MaterialCard";
import { 
  Search, 
  Star, 
  ArrowDownAZ, 
  ArrowUpAZ, 
  LayoutGrid,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface MaterialLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial: (materialKey: string) => void;
  favorites: string[];
  onToggleFavorite: (materialKey: string) => void;
}

// Default favorites from toolbar
const DEFAULT_FAVORITES = [
  "Air",
  "Silicon", 
  "Silica",
  "Gold",
  "GalliumArsenide",
  "SiliconNitride"
];

type SortMode = "alphabetical-asc" | "alphabetical-desc" | "category";
type CategoryName = "Basic" | "Semiconductors" | "Non-Linear Photonics" | "Plasmonic Metals";

const CATEGORY_ORDER: CategoryName[] = [
  "Basic",
  "Semiconductors", 
  "Non-Linear Photonics",
  "Plasmonic Metals"
];

const MaterialLibraryModal: React.FC<MaterialLibraryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectMaterial,
  favorites,
  onToggleFavorite
}) => {
  const [sortMode, setSortMode] = useState<SortMode>("category");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<CategoryName>>(new Set());
  const [alphabetSort, setAlphabetSort] = useState<"asc" | "desc">("asc");
  const [showCategories, setShowCategories] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Search filter states
  const [searchNames, setSearchNames] = useState(true);
  const [searchProperties, setSearchProperties] = useState(false);
  const [searchDescriptions, setSearchDescriptions] = useState(false);

  const handleSelectMaterial = (materialKey: string) => {
    onSelectMaterial(materialKey);
    onClose();
  };

  const toggleCategory = (category: CategoryName) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  // Helper to ensure at least one search option is active
  const handleSearchToggle = (option: 'names' | 'properties' | 'descriptions') => {
    const newState = {
      names: searchNames,
      properties: searchProperties,
      descriptions: searchDescriptions
    };
    
    newState[option] = !newState[option];
    
    // Ensure at least one option remains active
    if (!newState.names && !newState.properties && !newState.descriptions) {
      return; // Don't allow turning off the last option
    }
    
    setSearchNames(newState.names);
    setSearchProperties(newState.properties);
    setSearchDescriptions(newState.descriptions);
  };

  // Count active search options for dimming
  const activeSearchOptions = [searchNames, searchProperties, searchDescriptions].filter(Boolean).length;

  // Filter and sort materials
  const processedMaterials = useMemo(() => {
    let materials = Object.entries(MaterialCatalog);
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      materials = materials.filter(([key, material]) => {
        let matches = false;
        
        // Search in names (key and abbreviation)
        if (searchNames) {
          matches = matches || 
            key.toLowerCase().includes(query) ||
            (material.abbreviation?.toLowerCase().includes(query) ?? false);
        }
        
        // Search in property values
        if (searchProperties) {
          const propertyValues = Object.entries(material)
            .filter(([k]) => !['abbreviation', 'hint', 'color', 'category'].includes(k))
            .map(([_, v]) => String(v).toLowerCase());
          matches = matches || propertyValues.some(v => v.includes(query));
        }
        
        // Search in descriptions (hints)
        if (searchDescriptions) {
          matches = matches || (material.hint?.toLowerCase().includes(query) ?? false);
        }
        
        return matches;
      });
    }
    
    // Filter by favorites if enabled and sort alphabetically
    if (showFavoritesOnly) {
      materials = materials.filter(([key]) => favorites.includes(key));
    }

    // Group by category if in category mode
    if (showCategories) {
      const grouped: Record<CategoryName, [string, Medium][]> = {
        "Basic": [],
        "Semiconductors": [],
        "Non-Linear Photonics": [],
        "Plasmonic Metals": []
      };

      materials.forEach(([key, material]) => {
        const category = material.category || "Semiconductors"; // Default category
        grouped[category].push([key, material]);
      });

      // Sort within each category alphabetically
      Object.keys(grouped).forEach(cat => {
        grouped[cat as CategoryName].sort((a, b) => {
          const compareResult = a[0].localeCompare(b[0]);
          return alphabetSort === "asc" ? compareResult : -compareResult;
        });
      });

      return grouped;
    } else {
      // Sort all materials alphabetically
      materials.sort((a, b) => {
        const compareResult = a[0].localeCompare(b[0]);
        return alphabetSort === "asc" ? compareResult : -compareResult;
      });
      return materials;
    }
  }, [showCategories, showFavoritesOnly, favorites, alphabetSort, searchQuery, searchNames, searchProperties, searchDescriptions]);

  // Auto-collapse empty categories when searching
  React.useEffect(() => {
    if (searchQuery && showCategories) {
      const newCollapsed = new Set<CategoryName>();
      CATEGORY_ORDER.forEach(category => {
        const materials = (processedMaterials as Record<CategoryName, [string, Medium][]>)[category];
        if (!materials || materials.length === 0) {
          newCollapsed.add(category);
        }
      });
      setCollapsedCategories(newCollapsed);
    }
  }, [searchQuery, showCategories, processedMaterials]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-neutral-800 rounded-lg shadow-xl w-[90vw] max-w-[1200px] h-[85vh] flex flex-col">
        {/* Header with toolbar */}
        <div className="p-6 border-b border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Material Library</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white text-2xl leading-none p-1"
            >
              ✕
            </button>
          </div>
          
          {/* Toolbar */}
          <div className="flex items-start gap-4">
            {/* Search bar with expandable options */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                <input
                  type="text"
                  placeholder="Search materials..."
                  className="w-full bg-neutral-700 rounded-md pl-10 pr-4 py-2 text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={(e) => {
                    // Don't blur if clicking within the search options container
                    const relatedTarget = e.relatedTarget as HTMLElement;
                    if (relatedTarget && relatedTarget.closest('.search-options-container')) {
                      e.target.focus();
                      return;
                    }
                    setTimeout(() => setSearchFocused(false), 200);
                  }}
                />
              </div>
              
              {/* Expandable search options */}
              <div 
                className={`search-options-container overflow-hidden transition-all duration-300 ease-out ${
                  searchFocused ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
              >
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="text-neutral-400">Include in search:</span>
                  <label className={`flex items-center gap-1 ${
                    activeSearchOptions === 1 && searchNames 
                      ? 'opacity-60 cursor-default' 
                      : 'cursor-pointer'
                  }`}>
                    <input
                      type="checkbox"
                      checked={searchNames}
                      onChange={() => handleSearchToggle('names')}
                      disabled={activeSearchOptions === 1 && searchNames}
                      className={`rounded border-neutral-600 bg-neutral-700 text-[#60a5fa] focus:ring-[#60a5fa] focus:ring-offset-0 ${
                        activeSearchOptions === 1 && searchNames 
                          ? 'cursor-default' 
                          : 'cursor-pointer'
                      }`}
                    />
                    <span className="text-neutral-300">Names</span>
                  </label>
                  <label className={`flex items-center gap-1 ${
                    activeSearchOptions === 1 && searchProperties 
                      ? 'opacity-60 cursor-default' 
                      : 'cursor-pointer'
                  }`}>
                    <input
                      type="checkbox"
                      checked={searchProperties}
                      onChange={() => handleSearchToggle('properties')}
                      disabled={activeSearchOptions === 1 && searchProperties}
                      className={`rounded border-neutral-600 bg-neutral-700 text-[#60a5fa] focus:ring-[#60a5fa] focus:ring-offset-0 ${
                        activeSearchOptions === 1 && searchProperties 
                          ? 'cursor-default' 
                          : 'cursor-pointer'
                      }`}
                    />
                    <span className="text-neutral-300">Properties</span>
                  </label>
                  <label className={`flex items-center gap-1 ${
                    activeSearchOptions === 1 && searchDescriptions 
                      ? 'opacity-60 cursor-default' 
                      : 'cursor-pointer'
                  }`}>
                    <input
                      type="checkbox"
                      checked={searchDescriptions}
                      onChange={() => handleSearchToggle('descriptions')}
                      disabled={activeSearchOptions === 1 && searchDescriptions}
                      className={`rounded border-neutral-600 bg-neutral-700 text-[#60a5fa] focus:ring-[#60a5fa] focus:ring-offset-0 ${
                        activeSearchOptions === 1 && searchDescriptions 
                          ? 'cursor-default' 
                          : 'cursor-pointer'
                      }`}
                    />
                    <span className="text-neutral-300">Descriptions</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Sorting buttons - aligned to top */}
            <div className="flex items-center gap-2 pt-0">
              <button
                onClick={() => setAlphabetSort(alphabetSort === "asc" ? "desc" : "asc")}
                className="p-2 rounded-md transition-colors bg-neutral-700 hover:bg-neutral-600 text-neutral-300"
                title={alphabetSort === "asc" ? "Sort Z-A" : "Sort A-Z"}
              >
                {alphabetSort === "desc" ? <ArrowUpAZ size={18} /> : <ArrowDownAZ size={18} />}
              </button>
              
              <button
                onClick={() => setShowCategories(!showCategories)}
                className={`p-2 rounded-md transition-colors ${
                  showCategories 
                    ? "bg-[#60a5fa] text-white hover:bg-[#7aa5d8]" 
                    : "bg-neutral-700 hover:bg-neutral-600 text-neutral-300"
                }`}
                title="Sort by category"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            
            {/* Favorites toggle - aligned to top */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`p-2 rounded-md transition-colors ${
                showFavoritesOnly 
                  ? "bg-yellow-600 text-white hover:bg-yellow-500" 
                  : "bg-neutral-700 hover:bg-neutral-600 text-neutral-300"
              }`}
              title="Show favorites only"
            >
              <Star size={18} fill={showFavoritesOnly ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {showCategories ? (
            // Category view
            <div className="space-y-6">
              {CATEGORY_ORDER.map(category => {
                const materials = (processedMaterials as Record<CategoryName, [string, Medium][]>)[category];
                if (!materials || materials.length === 0) return null;
                
                const isCollapsed = collapsedCategories.has(category);
                
                return (
                  <div key={category} className="transition-all duration-300">
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex items-center gap-2 w-full text-left mb-4 hover:text-neutral-300 transition-colors"
                    >
                      {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                      <h3 className="text-lg font-semibold">{category}</h3>
                      <span className="text-sm text-neutral-500">({materials.length})</span>
                    </button>
                    
                    {/* Materials grid with transition */}
                    <div 
                      className={`grid grid-cols-5 gap-4 transition-all duration-300 ${
                        isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[2000px] opacity-100'
                      }`}
                    >
                      {materials.map(([key, material]) => (
                        <div key={key} className="transition-all duration-300 ease-out">
                          <MaterialCard
                            material={material}
                            materialKey={key}
                            onSelect={handleSelectMaterial}
                            isFavorite={favorites.includes(key)}
                            onToggleFavorite={onToggleFavorite}
                            canAddFavorite={favorites.length < 6 || favorites.includes(key)}
                            searchQuery={searchQuery}
                            searchInNames={searchNames}
                            searchInProperties={searchProperties}
                            searchInDescriptions={searchDescriptions}
                            hideCategory={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Alphabetical view with transitions
            <div className="grid grid-cols-5 gap-4">
              {(processedMaterials as [string, Medium][]).map(([key, material]) => (
                <div key={key} className="transition-all duration-300 ease-out">
                  <MaterialCard
                    material={material}
                    materialKey={key}
                    onSelect={handleSelectMaterial}
                    isFavorite={favorites.includes(key)}
                    onToggleFavorite={onToggleFavorite}
                    canAddFavorite={favorites.length < 6 || favorites.includes(key)}
                    searchQuery={searchQuery}
                    searchInNames={searchNames}
                    searchInProperties={searchProperties}
                    searchInDescriptions={searchDescriptions}
                    hideCategory={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialLibraryModal;
