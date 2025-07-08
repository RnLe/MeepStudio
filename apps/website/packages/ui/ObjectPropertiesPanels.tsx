"use client";
import React from "react";
import { useCanvasStore } from "../providers/CanvasStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useOptimizedUpdates } from "../hooks/useOptimizedUpdates";
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
import { ContinuousSourceProperties } from "./source-properties/ContinuousSourceProperties";
import { GaussianSourceProperties } from "./source-properties/GaussianSourceProperties";
import { EigenModeSourceProperties } from "./source-properties/EigenModeSourceProperties";
import { GaussianBeamSourceProperties } from "./source-properties/GaussianBeamSourceProperties";
import { PMLBoundaryProperties } from "./boundary-properties/PMLBoundaryProperties";
import { RegionProperties } from "./region-properties/RegionProperties";
import { RegionBoxProperties } from "./region-properties/RegionBoxProperties";
import SceneLatticeProperties from "./SceneLatticeProperties";
import { SceneCylinderProperties } from "./geometry-properties/SceneCylinderProperties";
import { SceneTriangleProperties } from "./geometry-properties/SceneTriangleProperties";

interface ObjectPropertiesPanelProps {
  ghPages: boolean;
}

const ObjectPropertiesPanel: React.FC<ObjectPropertiesPanelProps> = ({ 
  ghPages
}) => {
  const { 
    selectedGeometryIds, 
    selectedGeometryId, 
    geometries, 
    sources,
    boundaries,
    lattices,
    regions,
    regionBoxes,
    updateGeometry: updateGeometryStore,
    updateSource: updateSourceStore,
    updateBoundary: updateBoundaryStore,
    updateRegion: updateRegionStore,
    updateRegionBox: updateRegionBoxStore
  } = useCanvasStore((s) => ({
    selectedGeometryIds: s.selectedGeometryIds,
    selectedGeometryId: s.selectedGeometryId,
    geometries: s.geometries,
    sources: s.sources,
    boundaries: s.boundaries,
    lattices: s.lattices,
    regions: s.regions,
    regionBoxes: s.regionBoxes,
    updateGeometry: s.updateGeometry,
    updateSource: s.updateSource,
    updateBoundary: s.updateBoundary,
    updateRegion: s.updateRegion,
    updateRegionBox: s.updateRegionBox,
  }));
  
  // Use optimized updates that get the current project from active tab
  const { updateImmediate, updateDeferred, persistNow, setDragging, project } = useOptimizedUpdates();
  
  // Local timer for debouncing regular input changes (not drag-related)
  const persistenceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
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
    
    // Check regions
    const region = regions.find(r => r.id === selectedGeometryId);
    if (region) return { type: 'region', element: region };
    
    // Check region boxes
    const regionBox = regionBoxes.find(rb => rb.id === selectedGeometryId);
    if (regionBox) return { type: 'regionBox', element: regionBox };
    
    return null;
  }, [selectedGeometryId, geometries, sources, boundaries, lattices, regions, regionBoxes]);
  
  // Derive project properties
  const projectA = project?.scene?.a || 1;
  const projectUnit = project?.scene?.unit || LengthUnit.NM;
  
  // Enhanced update functions that handle drag interactions
  const updateGeometry = (id: string, partial: Partial<any>) => {
    updateImmediate('geometry', id, partial);
    
    // Debounced persistence for non-drag interactions
    if (persistenceTimerRef.current) {
      clearTimeout(persistenceTimerRef.current);
    }
    persistenceTimerRef.current = setTimeout(() => {
      updateDeferred('geometry', id, partial);
    }, 500);
  };

  const updateSource = (id: string, partial: Partial<any>) => {
    updateImmediate('source', id, partial);
    
    // Debounced persistence for non-drag interactions
    if (persistenceTimerRef.current) {
      clearTimeout(persistenceTimerRef.current);
    }
    persistenceTimerRef.current = setTimeout(() => {
      updateDeferred('source', id, partial);
    }, 500);
  };

  const updateBoundary = (id: string, partial: Partial<any>) => {
    updateImmediate('boundary', id, partial);
    
    // Debounced persistence for non-drag interactions
    if (persistenceTimerRef.current) {
      clearTimeout(persistenceTimerRef.current);
    }
    persistenceTimerRef.current = setTimeout(() => {
      updateDeferred('boundary', id, partial);
    }, 500);
  };
  
  const updateRegion = (id: string, partial: Partial<any>) => {
    updateImmediate('region', id, partial);
    
    // Debounced persistence for non-drag interactions
    if (persistenceTimerRef.current) {
      clearTimeout(persistenceTimerRef.current);
    }
    persistenceTimerRef.current = setTimeout(() => {
      updateDeferred('region', id, partial);
    }, 500);
  };
  
  const updateRegionBox = (id: string, partial: Partial<any>) => {
    updateImmediate('regionBox', id, partial);
    
    // Debounced persistence for non-drag interactions
    if (persistenceTimerRef.current) {
      clearTimeout(persistenceTimerRef.current);
    }
    persistenceTimerRef.current = setTimeout(() => {
      updateDeferred('regionBox', id, partial);
    }, 500);
  };
  
  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (persistenceTimerRef.current) {
        clearTimeout(persistenceTimerRef.current);
      }
    };
  }, []);

  // Determine element type and create appropriate handlers (only if element exists)
  const isSource = selectedElement?.type === 'source';
  const isBoundary = selectedElement?.type === 'boundary';
  const isLattice = selectedElement?.type === 'lattice';
  const isRegion = selectedElement?.type === 'region';
  const isRegionBox = selectedElement?.type === 'regionBox';
  
  const handleUpdate = React.useCallback((partial: Partial<any>) => {
    if (!selectedElement) return;
    
    if (isBoundary) {
      updateBoundary(selectedElement.element.id, partial);
    } else if (isSource) {
      updateSource(selectedElement.element.id, partial);
    } else if (isRegion) {
      updateRegion(selectedElement.element.id, partial);
    } else if (isRegionBox) {
      updateRegionBox(selectedElement.element.id, partial);
    } else {
      updateGeometry(selectedElement.element.id, partial);
    }
  }, [selectedElement, isBoundary, isSource, isRegion, isRegionBox, updateBoundary, updateSource, updateRegion, updateRegionBox, updateGeometry]);
    
  // Create drag-aware update handlers for Dial components
  const dialHandlers = React.useMemo(() => {
    if (!selectedElement) return { onDragStart: () => {}, onDragEnd: () => {} };
    
    return {
      onDragStart: () => setDragging(true),
      onDragEnd: () => setDragging(false),
    };
  }, [selectedElement, setDragging]);

  const handleDelete = React.useCallback(() => {
    if (!selectedElement) return;
    
    if (isBoundary) {
      useCanvasStore.getState().removeBoundary(selectedElement.element.id);
    } else if (isSource) {
      useCanvasStore.getState().removeSource(selectedElement.element.id);
    } else if (isRegion) {
      useCanvasStore.getState().removeRegion(selectedElement.element.id);
    } else if (isRegionBox) {
      useCanvasStore.getState().removeRegionBox(selectedElement.element.id);
    } else {
      useCanvasStore.getState().removeGeometry(selectedElement.element.id);
    }
    persistNow(); // Immediate persistence after deletion
  }, [selectedElement, isBoundary, isSource, isRegion, isRegionBox, persistNow]);
  
  /* --------------------------------------------
   * RENDER
   * ------------------------------------------ */
  return (
    <div className="space-y-3">
      {/* No project selected */}
      {!project && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Properties</h3>
          <div className="text-sm text-gray-400">No project selected</div>
        </div>
      )}

      {/* Multi-selection */}
      {project && selectedGeometryIds.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Properties</h3>
          <div className="text-sm text-gray-400">
            {selectedGeometryIds.length} objects selected
          </div>
        </div>
      )}

      {/* Nothing selected → show hint instead of early-returning */}
      {project && selectedGeometryIds.length <= 1 && !selectedElement && (
        <div className="text-xs text-gray-500 italic text-center py-4">
          Select an object to edit its properties
        </div>
      )}

      {/* Single object selected */}
      {project && selectedGeometryIds.length <= 1 && selectedElement && (
        <>
          {selectedElement.type === 'geometry' && (
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
                            <input
                              type="number"
                              value={rect.width.toFixed(3)}
                              onChange={(e) => updateGeometry(rect.id, { width: parseFloat(e.target.value) || 0 })}
                              className="text-xs text-gray-200 font-mono bg-transparent text-right w-16 outline-none"
                              step="0.001"
                            />
                          </div>
                          <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                            <span className="text-xs text-gray-400">H</span>
                            <input
                              type="number"
                              value={rect.height.toFixed(3)}
                              onChange={(e) => updateGeometry(rect.id, { height: parseFloat(e.target.value) || 0 })}
                              className="text-xs text-gray-200 font-mono bg-transparent text-right w-16 outline-none"
                              step="0.001"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Middle column - Transform */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-2">Transform</h4>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                            <span className="text-xs text-gray-400">Rot</span>
                            <input
                              type="number"
                              value={((rect.orientation || 0) * 180 / Math.PI).toFixed(1)}
                              onChange={(e) => updateGeometry(rect.id, { orientation: parseFloat(e.target.value) * Math.PI / 180 || 0 })}
                              className="text-xs text-gray-200 font-mono bg-transparent text-right w-12 outline-none"
                              step="0.1"
                            />
                            <span className="text-xs text-gray-400">°</span>
                          </div>
                          <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                            <span className="text-xs text-gray-400">Mat</span>
                            <input
                              type="text"
                              value={rect.material || "air"}
                              onChange={(e) => updateGeometry(rect.id, { material: e.target.value })}
                              className="text-xs text-gray-200 bg-transparent text-right w-16 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Right column - Position */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-2">Position</h4>
                        <div className="bg-neutral-700/50 rounded px-2 py-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">X</span>
                            <input
                              type="number"
                              value={rect.pos.x.toFixed(3)}
                              onChange={(e) => updateGeometry(rect.id, { pos: { ...rect.pos, x: parseFloat(e.target.value) || 0 } })}
                              className="text-xs text-green-400 font-mono bg-transparent text-right w-16 outline-none"
                              step="0.001"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Y</span>
                            <input
                              type="number"
                              value={rect.pos.y.toFixed(3)}
                              onChange={(e) => updateGeometry(rect.id, { pos: { ...rect.pos, y: parseFloat(e.target.value) || 0 } })}
                              className="text-xs text-green-400 font-mono bg-transparent text-right w-16 outline-none"
                              step="0.001"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

          {selectedElement.element.kind === "triangle" && (
            <SceneTriangleProperties
              triangle={selectedElement.element}
              project={project}
              ghPages={ghPages}
              projectA={projectA}
              projectUnit={projectUnit}
            />
          )}
            </div>
          )}

          {selectedElement.type === 'source' && (
            <>
              {/* Source Properties */}
              {selectedElement.element.kind === "continuousSource" && (
                <ContinuousSourceProperties 
                  source={selectedElement.element} 
                  onUpdate={handleUpdate}
                  onDragStart={dialHandlers.onDragStart}
                  onDragEnd={dialHandlers.onDragEnd}
                  projectA={projectA}
                  projectUnit={projectUnit}
                />
              )}
              
              {selectedElement.element.kind === "gaussianSource" && (
                <GaussianSourceProperties 
                  source={selectedElement.element} 
                  onUpdate={handleUpdate}
                  onDragStart={dialHandlers.onDragStart}
                  onDragEnd={dialHandlers.onDragEnd}
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

          {selectedElement.type === 'boundary' && (
            <PMLBoundaryProperties 
              boundary={selectedElement.element} 
              onUpdate={handleUpdate}
            />
          )}

          {selectedElement.type === 'lattice' && project && (
            <SceneLatticeProperties
              lattice={selectedElement.element}
              project={project}
              ghPages={ghPages}
            />
          )}

          {selectedElement.type === 'region' && (
            <RegionProperties 
              region={selectedElement.element} 
              onUpdate={handleUpdate}
              onDragStart={dialHandlers.onDragStart}
              onDragEnd={dialHandlers.onDragEnd}
              projectUnit={projectUnit}
              projectA={projectA}
            />
          )}

          {selectedElement.type === 'regionBox' && (
            <RegionBoxProperties 
              regionBox={selectedElement.element} 
              onUpdate={handleUpdate}
              onDragStart={dialHandlers.onDragStart}
              onDragEnd={dialHandlers.onDragEnd}
              projectUnit={projectUnit}
              projectA={projectA}
              projectWidth={project?.scene?.rectWidth || 3}
              projectHeight={project?.scene?.rectHeight || 3}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ObjectPropertiesPanel;
