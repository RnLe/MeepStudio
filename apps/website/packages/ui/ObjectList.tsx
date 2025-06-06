"use client";
import React, { useState } from "react";
import { shallow } from "zustand/shallow";
import { Circle, Square, TriangleIcon, ChevronDown, ChevronRight, Shield, Sparkles, Eye, EyeOff } from "lucide-react";
import { useCanvasStore } from "../providers/CanvasStore";
import { MeepProject } from "../types/meepProjectTypes";
import CustomLucideIcon from "./CustomLucideIcon";
import { MaterialCatalog } from "../constants/meepMaterialPresets";
import { useMaterialColorStore } from "../providers/MaterialColorStore";

const ObjectsList: React.FC<{ project: MeepProject }> = ({ project }) => {
  const [expandedGroups, setExpandedGroups] = useState({
    geometries: true,
    sources: true,
    materials: false,
    boundaries: true,
    lattices: true,
  });

  const { geometries, sources, boundaries, lattices, selectedGeometryIds, selectGeometry, updateGeometry } = useCanvasStore(
    (s) => ({
      geometries: s.geometries,
      sources: s.sources,
      boundaries: s.boundaries,
      lattices: s.lattices,
      selectedGeometryIds: s.selectedGeometryIds,
      selectGeometry: s.selectGeometry,
      updateGeometry: s.updateGeometry,
    }),
    shallow
  );

  const { getMaterialColor } = useMaterialColorStore();
  
  const toggleGroup = (group: keyof typeof expandedGroups) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  
  // Toggle geometry visibility
  const toggleGeometryVisibility = (e: React.MouseEvent, geometryId: string, currentInvisible: boolean) => {
    e.stopPropagation(); // Prevent selecting the geometry
    updateGeometry(geometryId, { invisible: !currentInvisible });
  };

  // Group objects by type - don't filter invisible geometries anymore
  const groups = [
    {
      name: "Geometries",
      key: "geometries" as const,
      items: geometries, // Show all geometries, including invisible ones
      getIcon: (item: any) => {
        switch (item.kind) {
          case "cylinder":
            return <Circle size={12} />;
          case "rectangle":
            return <Square size={12} />;
          case "triangle":
            return <TriangleIcon size={12} />;
          default:
            return <Square size={12} />;
        }
      },
      getLabel: (item: any) => item.name ?? item.kind,
    },
    {
      name: "Sources",
      key: "sources" as const,
      items: sources,
      getIcon: (item: any) => {
        switch (item.kind) {
          case "continuousSource":
            return <CustomLucideIcon src="/icons/wave_icon.svg" size={20} />;
          case "gaussianSource":
            return <CustomLucideIcon src="/icons/gauss_wave_package.svg" size={20} />;
          case "eigenModeSource":
            return <CustomLucideIcon src="/icons/quantum_harmonic_oscillator.svg" size={20} />;
          default:
            return <CustomLucideIcon src="/icons/wave_icon.svg" size={20} />;
        }
      },
      getLabel: (item: any) => item.name ?? item.kind, // <- only the name
    },
    {
      name: "Materials",
      key: "materials" as const,
      items: [],
      getIcon: () => <Square size={12} />,
      getLabel: (item: any) => item.name ?? item.kind, // placeholder
    },
    {
      name: "Boundaries",
      key: "boundaries" as const,
      items: boundaries,
      getIcon: (item: any) => <Shield size={12} />,
      getLabel: (item: any) => item.name ?? item.kind, // <- only the name
    },
    {
      name: "Lattices",
      key: "lattices" as const,
      items: lattices,
      getIcon: (item: any) => <Sparkles size={12} />,
      getLabel: (item: any) => {
        const mult = item.multiplier || 3;
        return `${mult}×${mult} Lattice`;
      }, // <- only the name
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

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-300">Objects</h3>
      
      {groups.length === 0 ? (
        <div className="text-xs text-gray-500 italic">No objects in scene</div>
      ) : (
        groups.map((group) => (
          <div key={group.key} className="space-y-1">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.key)}
              className="flex items-center justify-between w-full px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-neutral-700/50 rounded transition-colors"
            >
              <span>{group.name} ({group.items.length})</span>
              {expandedGroups[group.key] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {/* Group items */}
            {expandedGroups[group.key] && (
              <div className="pl-2 space-y-0.5">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 w-full px-2 py-1 text-xs rounded transition-colors group ${
                      selectedGeometryIds.includes(item.id)
                        ? "bg-blue-600/20 text-blue-300"
                        : "text-gray-300 hover:bg-neutral-700/50"
                    }`}
                  >
                    <button
                      onClick={() => selectGeometry(item.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className={item.invisible ? "opacity-40" : ""}>
                        {group.getIcon(item)}
                      </span>
                      <span className={`truncate ${item.invisible ? "opacity-40" : ""}`}>
                        {group.getLabel(item)}
                      </span>

                      {/* Material color indicator for geometries */}
                      {group.key === 'geometries' && item.material && (
                        <div 
                          className={`w-2 h-2 rounded-full border border-neutral-600 ${
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
                    </button>
                    
                    {/* Eye icon for geometries */}
                    {group.key === 'geometries' && (
                      <button
                        onClick={(e) => toggleGeometryVisibility(e, item.id, item.invisible || false)}
                        className="p-0.5 hover:bg-neutral-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title={item.invisible ? "Show geometry" : "Hide geometry"}
                      >
                        {item.invisible ? (
                          <EyeOff size={12} className="text-gray-400" />
                        ) : (
                          <Eye size={12} className="text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ObjectsList;
