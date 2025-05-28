"use client";
import React from "react";
import { useCanvasStore } from "../providers/CanvasStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { MeepProject } from "../types/meepProjectTypes";
import {
  Cylinder,
  Rectangle as RectType,
  ContinuousSource,
  GaussianSource,
  PmlBoundary,
  Triangle,
} from "../types/canvasElementTypes";
import { Vector2d } from "konva/lib/types";
import { LabeledVector } from "./MathVector";
import { getGeometryCenter } from "../utils/geometryCalculations";

interface ObjectPropertiesPanelProps {
  project: MeepProject;
  ghPages: boolean;
}

const ObjectPropertiesPanel: React.FC<ObjectPropertiesPanelProps> = ({ project, ghPages }) => {
  const { selectedGeometryIds, selectedGeometryId, geometries, updateGeometry: updateGeometryStore } = useCanvasStore((s) => ({
    selectedGeometryIds: s.selectedGeometryIds,
    selectedGeometryId: s.selectedGeometryId,
    geometries: s.geometries,
    updateGeometry: s.updateGeometry,
  }));
  const { updateProject } = useMeepProjects({ ghPages });
  // Use geometries from store, not from project
  const cylinders = geometries.filter((g) => g.kind === "cylinder") as Cylinder[];
  const rectangles = geometries.filter((g) => g.kind === "rectangle") as RectType[];
  const triangles = geometries.filter((g) => g.kind === "triangle") as Triangle[];
  const continuousSources = geometries.filter((g) => g.kind === "continuousSource") as ContinuousSource[];
  const gaussianSources = geometries.filter((g) => g.kind === "gaussianSource") as GaussianSource[];
  const pmlBoundaries = geometries.filter((g) => g.kind === "pmlBoundary") as PmlBoundary[];
  // Update both local store and project
  const updateGeometry = (id: string, partial: Partial<any>) => {
    updateGeometryStore(id, partial); // update local store for instant UI
    updateProject({
      documentId: project.documentId,
      project: {
        scene: {
          ...project.scene,
          geometries: geometries.map((g) => (g.id === id ? { ...g, ...partial } : g)),
        }
      },
    });
  };

  // Multi-selection: if more than one selected, just show a message
  if (selectedGeometryIds.length > 1) {
    return <div>{selectedGeometryIds.length} objects selected</div>;
  }

  // Find the selected element
  const selected = geometries.find((g) => g.id === selectedGeometryId);

  if (!selected) return <div>No element selected</div>;

  const center = getGeometryCenter(selected);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-white">Properties</h4>

      {selected.kind === "cylinder" && (() => {
        const cyl = selected as Cylinder;
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300">Cylinder Properties</h3>
            
            {/* Compact 2-column grid layout */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left column - Parameters */}
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2">Parameters</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">Radius</span>
                    <span className="text-xs text-gray-200 font-mono">{cyl.radius.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">Material</span>
                    <span className="text-xs text-gray-200">{cyl.material || "air"}</span>
                  </div>
                </div>
              </div>
              
              {/* Right column - Position */}
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2">Position</h4>
                <div className="bg-neutral-700/50 rounded px-2 py-1">
                  <LabeledVector
                    label="center"
                    values={[center.x, center.y]}
                    color="text-blue-400"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {selected.kind === "rectangle" && (() => {
        const rect = selected as RectType;
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300">Rectangle Properties</h3>
            
            {/* Compact 3-column grid layout */}
            <div className="grid grid-cols-3 gap-3">
              {/* Left column - Dimensions */}
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2">Dimensions</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">W</span>
                    <span className="text-xs text-gray-200 font-mono">{rect.width.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">H</span>
                    <span className="text-xs text-gray-200 font-mono">{rect.height.toFixed(3)}</span>
                  </div>
                </div>
              </div>
              
              {/* Middle column - Transform */}
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2">Transform</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">Rot</span>
                    <span className="text-xs text-gray-200 font-mono">{(rect.rotation || 0).toFixed(1)}°</span>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">Mat</span>
                    <span className="text-xs text-gray-200">{rect.material || "air"}</span>
                  </div>
                </div>
              </div>
              
              {/* Right column - Position */}
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2">Position</h4>
                <div className="bg-neutral-700/50 rounded px-2 py-1">
                  <LabeledVector
                    label="c"
                    values={[center.x, center.y]}
                    color="text-green-400"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {selected.kind === "triangle" && (() => {
        const tri = selected as Triangle;
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300">Triangle Properties</h3>
            
            {/* 2-column layout for triangle */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left column - Vertices */}
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2">Vertices (relative)</h4>
                <div className="space-y-1">
                  {tri.vertices.map((v, i) => (
                    <div key={i} className="bg-neutral-700/50 rounded px-2 py-0.5">
                      <LabeledVector
                        label={`v${i + 1}`}
                        values={[v.x, v.y]}
                        color={i === 0 ? "text-purple-400" : i === 1 ? "text-pink-400" : "text-amber-400"}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right column - Properties & Position */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Properties</h4>
                  <div className="bg-neutral-700/50 rounded px-2 py-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Material</span>
                      <span className="text-xs text-gray-200">{tri.material || "air"}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Position</h4>
                  <div className="bg-neutral-700/50 rounded px-2 py-1">
                    <LabeledVector
                      label="anchor"
                      values={[center.x, center.y]}
                      color="text-orange-400"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {selected.kind === "continuousSource" && (() => {
        const src = selected as ContinuousSource;
        return (
          <>
            <label className="block text-xs text-gray-400">Wavelength</label>
            <input
              type="number"
              value={src.wavelength}
              onChange={(e) =>
                updateGeometry(src.id, { wavelength: Number(e.target.value) })
              }
              className="w-full bg-gray-800 text-sm"
            />

            <label className="block text-xs text-gray-400">Amplitude</label>
            <input
              type="number"
              value={src.amplitude}
              onChange={(e) =>
                updateGeometry(src.id, { amplitude: Number(e.target.value) })
              }
              className="w-full bg-gray-800 text-sm"
            />
          </>
        );
      })()}

      {selected.kind === "gaussianSource" && (() => {
        const src = selected as GaussianSource;
        return (
          <>
            <label className="block text-xs text-gray-400">Centre Frequency</label>
            <input
              type="number"
              value={src.centreFreq}
              onChange={(e) =>
                updateGeometry(src.id, { centreFreq: Number(e.target.value) })
              }
              className="w-full bg-gray-800 text-sm"
            />

            <label className="block text-xs text-gray-400">FWHM</label>
            <input
              type="number"
              value={src.fwhm}
              onChange={(e) =>
                updateGeometry(src.id, { fwhm: Number(e.target.value) })
              }
              className="w-full bg-gray-800 text-sm"
            />
          </>
        );
      })()}

      {selected.kind === "pmlBoundary" && (() => {
        const pml = selected as PmlBoundary;
        return (
          <>
            <label className="block text-xs text-gray-400">Thickness</label>
            <input
              type="number"
              value={pml.thickness}
              onChange={(e) =>
                updateGeometry(pml.id, { thickness: Number(e.target.value) })
              }
              className="w-full bg-gray-800 text-sm"
            />
          </>
        );
      })()}

      {selected.kind !== "cylinder" && selected.kind !== "rectangle" && selected.kind !== "triangle" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">{selected.kind} Properties</h3>
          
          {/* Generic compact layout */}
          <div className="space-y-2">
            <div className="bg-neutral-700/50 rounded px-2 py-1">
              <h4 className="text-xs font-medium text-gray-400 mb-1">Position</h4>
              <LabeledVector
                label="pos"
                values={[center.x, center.y]}
                color="text-gray-300"
                size="sm"
              />
            </div>
            
            {selected.material && (
              <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                <span className="text-xs text-gray-400">Material</span>
                <span className="text-xs text-gray-200">{selected.material}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectPropertiesPanel;
