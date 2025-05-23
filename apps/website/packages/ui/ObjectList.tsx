"use client";
import React from "react";
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

interface ObjectsListProps {
  project: MeepProject;
}

const ObjectsList: React.FC<ObjectsListProps> = ({ project }) => {
  const { selectedIds, setSelectedIds, selectElement, geometries } = useCanvasStore((s) => ({
    selectedIds: s.selectedIds,
    setSelectedIds: s.setSelectedIds,
    selectElement: s.selectElement,
    geometries: s.geometries,
  }));
  // Use geometries from store, not from project
  const cylinders = geometries.filter((g) => g.kind === "cylinder") as Cylinder[];
  const rectangles = geometries.filter((g) => g.kind === "rectangle") as Rectangle[];
  const triangles = geometries.filter((g) => g.kind === "triangle") as Triangle[];
  const continuousSources = geometries.filter((g) => g.kind === "continuousSource") as ContinuousSource[];
  const gaussianSources = geometries.filter((g) => g.kind === "gaussianSource") as GaussianSource[];
  const pmlBoundaries = geometries.filter((g) => g.kind === "pmlBoundary") as PmlBoundary[];

  const elements = [
    ...cylinders,
    ...rectangles,
    ...triangles,
    ...continuousSources,
    ...gaussianSources,
    ...pmlBoundaries,
  ];

  // Multi-select: ctrl/cmd/shift+click toggles, click without modifier selects only that
  const handleClick = (elId: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      selectElement(elId, { shift: true });
    } else {
      selectElement(elId);
    }
  };

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-white">Objects</h4>
      {elements.map((el) => (
        <div
          key={el.id}
          onClick={(e) => handleClick(el.id, e)}
          className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
            selectedIds.includes(el.id) ? "bg-gray-700" : "hover:bg-gray-800"
          }`}
        >
          <span className="truncate text-gray-200 text-xs">
            {el.kind} – {el.id.slice(0, 5)}
          </span>
        </div>
      ))}
      {elements.length === 0 && (
        <p className="text-gray-500 text-xs">No objects yet</p>
      )}
    </div>
  );
};

export default ObjectsList;
