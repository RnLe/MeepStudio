"use client";
import React, { useState } from "react";
import { shallow } from "zustand/shallow";
import { Circle, Square, TriangleIcon, ChevronDown, ChevronRight, Shield, Eye, EyeOff, Target, Zap, Lock, Unlock, Logs } from "lucide-react";
import { useCanvasStore } from "../providers/CanvasStore";
import { MeepProject } from "../types/meepProjectTypes";
import CustomLucideIcon from "./CustomLucideIcon";
import { MaterialCatalog } from "../constants/meepMaterialPresets";
import { useMaterialColorStore } from "../providers/MaterialColorStore";
import { useMeepProjects } from "../hooks/useMeepProjects";

const ObjectsList: React.FC<{ project: MeepProject }> = ({ project }) => {
  const [expandedGroups, setExpandedGroups] = useState({
    geometries: true,
    sources: true,
    materials: false,
    lattices: true,
    regions: true,
    regionBoxes: true,
  });

  const [compactMode, setCompactMode] = useState(false);

  const { 
    geometries, sources, boundaries, lattices, regions, regionBoxes, 
    selectedGeometryIds, selectGeometry, 
    updateGeometry, updateSource, updateBoundary, updateLattice, updateRegion, updateRegionBox 
  } = useCanvasStore(
    (s) => ({
      geometries: s.geometries,
      sources: s.sources,
      boundaries: s.boundaries,
      lattices: s.lattices,
      regions: s.regions,
      regionBoxes: s.regionBoxes,
      selectedGeometryIds: s.selectedGeometryIds,
      selectGeometry: s.selectGeometry,
      updateGeometry: s.updateGeometry,
      updateSource: s.updateSource,
      updateBoundary: s.updateBoundary,
      updateLattice: s.updateLattice,
      updateRegion: s.updateRegion,
      updateRegionBox: s.updateRegionBox,
    }),
    shallow
  );

  const { getMaterialColor } = useMaterialColorStore();
  const { lattices: fullLattices } = useMeepProjects();
  
  const toggleGroup = (group: keyof typeof expandedGroups) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  
  // Helper function to get the correct update method for an element
  const getUpdateMethod = (item: any) => {
    switch (item.kind) {
      case "cylinder":
      case "rectangle":
      case "triangle":
        return updateGeometry;
      case "continuousSource":
      case "gaussianSource":
      case "eigenModeSource":
      case "gaussianBeamSource":
        return updateSource;
      case "pmlBoundary":
        return updateBoundary;
      case "lattice":
        return updateLattice;
      case "fluxRegion":
        return updateRegion;
      case "regionBox":
        return updateRegionBox;
      default:
        return updateGeometry; // fallback
    }
  };
  
  // Toggle element visibility
  const toggleElementVisibility = (e: React.MouseEvent, item: any, currentInvisible: boolean) => {
    e.stopPropagation(); // Prevent selecting the element
    const updateMethod = getUpdateMethod(item);
    updateMethod(item.id, { invisible: !currentInvisible });
  };

  // Toggle element lock
  const toggleElementLock = (e: React.MouseEvent, item: any, currentLocked: boolean) => {
    e.stopPropagation(); // Prevent selecting the element
    const updateMethod = getUpdateMethod(item);
    updateMethod(item.id, { locked: !currentLocked });
  };

  // Get proper display name for elements
  const getDisplayName = (item: any): string => {
    if (item.name) return item.name;
    
    // Return proper capitalized names
    switch (item.kind) {
      case "cylinder": return "Cylinder";
      case "rectangle": return "Rectangle";
      case "triangle": return "Triangle";
      case "continuousSource": return "Continuous Source";
      case "gaussianSource": return "Gaussian Source";
      case "eigenModeSource": return "Eigenmode Source";
      case "gaussianBeamSource": return "Gaussian Beam Source";
      case "pmlBoundary": return "PML Boundary";
      case "lattice": 
        // If linked to a full lattice, use its title
        if (item.latticeDocumentId && Array.isArray(fullLattices) && fullLattices.length > 0) {
          const fullLattice = fullLattices.find(l => l && l.documentId === item.latticeDocumentId);
          if (fullLattice && fullLattice.title && fullLattice.title.trim()) {
            return fullLattice.title;
          }
        }
        // Fallback to custom name or generic "Lattice"
        return (item.name && item.name.trim()) || "Lattice";
      case "fluxRegion":
        const sizeX = item.size?.x || 0;
        const sizeY = item.size?.y || 0;
        const regionShape = sizeX === 0 && sizeY === 0 ? 'Point' : 
                          (sizeX === 0 || sizeY === 0) ? 'Line' : 'Area';
        const regionType = item.regionType || 'flux';
        const capitalizedRegionType = regionType.charAt(0).toUpperCase() + regionType.slice(1);
        return `${regionShape} ${capitalizedRegionType} Region`;
      case "regionBox":
        const boxRegionType = item.regionType || 'flux';
        const capitalizedBoxRegionType = boxRegionType.charAt(0).toUpperCase() + boxRegionType.slice(1);
        return `${capitalizedBoxRegionType} Region Box`;
      default:
        return item.kind;
    }
  };

  // Group objects by type - separate PML boundaries from regular groups
  const pmlBoundary = boundaries.find(b => b.kind === "pmlBoundary");
  const regularGroups = [
    {
      name: "Geometries",
      key: "geometries" as const,
      items: geometries, // Show all geometries, including invisible ones
      getIcon: (item: any) => {
        switch (item.kind) {
          case "cylinder":
            return <Circle size={16} />;
          case "rectangle":
            return <Square size={16} />;
          case "triangle":
            return <TriangleIcon size={16} />;
          default:
            return <Square size={16} />;
        }
      },
    },
    {
      name: "Sources",
      key: "sources" as const,
      items: sources,
      getIcon: (item: any) => {
        switch (item.kind) {
          case "continuousSource":
            return <CustomLucideIcon src="/icons/wave_icon.svg" size={16} />;
          case "gaussianSource":
            return <CustomLucideIcon src="/icons/gauss_wave_package.svg" size={16} />;
          case "eigenModeSource":
            return <CustomLucideIcon src="/icons/quantum_harmonic_oscillator.svg" size={16} />;
          default:
            return <CustomLucideIcon src="/icons/wave_icon.svg" size={16} />;
        }
      },
    },
    {
      name: "Materials",
      key: "materials" as const,
      items: [],
      getIcon: () => <Square size={16} />,
    },
    {
      name: "Lattices",
      key: "lattices" as const,
      items: lattices,
      getIcon: (item: any) => <CustomLucideIcon src="/icons/lattice.svg" size={16} />,
    },
    {
      name: "Regions",
      key: "regions" as const,
      items: regions,
      getIcon: (item: any) => {
        switch (item.regionType) {
          case "flux":
            return <Target size={16} className="text-red-400" />;
          case "energy":
            return <Zap size={16} className="text-orange-400" />;
          case "force":
            return <Shield size={16} className="text-purple-400" />;
          default:
            return <Target size={16} className="text-gray-400" />;
        }
      },
    },
    {
      name: "Region Boxes",
      key: "regionBoxes" as const,
      items: regionBoxes,
      getIcon: (item: any) => {
        switch (item.regionType) {
          case "flux":
            return <Target size={16} className="text-red-400" />;
          case "energy":
            return <Zap size={16} className="text-orange-400" />;
          case "force":
            return <Shield size={16} className="text-purple-400" />;
          default:
            return <Target size={16} className="text-gray-400" />;
        }
      },
    },
  ].filter(group => group.items.length > 0); // Only show groups with items

  // Multi-select: ctrl/cmd/shift+click toggles, click without modifier selects only that
  const handleClick = (elId: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      selectGeometry(elId, { shift: true });
    } else {
      selectGeometry(elId);
    }
  };

  // Render a single object item (used for both PML and regular items)
  const renderObjectItem = (item: any, showGroupIcon: boolean = true) => (
    <div
      key={item.id}
      className={`flex items-center w-full px-1 ${compactMode ? 'py-0' : 'py-0.5'} text-xs transition-colors group relative ${
        selectedGeometryIds.includes(item.id)
          ? "bg-blue-600/20 text-blue-300"
          : "text-gray-300 hover:bg-neutral-700/30"
      }`}
    >
      {/* Icon (fixed width) - only show if not PML boundary */}
      <div className="flex-shrink-0 w-6 flex justify-center">
        {showGroupIcon && (
          <span className={item.invisible ? "opacity-40" : ""}>
            {getItemIcon(item)}
          </span>
        )}
      </div>
      
      {/* Name (flexible width) */}
      <button
        onClick={(e) => handleClick(item.id, e)}
        className="flex-1 text-left px-2 min-w-0"
      >
        <span className={`truncate block ${item.invisible ? "opacity-40" : ""}`}>
          {getDisplayName(item)}
        </span>
      </button>
      
      {/* Material indicator (fixed width) */}
      <div className="flex-shrink-0 w-6 flex justify-center">
        {item.material && (
          <div 
            className={`w-3 h-3 rounded-full border border-neutral-600 ${
              item.invisible ? "opacity-40" : ""
            }`}
            style={{ 
              backgroundColor: getMaterialColor(
                item.material, 
                MaterialCatalog[item.material as keyof typeof MaterialCatalog]?.color
              ) 
            }}
          />
        )}
      </div>
      
      {/* Lock icon (fixed width) */}
      <div className="flex-shrink-0 w-6 flex justify-center">
        <button
          onClick={(e) => toggleElementLock(e, item, item.locked || false)}
          className={`p-0.5 hover:bg-neutral-600 rounded transition-colors ${
            item.locked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          title={item.locked ? "Unlock object" : "Lock object"}
        >
          {item.locked ? (
            <Lock size={12} className="text-yellow-400" />
          ) : (
            <Unlock size={12} className="text-gray-400" />
          )}
        </button>
      </div>
      
      {/* Visibility icon (fixed width) */}
      <div className="flex-shrink-0 w-6 flex justify-center">
        <button
          onClick={(e) => toggleElementVisibility(e, item, item.invisible || false)}
          className={`p-0.5 hover:bg-neutral-600 rounded transition-colors ${
            item.invisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          title={item.invisible ? "Show object" : "Hide object"}
        >
          {item.invisible ? (
            <EyeOff size={12} className="text-gray-400" />
          ) : (
            <Eye size={12} className="text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );

  // Get icon for an item based on its type
  const getItemIcon = (item: any) => {
    // Geometries
    if (item.kind === "cylinder") return <Circle size={16} />;
    if (item.kind === "rectangle") return <Square size={16} />;
    if (item.kind === "triangle") return <TriangleIcon size={16} />;
    
    // Sources
    if (item.kind === "continuousSource") return <CustomLucideIcon src="/icons/wave_icon.svg" size={16} />;
    if (item.kind === "gaussianSource") return <CustomLucideIcon src="/icons/gauss_wave_package.svg" size={16} />;
    if (item.kind === "eigenModeSource") return <CustomLucideIcon src="/icons/quantum_harmonic_oscillator.svg" size={16} />;
    
    // Lattices
    if (item.kind === "lattice") return <CustomLucideIcon src="/icons/lattice.svg" size={16} />;
    
    // Regions
    if (item.kind === "fluxRegion") {
      switch (item.regionType) {
        case "flux": return <Target size={16} className="text-red-400" />;
        case "energy": return <Zap size={16} className="text-orange-400" />;
        case "force": return <Shield size={16} className="text-purple-400" />;
        default: return <Target size={16} className="text-gray-400" />;
      }
    }
    
    // Region Boxes
    if (item.kind === "regionBox") {
      switch (item.regionType) {
        case "flux": return <Target size={16} className="text-red-400" />;
        case "energy": return <Zap size={16} className="text-orange-400" />;
        case "force": return <Shield size={16} className="text-purple-400" />;
        default: return <Target size={16} className="text-gray-400" />;
      }
    }
    
    return <Square size={16} />;
  };

  return (
    <div className="space-y-1">
      {/* Header with compact mode toggle */}
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-sm font-medium text-gray-300">Objects</h3>
        <button
          onClick={() => setCompactMode(!compactMode)}
          className="p-1 hover:bg-neutral-700/50 rounded transition-colors"
          title={compactMode ? "Expand view" : "Compact view"}
        >
          <Logs size={14} className="text-gray-400 hover:text-gray-200" />
        </button>
      </div>
      
      {/* Check if we have any objects */}
      {!pmlBoundary && regularGroups.length === 0 ? (
        <div className="text-xs text-gray-500 italic px-2">No objects in scene</div>
      ) : (
        <div className="bg-neutral-900/50 rounded-md">
          {/* Special PML Boundary section (always at top) */}
          {pmlBoundary && (
            <>
              <div 
                className={`flex items-center w-full px-1 py-1.5 text-xs transition-colors group relative border-b border-neutral-700/50 ${
                  selectedGeometryIds.includes(pmlBoundary.id)
                    ? "bg-blue-600/20 text-blue-300"
                    : "text-orange-200/70 hover:bg-neutral-700/30"
                }`}
              >
                {/* Icon placeholder (empty for PML) */}
                <div className="flex-shrink-0 w-6 flex justify-center">
                  {/* No icon for PML boundary */}
                </div>
                
                {/* Name (flexible width) */}
                <button
                  onClick={(e) => handleClick(pmlBoundary.id, e)}
                  className="flex-1 text-left px-2 min-w-0"
                  title="Perfectly Matched Layer"
                >
                  <span className={`truncate block ${pmlBoundary.invisible ? "opacity-40" : ""}`}>
                    PML Boundary
                  </span>
                </button>
                
                {/* Material indicator (fixed width) - empty for PML */}
                <div className="flex-shrink-0 w-6 flex justify-center">
                  {/* No material indicator for PML boundary */}
                </div>
                
                {/* Lock icon (fixed width) */}
                <div className="flex-shrink-0 w-6 flex justify-center">
                  <button
                    onClick={(e) => toggleElementLock(e, pmlBoundary, pmlBoundary.locked || false)}
                    className={`p-0.5 hover:bg-neutral-600 rounded transition-colors ${
                      pmlBoundary.locked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    title={pmlBoundary.locked ? "Unlock object" : "Lock object"}
                  >
                    {pmlBoundary.locked ? (
                      <Lock size={12} className="text-yellow-400" />
                    ) : (
                      <Unlock size={12} className="text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* Visibility icon (fixed width) */}
                <div className="flex-shrink-0 w-6 flex justify-center">
                  <button
                    onClick={(e) => toggleElementVisibility(e, pmlBoundary, pmlBoundary.invisible || false)}
                    className={`p-0.5 hover:bg-neutral-600 rounded transition-colors ${
                      pmlBoundary.invisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    title={pmlBoundary.invisible ? "Show object" : "Hide object"}
                  >
                    {pmlBoundary.invisible ? (
                      <EyeOff size={12} className="text-gray-400" />
                    ) : (
                      <Eye size={12} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* Regular groups */}
          {regularGroups.map((group, groupIndex) => (
            <div key={group.key} className="border-b border-neutral-700/50 last:border-b-0">
              {/* Group header - only show in non-compact mode */}
              {!compactMode && (
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-neutral-700/30 transition-colors"
                >
                  <span>{group.name} ({group.items.length})</span>
                  {expandedGroups[group.key] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
              
              {/* Group items */}
              {(compactMode || expandedGroups[group.key]) && (
                <div className={compactMode ? "py-1" : "pb-1"}>
                  {group.items.map((item: any) => renderObjectItem(item, true))}
                </div>
              )}
              
              {/* Add subtle separator line in compact mode between categories */}
              {compactMode && groupIndex < regularGroups.length - 1 && (
                <div className="border-b border-neutral-700/30"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjectsList;
