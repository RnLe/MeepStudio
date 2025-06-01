"use client";
import React from "react";
import { useCanvasStore } from "../providers/CanvasStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { LengthUnit } from "../types/meepProjectTypes";
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
import { PMLBoundaryProperties } from "./boundary-properties/PMLBoundaryProperties";
import SceneLatticeProperties from "./SceneLatticeProperties";
import { SceneCylinderProperties } from "./geometry-properties/SceneCylinderProperties";

interface ObjectPropertiesPanelProps {
  project: MeepProject;
  ghPages: boolean;
  projectA?: number;
  projectUnit?: LengthUnit;
}

const ObjectPropertiesPanel: React.FC<ObjectPropertiesPanelProps> = ({ 
  project, 
  ghPages,
  projectA = 1,
  projectUnit = LengthUnit.NM
}) => {
  const { 
    selectedGeometryIds, 
    selectedGeometryId, 
    geometries, 
    sources,
    boundaries,
    lattices,
    updateGeometry: updateGeometryStore,
    updateSource: updateSourceStore,
    updateBoundary: updateBoundaryStore
  } = useCanvasStore((s) => ({
    selectedGeometryIds: s.selectedGeometryIds,
    selectedGeometryId: s.selectedGeometryId,
    geometries: s.geometries,
    sources: s.sources,
    boundaries: s.boundaries,
    lattices: s.lattices,
    updateGeometry: s.updateGeometry,
    updateSource: s.updateSource,
    updateBoundary: s.updateBoundary,
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

  // Update both local store and project for boundaries
  const updateBoundary = (id: string, partial: Partial<any>) => {
    updateBoundaryStore(id, partial);
    const updatedBoundaries = useCanvasStore.getState().boundaries;
    updateProject({
      documentId: project.documentId,
      project: {
        scene: {
          ...project.scene,
          boundaries: updatedBoundaries,
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

  // Find the selected element from geometries, sources, and boundaries
  const allElements = [...geometries, ...sources, ...boundaries, ...lattices];
  const selected = allElements.find((elem) => elem.id === selectedGeometryId);

  // Determine element type and create appropriate update handler
  const isSource = sources.some(s => s.id === selected?.id);
  const isBoundary = boundaries.some(b => b.id === selected?.id);
  const isLattice = lattices.some(l => l.id === selected?.id);
  
  const handleUpdate = isBoundary
    ? (partial: Partial<any>) => updateBoundary(selected.id, partial)
    : isSource 
    ? (partial: Partial<any>) => updateSource(selected.id, partial)
    : (partial: Partial<any>) => updateGeometry(selected.id, partial);

  const handleDelete = () => {
    if (isBoundary) {
      const updatedBoundaries = boundaries.filter(b => b.id !== selected.id);
      updateProject({
        documentId: project.documentId,
        project: {
          scene: {
            ...project.scene,
            boundaries: updatedBoundaries,
          }
        },
      });
      useCanvasStore.getState().removeBoundary(selected.id);
    } else if (isSource) {
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

  // Find selected element across all types – hook is unconditional
  const selectedElement = React.useMemo(() => {
    // RETURN early only when **no** geometry is selected
    if (!selectedGeometryId) return null;
    
    // Check geometries
    const geom = geometries.find(g => g.id === selectedGeometryId);
    if (geom) return { type: 'geometry', element: geom };
    
    // Check sources
    const source = sources.find(s => s.id === selectedGeometryId);
    if (source) return { type: 'source', element: source };
    
    // Check boundaries
    const boundary = boundaries.find(b => b.id === selectedGeometryId);
    if (boundary) return { type: 'boundary', element: boundary };
    
    // Check lattices
    const lattice = lattices.find(l => l.id === selectedGeometryId);
    if (lattice) return { type: 'lattice', element: lattice };
    
    return null;
  }, [selectedGeometryId, geometries, sources, boundaries, lattices]);
  
  /* --------------------------------------------
   * RENDER
   * ------------------------------------------ */
  return (
    <div className="space-y-3">
      {/* nothing selected → show hint instead of early-returning */}
      {!selectedElement && (
        <div className="text-xs text-gray-500 italic text-center py-4">
          Select an object to edit its properties
        </div>
      )}

      {selectedElement?.type === 'geometry' && (
        <div className="space-y-3">
          {/* Geometry Properties */}
          {selectedElement.element.kind === "cylinder" && (
            <SceneCylinderProperties
              cylinder={selectedElement.element}
              project={project}
              ghPages={ghPages}
              projectA={projectA}
              projectUnit={projectUnit}
            />
          )}

          {selectedElement.element.kind === "rectangle" && (() => {
            const rect = selectedElement.element as RectType;
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

          {selectedElement.element.kind === "triangle" && (() => {
            const tri = selectedElement.element as Triangle;
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
        </div>
      )}

      {selectedElement?.type === 'source' && (
        <>
          {/* Source Properties */}
          {selectedElement.element.kind === "continuousSource" && (
            <ContinuousSourceProperties 
              source={selectedElement.element} 
              onUpdate={handleUpdate}
              projectA={projectA}
              projectUnit={projectUnit}
            />
          )}
          
          {selectedElement.element.kind === "gaussianSource" && (
            <GaussianSourceProperties 
              source={selectedElement.element} 
              onUpdate={handleUpdate}
              projectA={projectA}
              projectUnit={projectUnit}
            />
          )}
          
          {selectedElement.element.kind === "eigenModeSource" && (
            <EigenModeSourceProperties 
              source={selectedElement.element} 
              onUpdate={handleUpdate}
            />
          )}
          
          {selectedElement.element.kind === "gaussianBeamSource" && (
            <GaussianBeamSourceProperties 
              source={selectedElement.element} 
              onUpdate={handleUpdate}
            />
          )}
        </>
      )}

      {selectedElement?.type === 'boundary' && (
        <PMLBoundaryProperties 
          boundary={selectedElement.element} 
          onUpdate={handleUpdate}
        />
      )}

      {selectedElement?.type === 'lattice' && (
        <SceneLatticeProperties
          lattice={selectedElement.element}
          project={project}
          ghPages={ghPages}
        />
      )}
    </div>
  );
};

export default ObjectPropertiesPanel;
