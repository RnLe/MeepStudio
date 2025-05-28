"use client";
import React, { useState } from "react";
import { shallow } from "zustand/shallow";
import { Circle, Square, TriangleIcon, Zap, Radio, Waves, Beaker, ChevronDown, ChevronRight } from "lucide-react";
import { useCanvasStore } from "../providers/CanvasStore";
import { MeepProject } from "../types/meepProjectTypes";
import {
  Cylinder,
  Rectangle,
  Triangle,
  ContinuousSource,
  GaussianSource,
  PmlBoundary,
} from "../types/canvasElementTypes";

const ObjectsList: React.FC<{ project: MeepProject }> = ({ project }) => {
  const [expandedGroups, setExpandedGroups] = useState({
    geometries: true,
    sources: true,
    materials: false,
    boundaries: false,
  });

  const { geometries, sources, selectedGeometryIds, selectGeometry } = useCanvasStore(
    (s) => ({
      geometries: s.geometries,
      sources: s.sources,
      selectedGeometryIds: s.selectedGeometryIds,
      selectGeometry: s.selectGeometry,
    }),
    shallow
  );

  const toggleGroup = (group: keyof typeof expandedGroups) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // Group objects by type
  const groups = [
    {
      name: "Geometries",
      key: "geometries" as const,
      items: geometries,
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
      getLabel: (item: any) => {
        switch (item.kind) {
          case "cylinder":
            return `Circle (r=${item.radius})`;
          case "rectangle":
            return `Rectangle (${item.width}×${item.height})`;
          case "triangle":
            return `Triangle`;
          default:
            return item.kind;
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
            return <Zap size={12} />;
          case "gaussianSource":
            return <Radio size={12} />;
          case "eigenModeSource":
            return <Waves size={12} />;
          case "gaussianBeamSource":
            return <Beaker size={12} />;
          default:
            return <Zap size={12} />;
        }
      },
      getLabel: (item: any) => {
        switch (item.kind) {
          case "continuousSource":
            return `CW Source (${item.component || 'Ex'})`;
          case "gaussianSource":
            return `Gaussian (${item.component || 'Ex'})`;
          case "eigenModeSource":
            return `Eigenmode (Band ${item.eigBand || 1})`;
          case "gaussianBeamSource":
            return `Gaussian Beam (w₀=${item.beamW0 || 1})`;
          default:
            return item.kind;
        }
      },
    },
    {
      name: "Materials",
      key: "materials" as const,
      items: [],
      getIcon: () => <Square size={12} />,
      getLabel: () => "",
    },
    {
      name: "Boundaries",
      key: "boundaries" as const,
      items: [],
      getIcon: () => <Square size={12} />,
      getLabel: () => "",
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
                  <button
                    key={item.id}
                    onClick={() => selectGeometry(item.id)}
                    className={`flex items-center gap-2 w-full px-2 py-1 text-xs rounded transition-colors ${
                      selectedGeometryIds.includes(item.id)
                        ? "bg-blue-600/20 text-blue-300"
                        : "text-gray-300 hover:bg-neutral-700/50"
                    }`}
                  >
                    {group.getIcon(item)}
                    <span className="truncate">{group.getLabel(item)}</span>
                  </button>
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
