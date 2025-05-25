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

interface ObjectPropertiesPanelProps {
  project: MeepProject;
  ghPages: boolean;
}

const ObjectPropertiesPanel: React.FC<ObjectPropertiesPanelProps> = ({ project, ghPages }) => {
  const { selectedIds, selectedId, geometries, updateGeometry: updateGeometryStore } = useCanvasStore((s) => ({
    selectedIds: s.selectedIds,
    selectedId: s.selectedId,
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
  if (selectedIds.length > 1) {
    return <div>{selectedIds.length} objects selected</div>;
  }

  // Find the selected element
  const selected = geometries.find((g) => g.id === selectedId);

  if (!selected) return <div>No element selected</div>;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-white">Properties</h4>

      {selected.kind === "cylinder" && (() => {
        const cyl = selected as Cylinder;
        return (
          <>
            <label className="block text-xs text-gray-400">Radius</label>
            <input
              type="number"
              value={cyl.radius}
              onChange={(e) =>
                updateGeometry(cyl.id, { radius: Number(e.target.value) })
              }
              className="w-full bg-gray-800 text-sm"
            />
          </>
        );
      })()}

      {selected.kind === "rectangle" && (() => {
        const rect = selected as RectType;
        return (
          <>
            <label className="block text-xs text-gray-400">Width</label>
            <input
              type="number"
              value={rect.width}
              onChange={(e) =>
                updateGeometry(rect.id, { width: Number(e.target.value) })
              }
              className="w-full bg-gray-800 text-sm"
            />

            <label className="block text-xs text-gray-400">Height</label>
            <input
              type="number"
              value={rect.height}
              onChange={(e) =>
                updateGeometry(rect.id, { height: Number(e.target.value) })
              }
              className="w-full bg-gray-800 text-sm"
            />
          </>
        );
      })()}

      {selected.kind === "triangle" && (() => {
        const tri = selected as Triangle;
        return (
          <>
            <label className="block text-xs text-gray-400">Vertices</label>
            {tri.vertices.map((v, i) => (
              <div key={i} className="flex space-x-2 mb-1">
                <span className="text-gray-400">{String.fromCharCode(65 + i)}:</span>
                <input
                  type="number"
                  value={v.x}
                  onChange={e => {
                    const newVerts = [...tri.vertices] as [Vector2d, Vector2d, Vector2d];
                    newVerts[i] = { ...newVerts[i], x: Number(e.target.value) };
                    updateGeometry(tri.id, { vertices: newVerts });
                  }}
                  className="w-16 bg-gray-800 text-sm"
                />
                <input
                  type="number"
                  value={v.y}
                  onChange={e => {
                    const newVerts = [...tri.vertices] as [Vector2d, Vector2d, Vector2d];
                    newVerts[i] = { ...newVerts[i], y: Number(e.target.value) };
                    updateGeometry(tri.id, { vertices: newVerts });
                  }}
                  className="w-16 bg-gray-800 text-sm"
                />
              </div>
            ))}
          </>
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
    </div>
  );
};

export default ObjectPropertiesPanel;
