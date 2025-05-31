import React, { useState, useMemo, useEffect, useRef } from "react";
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
  ChevronRight,
  Palette,
  Logs,
  X
} from "lucide-react";
import { useMaterialColorStore } from "../providers/MaterialColorStore";
import { motion, AnimatePresence } from "framer-motion";

interface MaterialLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial: (materialKey: string) => void;
  favorites: string[];
  onToggleFavorite: (materialKey: string) => void;
  disableApply?: boolean;
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
type CategoryName = "Basic" | "Semiconductors" | "Non-Linear Materials" | "Plasmonic Metals";

const CATEGORY_ORDER: CategoryName[] = [
  "Basic",
  "Semiconductors", 
  "Non-Linear Materials",
  "Plasmonic Metals"
];

export const MaterialLibraryModal: React.FC<MaterialLibraryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectMaterial,
  favorites,
  onToggleFavorite,
  disableApply = false,
}) => {
  const [sortMode, setSortMode] = useState<SortMode>("category");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<CategoryName>>(new Set());
  const [alphabetSort, setAlphabetSort] = useState<"asc" | "desc">("asc");
  const [showCategories, setShowCategories] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [colorCustomizationMode, setColorCustomizationMode] = useState(false);
  const [showAllPropertiesGlobal, setShowAllPropertiesGlobal] = useState(false);
  
  // Search filter states
  const [searchNames, setSearchNames] = useState(true);
  const [searchProperties, setSearchProperties] = useState(false);
  const [searchDescriptions, setSearchDescriptions] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoScrollingRef = useRef(false);

  const { getMaterialColor } = useMaterialColorStore();
  const [hoveredMaterialKey, setHoveredMaterialKey] = useState<string | null>(null);

  const handleSelectMaterial = (materialKey: string) => {
    if (!colorCustomizationMode) {
      onSelectMaterial(materialKey);
      onClose();
    }
    // In color mode, clicking opens color picker (handled in MaterialCard)
  };

  // Handle scrolling to material card when color picker opens
  const handleScrollToCard = (cardElement: HTMLElement) => {
    if (!scrollContainerRef.current) return;
    
    // Set flag to indicate auto-scrolling
    isAutoScrollingRef.current = true;
    
    const container = scrollContainerRef.current;
    const header = container.querySelector('.sticky') as HTMLElement;
    const headerHeight = header ? header.offsetHeight : 0;
    
    // Calculate the position to scroll to (card top - header height - 16px gap)
    const cardTop = cardElement.offsetTop;
    const scrollPosition = cardTop - headerHeight - 16;
    
    // Smooth scroll to the calculated position
    container.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
    
    // Reset auto-scrolling flag after animation completes
    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 500); // Smooth scroll typically takes ~300-500ms
  };

  // Handle click on sidebar item in color mode
  const handleSidebarItemClick = (key: string) => {
    if (colorCustomizationMode) {
      // Find and click the card element to trigger its color picker
      setTimeout(() => {
        const cardElement = document.querySelector(`[data-material-key="${key}"]`) as HTMLElement;
        if (cardElement) {
          const cardDiv = cardElement.querySelector('.bg-neutral-800') as HTMLElement;
          if (cardDiv) {
            cardDiv.click();
          }
        }
      }, 600); // Wait for scroll animation to complete
    } else {
      handleSelectMaterial(key);
    }
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

  // Reset color customization mode when modal closes
  useEffect(() => {
    if (!isOpen) {
      setColorCustomizationMode(false);
    }
  }, [isOpen]);

  // Handle scroll events
  const handleScroll = () => {
    // Don't trigger scroll state during auto-scrolling
    if (isAutoScrollingRef.current) return;
    
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set new timeout to remove scrolling state after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  };

  // Handle click outside cards in color mode
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click target is the content div itself or the p-6 padding div
    const target = e.target as HTMLElement;
    if (colorCustomizationMode && (target === e.currentTarget || target.classList.contains('p-6'))) {
      setColorCustomizationMode(false);
    }
  };

  // Toggle all categories
  const toggleAllCategories = (collapsed: boolean) => {
    if (collapsed) {
      setCollapsedCategories(new Set(CATEGORY_ORDER));
    } else {
      setCollapsedCategories(new Set());
    }
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
        "Non-Linear Materials": [],
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          />
          
          {/* Main container with sidebar outside */}
          <div className="relative flex w-[95vw] max-w-[1600px] h-[85vh]">
            
            {/* Left sidebar list view - full height sibling */}
            <div
              className="w-80 border-r border-neutral-700 overflow-y-auto bg-neutral-900 rounded-l-lg"
              onMouseLeave={() => setHoveredMaterialKey(null)}
            >
              <div className="p-4">
                {showCategories ? (
                  // Category list view
                  <div className="space-y-4">
                    {CATEGORY_ORDER.map(category => {
                      const materials = (processedMaterials as Record<CategoryName, [string, Medium][]>)[category];
                      if (!materials || materials.length === 0) return null;
                      
                      const isCollapsed = collapsedCategories.has(category);
                      
                      return (
                        <div key={category}>
                          {/* Category header */}
                          <button
                            onClick={() => toggleCategory(category)}
                            className="flex items-center gap-2 w-full text-left hover:bg-neutral-800 px-2 py-1 rounded transition-all cursor-pointer"
                          >
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                            <span className="text-sm font-semibold">{category}</span>
                            <span className="text-xs text-neutral-500">({materials.length})</span>
                          </button>
                          
                          {/* Materials list with transition */}
                          {!isCollapsed && (
                            <div className="relative mt-1">
                              {/* Vertical line */}
                              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-600"></div>
                              
                              <div className="space-y-0.5 ml-2">
                                {materials.map(([key, material]) => {
                                  const color = getMaterialColor(key, material.color) || material.color || "#888";
                                  const displayName = material.name || key;
                                  const showAbbreviation =
                                    material.abbreviation &&
                                    material.abbreviation !== displayName;   // <- compare with name, not key
                                  const isHovered = hoveredMaterialKey === key;
                                  const isFav = favorites.includes(key);
                                  const canToggleFav = favorites.length < 6 || isFav;
                                  
                                  return (
                                    <div
                                      key={key}
                                      className={`group flex items-center gap-2 px-3 py-1.5 text-sm rounded-r cursor-pointer transition-all ml-2
                                        ${colorCustomizationMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-700'}
                                        ${favorites.includes(key) ? 'font-medium' : ''}
                                        ${isHovered ? (colorCustomizationMode ? 'bg-neutral-800' : 'bg-neutral-700') : ''}
                                      `}
                                      onMouseEnter={() => setHoveredMaterialKey(key)}
                                      onMouseLeave={() => setHoveredMaterialKey(null)}
                                      onClick={() => {
                                        if (colorCustomizationMode) {
                                          // In color mode, scroll to the card and trigger color picker
                                          const cardElement = document.querySelector(`[data-material-key="${key}"]`);
                                          if (cardElement && handleScrollToCard) {
                                            handleScrollToCard(cardElement as HTMLElement);
                                            handleSidebarItemClick(key);
                                          }
                                        } else {
                                          handleSelectMaterial(key);
                                        }
                                      }}
                                    >
                                      {/* Material color square */}
                                      <div 
                                        className="w-4 h-4 rounded flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                      />
                                      
                                      {/* Material name */}
                                      <span className="truncate flex-1">
                                        {displayName}
                                        {showAbbreviation && (
                                          <span className="text-neutral-400 ml-1">({material.abbreviation})</span>
                                        )}
                                      </span>
                                      
                                      {/* Interactive Favorite indicator */}
                                      {(isFav || (isHovered && canToggleFav)) && (
                                        <button
                                          className="flex-shrink-0 p-0.5 rounded transition-all cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFavorite(key);
                                          }}
                                          title={isFav ? "Remove from favorites" : "Add to favorites"}
                                        >
                                          <Star 
                                            size={14} 
                                            className={isFav ? "text-yellow-500 fill-yellow-500" : "text-white opacity-60 hover:opacity-100"}
                                            fill={isFav ? "currentColor" : "none"}
                                            style={{ 
                                              stroke: isFav ? "#000" : (isHovered ? "whitesmoke" : "#000"),
                                              strokeWidth: 1
                                            }}
                                          />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Alphabetical list view
                  <div className="space-y-0.5">
                    {(processedMaterials as [string, Medium][]).map(([key, material]) => {
                      const color = getMaterialColor(key, material.color) || material.color || "#888";
                      const displayName = material.name || key;
                      const showAbbreviation =
                        material.abbreviation &&
                        material.abbreviation !== displayName;   // <- compare with name, not key
                      const isHovered = hoveredMaterialKey === key;
                      const isFav = favorites.includes(key);
                      const canToggleFav = favorites.length < 6 || isFav;
                      
                      return (
                        <div
                          key={key}
                          className={`group flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer transition-all
                            ${colorCustomizationMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-700'}
                            ${favorites.includes(key) ? 'font-medium' : ''}
                            ${isHovered ? (colorCustomizationMode ? 'bg-neutral-800' : 'bg-neutral-700') : ''}
                          `}
                          onMouseEnter={() => setHoveredMaterialKey(key)}
                          onMouseLeave={() => setHoveredMaterialKey(null)}
                          onClick={() => {
                            if (colorCustomizationMode) {
                              // In color mode, scroll to the card and trigger color picker
                              const cardElement = document.querySelector(`[data-material-key="${key}"]`);
                              if (cardElement && handleScrollToCard) {
                                handleScrollToCard(cardElement as HTMLElement);
                                handleSidebarItemClick(key);
                              }
                            } else {
                              handleSelectMaterial(key);
                            }
                          }}
                        >
                          {/* Material color square */}
                          <div 
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          
                          {/* Material name */}
                          <span className="truncate flex-1">
                            {displayName}
                            {showAbbreviation && (
                              <span className="text-neutral-400 ml-1">({material.abbreviation})</span>
                            )}
                          </span>
                          
                          {/* Interactive Favorite indicator */}
                          {(isFav || (isHovered && canToggleFav)) && (
                            <button
                              className="flex-shrink-0 p-0.5 rounded transition-all cursor-pointer hover:border hover:border-neutral-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(key);
                              }}
                              title={isFav ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star 
                                size={14} 
                                className={isFav ? "text-yellow-500 fill-yellow-500" : "text-white opacity-60 hover:opacity-100"}
                                fill={isFav ? "currentColor" : "none"}
                                style={{ 
                                  stroke: isFav ? "#000" : (isHovered ? "whitesmoke" : "#000"),
                                  strokeWidth: 1
                                }}
                              />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right content with header - main modal */}
            <div className="flex-1 bg-neutral-800 rounded-r-lg shadow-xl flex flex-col">
              {/* Header with toolbar */}
              <div className="p-6 border-b border-neutral-700">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold">Material Library</h1>
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
                        className="w-full bg-neutral-700 rounded-md pl-10 pr-10 py-2 text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                          title="Clear search"
                        >
                          <X size={16} />
                        </button>
                      )}
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
                  
                  {/* Global properties toggle */}
                  <button
                    onClick={() => setShowAllPropertiesGlobal(!showAllPropertiesGlobal)}
                    className={`p-2 rounded-md transition-colors ${
                      showAllPropertiesGlobal 
                        ? "bg-neutral-600 text-white hover:bg-neutral-500" 
                        : "bg-neutral-700 hover:bg-neutral-600 text-neutral-300"
                    }`}
                    title={showAllPropertiesGlobal ? "Show compact view for all" : "Show all properties for all"}
                  >
                    <Logs size={18} />
                  </button>
                  
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
                  
                  {/* Color customization toggle */}
                  <button
                    onClick={() => setColorCustomizationMode(!colorCustomizationMode)}
                    className={`p-2 rounded-md transition-colors ${
                      colorCustomizationMode 
                        ? "bg-[#8B6F47] text-white hover:bg-[#A0826D]" 
                        : "bg-neutral-700 hover:bg-neutral-600 text-neutral-300"
                    }`}
                    title="Customize material colors"
                  >
                    <Palette size={18} />
                  </button>
                </div>
              </div>
              
              {/* Content area */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto relative"
                onScroll={handleScroll}
                onClick={handleContentClick}
              >
                {/* Color mode instruction header */}
                {colorCustomizationMode && (
                  <div className="sticky top-0 z-20 bg-[#8B6F47] text-white p-3 text-center flex items-center justify-between">
                    <div className="flex-1">Click on a material to change its color.</div>
                    <button
                      onClick={() => setColorCustomizationMode(false)}
                      className="text-white hover:text-neutral-200 transition-colors p-1 rounded hover:bg-black/20"
                      title="Exit color customization mode"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
                
                {/* Favorites mode instruction header */}
                {showFavoritesOnly && (
                  <div className="p-3 text-center text-neutral-400">
                    <div className="max-w-full mx-auto text-sm">
                      Your favorite materials appear in the toolbar for quick access. Select up to 6 favorites by clicking the star icon on any material card.
                    </div>
                  </div>
                )}
                
                <div className="p-6" onClick={handleContentClick}>
                  {showCategories ? (
                    // Category view
                    <div className="space-y-6">
                      {/* Controls row with Clear Favorites and Collapse/Expand buttons */}
                      <div className="flex justify-between items-center mb-2">
                        {/* Clear Favorites button - only show in favorites mode */}
                        {showFavoritesOnly && (
                          <button
                            onClick={() => {
                              // Clear all favorites
                              favorites.forEach(key => onToggleFavorite(key));
                            }}
                            className="flex items-center gap-2 text-sm px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-white transition-all"
                            title="Clear all favorites"
                          >
                            Clear Favorites
                            <X size={14} />
                          </button>
                        )}
                        
                        {/* Spacer to push collapse buttons to the right */}
                        <div className="flex-1" />
                        
                        {/* Collapse/Expand all buttons */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleAllCategories(false)}
                            className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-300 transition-all"
                            title="Expand all categories"
                          >
                            Expand All
                          </button>
                          <button
                            onClick={() => toggleAllCategories(true)}
                            className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-300 transition-all"
                            title="Collapse all categories"
                          >
                            Collapse All
                          </button>
                        </div>
                      </div>
                      
                      {/* Check if we have any materials to show */}
                      {showFavoritesOnly && favorites.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-neutral-500 mb-2">No Favorites</div>
                            <div className="text-neutral-400">Click the star icon on any material to add it to favorites</div>
                          </div>
                        </div>
                      ) : (
                        // Materials grid
                        CATEGORY_ORDER.map(category => {
                          const materials = (processedMaterials as Record<CategoryName, [string, Medium][]>)[category];
                          if (!materials || materials.length === 0) return null;
                          
                          const isCollapsed = collapsedCategories.has(category);
                          
                          return (
                            <div key={category} className="transition-all duration-300">
                              {/* Category header */}
                              <button
                                onClick={() => toggleCategory(category)}
                                className="flex items-center gap-2 w-full text-left mb-4 hover:text-white hover:bg-neutral-700/30 px-2 py-1 rounded transition-all cursor-pointer"
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
                                {materials.map(([key, material], index) => (
                                  <div 
                                    key={key} 
                                    className="transition-all duration-300 ease-out" 
                                    data-material-key={key}
                                    onMouseEnter={() => setHoveredMaterialKey(key)}
                                    onMouseLeave={() => setHoveredMaterialKey(null)}
                                  >
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
                                      colorCustomizationMode={colorCustomizationMode}
                                      isScrolling={isScrolling}
                                      columnIndex={index % 5}
                                      onColorPickerOpen={handleScrollToCard}
                                      showAllProperties={showAllPropertiesGlobal}
                                      isHovered={hoveredMaterialKey === key}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    // Alphabetical view with transitions
                    showFavoritesOnly && favorites.length === 0 ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-neutral-500 mb-2">No Favorites</div>
                          <div className="text-neutral-400">Click the star icon on any material to add it to favorites</div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Clear Favorites button for alphabetical view */}
                        {showFavoritesOnly && (
                          <div className="flex justify-start mb-4">
                            <button
                              onClick={() => {
                                // Clear all favorites
                                favorites.forEach(key => onToggleFavorite(key));
                              }}
                              className="flex items-center gap-2 text-sm px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-white transition-all"
                              title="Clear all favorites"
                            >
                              Clear Favorites
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-5 gap-4">
                          {(processedMaterials as [string, Medium][]).map(([key, material], index) => (
                            <div 
                              key={key} 
                              className="transition-all duration-300 ease-out"
                              data-material-key={key}
                              onMouseEnter={() => setHoveredMaterialKey(key)}
                              onMouseLeave={() => setHoveredMaterialKey(null)}
                            >
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
                                colorCustomizationMode={colorCustomizationMode}
                                isScrolling={isScrolling}
                                columnIndex={index % 5}
                                onColorPickerOpen={handleScrollToCard}
                                showAllProperties={showAllPropertiesGlobal}
                                isHovered={hoveredMaterialKey === key}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MaterialLibraryModal;
