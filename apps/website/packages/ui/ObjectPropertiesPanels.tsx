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
import { ContinuousSourceProperties } from "./source-properties/ContinuousSourceProperties";
import { GaussianSourceProperties } from "./source-properties/GaussianSourceProperties";
import { EigenModeSourceProperties } from "./source-properties/EigenModeSourceProperties";
import { GaussianBeamSourceProperties } from "./source-properties/GaussianBeamSourceProperties";

interface Props {
  project: MeepProject;
  ghPages: boolean;
}

const ObjectPropertiesPanel: React.FC<Props> = ({ project, ghPages }) => {
  const { 
    selectedGeometryIds, 
    selectedGeometryId, 
    geometries, 
    sources,
    updateGeometry: updateGeometryStore,
    updateSource: updateSourceStore
  } = useCanvasStore((s) => ({
    selectedGeometryIds: s.selectedGeometryIds,
    selectedGeometryId: s.selectedGeometryId,
    geometries: s.geometries,
    sources: s.sources,
    updateGeometry: s.updateGeometry,
    updateSource: s.updateSource,
  }));
  
  const { updateProject } = useMeepProjects({ ghPages });
  
  // Update both local store and project for geometries
  const updateGeometry = (id: string, partial: Partial<any>) => {
    updateGeometryStore(id, partial);
    const updatedGeometries = useCanvasStore.getState().geometries;
    updateProject({
      documentId: project.documentId,
      project: {
        scene: {
          ...project.scene,
          geometries: updatedGeometries,
        }
      },
    });
  };

  // Update both local store and project for sources
  const updateSource = (id: string, partial: Partial<any>) => {
    updateSourceStore(id, partial);
    const updatedSources = useCanvasStore.getState().sources;
    updateProject({
      documentId: project.documentId,
      project: {
        scene: {
          ...project.scene,
          sources: updatedSources,
        }
      },
    });
  };

  // Multi-selection: if more than one selected, just show a message
  if (selectedGeometryIds.length > 1) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Properties</h3>
        <div className="text-sm text-gray-400">
          {selectedGeometryIds.length} objects selected
        </div>
      </div>
    );
  }

  // Find the selected element from both geometries and sources
  const allElements = [...geometries, ...sources];
  const selected = allElements.find((elem) => elem.id === selectedGeometryId);

  if (!selected) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Properties</h3>
        <p className="text-sm text-gray-500">Select an object to view properties</p>
      </div>
    );
  }

  // Determine if it's a geometry or source and create appropriate update handler
  const isSource = sources.some(s => s.id === selected.id);
  const handleUpdate = isSource 
    ? (partial: Partial<any>) => updateSource(selected.id, partial)
    : (partial: Partial<any>) => updateGeometry(selected.id, partial);

  const handleDelete = () => {
    if (isSource) {
      const updatedSources = sources.filter(s => s.id !== selected.id);
      updateProject({
        documentId: project.documentId,
        project: {
          scene: {
            ...project.scene,
            sources: updatedSources,
          }
        },
      });
      useCanvasStore.getState().removeSource(selected.id);
    } else {
      const updatedGeometries = geometries.filter(g => g.id !== selected.id);
      updateProject({
        documentId: project.documentId,
        project: {
          scene: {
            ...project.scene,
            geometries: updatedGeometries,
          }
        },
      });
      useCanvasStore.getState().removeGeometry(selected.id);
    }
  };

  const center = getGeometryCenter(selected);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300">Properties</h3>
      
      {!selected ? (
        <p className="text-sm text-gray-500">Select an object to view properties</p>
      ) : (
        <div className="space-y-3">
          {/* Geometry Properties */}
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
                        <span className="text-xs text-gray-400">Rotation</span>
                        <span className="text-xs text-gray-200 font-mono">{((cyl.orientation || 0) * 180 / Math.PI).toFixed(1)}°</span>
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
                        <span className="text-xs text-gray-200 font-mono">{((rect.orientation || 0) * 180 / Math.PI).toFixed(1)}°</span>
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
                      <div className="space-y-1.5">
                        <div className="bg-neutral-700/50 rounded px-2 py-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Rotation</span>
                            <span className="text-xs text-gray-200 font-mono">{((tri.orientation || 0) * 180 / Math.PI).toFixed(1)}°</span>
                          </div>
                        </div>
                        <div className="bg-neutral-700/50 rounded px-2 py-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Material</span>
                            <span className="text-xs text-gray-200">{tri.material || "air"}</span>
                          </div>
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

          {/* Source Properties */}
          {selected.kind === "continuousSource" && (
            <ContinuousSourceProperties 
              source={selected} 
              onUpdate={handleUpdate}
            />
          )}
          
          {selected.kind === "gaussianSource" && (
            <GaussianSourceProperties 
              source={selected} 
              onUpdate={handleUpdate}
              projectUnit={project.scene?.unit}
              projectA={project.scene?.a}
            />
          )}
          
          {selected.kind === "eigenModeSource" && (
            <EigenModeSourceProperties 
              source={selected} 
              onUpdate={handleUpdate}
            />
          )}
          
          {selected.kind === "gaussianBeamSource" && (
            <GaussianBeamSourceProperties 
              source={selected} 
              onUpdate={handleUpdate}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ObjectPropertiesPanel;
