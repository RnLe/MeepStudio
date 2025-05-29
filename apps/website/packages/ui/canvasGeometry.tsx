import React, { useCallback } from "react";
import { Cylinder, Rectangle as RectEl, Triangle } from "../types/canvasElementTypes";
import { Line, Circle, Rect, Group } from "react-konva";
import { ResizeHandles } from "./resizeHandles";
import { useCanvasStore } from "packages/providers/CanvasStore";

/**
 * Geometry rendering components for ProjectCanvas.
 * Handles cylinders, rectangles, triangles, and their drag/select logic.
 * Expects all props and helpers to be passed in from the parent.
 */

interface GeometryLayerProps {
  cylinders: any[];
  rectangles: any[];
  triangles: any[];
  selectedIds: string[];
  gridSnapping: boolean;
  resolutionSnapping: boolean;
  snapCanvasPosToGrid: (pos: { x: number; y: number }) => { x: number; y: number };
  multiDragAnchor: any;
  setMultiDragAnchor: (anchor: any) => void;
  geometries: any[];
  updateGeometry: (id: string, updates: any) => void;
  handleUpdateGeometry: (id: string, updates: any) => void;
  handleUpdateSource?: (id: string, updates: any) => void;
  selectElement: (id: string | null, opts?: { shift?: boolean }) => void;
  GRID_PX: number;
  project: any;
  scale: number;
  showGrid: boolean;
  showResolutionOverlay: boolean;
  toggleShowGrid: () => void;
  toggleShowResolutionOverlay: () => void;
  setActiveInstructionSet: (key: 'default' | 'rotating' | 'resizing' | 'dragging') => void;
}

export const GeometryLayer: React.FC<GeometryLayerProps> = ({
  cylinders,
  rectangles,
  triangles,
  selectedIds,
  gridSnapping,
  resolutionSnapping,
  snapCanvasPosToGrid,
  multiDragAnchor,
  setMultiDragAnchor,
  geometries,
  updateGeometry,
  handleUpdateGeometry,
  handleUpdateSource,
  selectElement,
  GRID_PX,
  project,
  scale,
  showGrid,
  showResolutionOverlay,
  toggleShowGrid,
  toggleShowResolutionOverlay,
  setActiveInstructionSet,
}) => {
  // Add state to track initial overlay states during drag
  const initialOverlayStates = React.useRef<{ grid: boolean; resolution: boolean } | null>(null);
  const currentOverlayStates = React.useRef<{ grid: boolean; resolution: boolean } | null>(null);

  // Track dragging state for all rectangles
  const [draggingRectangles, setDraggingRectangles] = React.useState<Set<string>>(new Set());
  
  // Helper function to check if a rectangle is dragging
  const isRectangleDragging = (id: string) => draggingRectangles.has(id);
  
  // Helper function to set dragging state for a rectangle
  const setRectangleDragging = (id: string, isDragging: boolean) => {
    setDraggingRectangles(prev => {
      const next = new Set(prev);
      if (isDragging) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  // State to track which handle is being resized
  const [activeHandle, setActiveHandle] = React.useState<string | null>(null);

  // Helper function to snap values to grid
  const snapToGrid = React.useCallback((value: number, forceGrid?: boolean, forceResolution?: boolean) => {
    // If ctrl is pressed, force resolution snapping
    if (forceResolution && project?.scene?.resolution && project.scene.resolution > 1) {
      const res = project.scene.resolution;
      const cellSize = 1 / res;
      return Math.round(value / cellSize) * cellSize;
    }
    // If shift is pressed, force grid snapping
    else if (forceGrid) {
      return Math.round(value);
    }
    // Otherwise use current settings
    else if (resolutionSnapping && project?.scene?.resolution && project.scene.resolution > 1) {
      const res = project.scene.resolution;
      const cellSize = 1 / res;
      return Math.round(value / cellSize) * cellSize;
    } else if (gridSnapping) {
      return Math.round(value);
    }
    return value;
  }, [gridSnapping, resolutionSnapping, project?.scene?.resolution]);

  // Enhanced snap function that considers shift/ctrl keys
  const snapWithModifiers = React.useCallback((value: number, shiftPressed: boolean, ctrlPressed: boolean) => {
    return snapToGrid(value, shiftPressed, ctrlPressed);
  }, [snapToGrid]);

  // Helper function to handle overlay toggling during drag
  const handleDragOverlays = React.useCallback((shiftPressed: boolean, ctrlPressed: boolean) => {
    if (!currentOverlayStates.current || !initialOverlayStates.current) return;
    
    // Handle grid overlay
    if (shiftPressed && !currentOverlayStates.current.grid) {
      toggleShowGrid();
      currentOverlayStates.current.grid = true;
    } else if (!shiftPressed && currentOverlayStates.current.grid && !initialOverlayStates.current.grid) {
      toggleShowGrid();
      currentOverlayStates.current.grid = false;
    }
    
    // Handle resolution overlay
    if (ctrlPressed && !currentOverlayStates.current.resolution) {
      toggleShowResolutionOverlay();
      currentOverlayStates.current.resolution = true;
    } else if (!ctrlPressed && currentOverlayStates.current.resolution && !initialOverlayStates.current.resolution) {
      toggleShowResolutionOverlay();
      currentOverlayStates.current.resolution = false;
    }
  }, [toggleShowGrid, toggleShowResolutionOverlay]);

  // Helper function to restore overlay states after drag
  const restoreOverlayStates = React.useCallback(() => {
    if (initialOverlayStates.current && currentOverlayStates.current) {
      if (currentOverlayStates.current.grid !== initialOverlayStates.current.grid) {
        toggleShowGrid();
      }
      if (currentOverlayStates.current.resolution !== initialOverlayStates.current.resolution) {
        toggleShowResolutionOverlay();
      }
      initialOverlayStates.current = null;
      currentOverlayStates.current = null;
    }
  }, [toggleShowGrid, toggleShowResolutionOverlay]);

  // Handle drag start/end for instruction set updates
  const handleGeometryDragStart = useCallback(() => {
    setActiveInstructionSet('dragging');
  }, [setActiveInstructionSet]);

  const handleGeometryDragEnd = useCallback(() => {
    setActiveInstructionSet('default');
  }, [setActiveInstructionSet]);

  // Add state to track if we're dragging any geometry
  const [isDraggingGeometry, setIsDraggingGeometry] = React.useState(false);

  const handleSingleDragStart = React.useCallback((e: any, element: any) => {
    // Set instruction set to dragging
    setActiveInstructionSet('dragging');
    setIsDraggingGeometry(true);
    
    // Store initial overlay states
    if (!initialOverlayStates.current) {
      initialOverlayStates.current = {
        grid: showGrid,
        resolution: showResolutionOverlay
      };
      currentOverlayStates.current = {
        grid: showGrid,
        resolution: showResolutionOverlay
      };
    }
    
    selectElement(element.id);
  }, [selectElement, setActiveInstructionSet, showGrid, showResolutionOverlay]);

  const handleSingleDragMove = React.useCallback((e: any, element: any) => {
    const shiftPressed = e.evt.shiftKey;
    const ctrlPressed = e.evt.ctrlKey || e.evt.metaKey;
    
    if (!currentOverlayStates.current || !initialOverlayStates.current) return;
    
    // Handle grid overlay
    if (shiftPressed && !currentOverlayStates.current.grid) {
      toggleShowGrid();
      currentOverlayStates.current.grid = true;
    } else if (!shiftPressed && currentOverlayStates.current.grid && !initialOverlayStates.current.grid) {
      toggleShowGrid();
      currentOverlayStates.current.grid = false;
    }
    
    // Handle resolution overlay
    if (ctrlPressed && !currentOverlayStates.current.resolution) {
      toggleShowResolutionOverlay();
      currentOverlayStates.current.resolution = true;
    } else if (!ctrlPressed && currentOverlayStates.current.resolution && !initialOverlayStates.current.resolution) {
      toggleShowResolutionOverlay();
      currentOverlayStates.current.resolution = false;
    }
    
    // Get position and apply modifier-based snapping
    const pos = e.target.position();
    const snappedX = snapWithModifiers(pos.x / GRID_PX, shiftPressed, ctrlPressed);
    const snappedY = snapWithModifiers(pos.y / GRID_PX, shiftPressed, ctrlPressed);
    
    const latticePos = { x: snappedX, y: snappedY };
    
    // Update element with snapped position
    updateGeometry(element.id, { pos: latticePos });
    
    // Force position update on the Konva node
    e.target.position({ x: snappedX * GRID_PX, y: snappedY * GRID_PX });
  }, [snapWithModifiers, updateGeometry, GRID_PX, toggleShowGrid, toggleShowResolutionOverlay]);

  const handleSingleDragEnd = React.useCallback((e: any, element: any) => {
    const shiftPressed = e.evt.shiftKey;
    const ctrlPressed = e.evt.ctrlKey || e.evt.metaKey;
    
    // Final snap position
    const pos = e.target.position();
    const snappedX = snapWithModifiers(pos.x / GRID_PX, shiftPressed, ctrlPressed);
    const snappedY = snapWithModifiers(pos.y / GRID_PX, shiftPressed, ctrlPressed);
    
    handleUpdateGeometry(element.id, { pos: { x: snappedX, y: snappedY } });
    
    // Restore overlay states
    if (initialOverlayStates.current && currentOverlayStates.current) {
      if (currentOverlayStates.current.grid !== initialOverlayStates.current.grid) {
        toggleShowGrid();
      }
      if (currentOverlayStates.current.resolution !== initialOverlayStates.current.resolution) {
        toggleShowResolutionOverlay();
      }
      initialOverlayStates.current = null;
      currentOverlayStates.current = null;
    }
    
    // Reset instruction set
    setActiveInstructionSet('default');
    setIsDraggingGeometry(false);
  }, [snapWithModifiers, handleUpdateGeometry, setActiveInstructionSet, GRID_PX, toggleShowGrid, toggleShowResolutionOverlay]);

  const handleMultiDragStart = React.useCallback((e: any, anchorElement: any) => {
    // Set instruction set to dragging
    setActiveInstructionSet('dragging');
    setIsDraggingGeometry(true);
    
    // Store initial overlay states
    if (!initialOverlayStates.current) {
      initialOverlayStates.current = {
        grid: showGrid,
        resolution: showResolutionOverlay
      };
      currentOverlayStates.current = {
        grid: showGrid,
        resolution: showResolutionOverlay
      };
    }
    
    const anchorPos = e.target.position();
    const { getAllElements } = useCanvasStore.getState();
    const allElements = getAllElements();
    
    const initialPositions = selectedIds.reduce((acc, id) => {
      const elem = allElements.find(e => e.id === id);
      if (elem) {
        acc[id] = { ...elem.pos };
      }
      return acc;
    }, {} as Record<string, { x: number; y: number }>);
    
    setMultiDragAnchor({
      id: anchorElement.id,
      anchor: anchorPos,
      initialPositions,
    });
  }, [selectedIds, setMultiDragAnchor, setActiveInstructionSet, showGrid, showResolutionOverlay]);

  const handleMultiDragMove = React.useCallback((e: any) => {
    if (!multiDragAnchor) return;
    
    const shiftPressed = e.evt.shiftKey;
    const ctrlPressed = e.evt.ctrlKey || e.evt.metaKey;
    
    if (!currentOverlayStates.current || !initialOverlayStates.current) return;
    
    // Handle overlays same as single drag
    if (shiftPressed && !currentOverlayStates.current.grid) {
      toggleShowGrid();
      currentOverlayStates.current.grid = true;
    } else if (!shiftPressed && currentOverlayStates.current.grid && !initialOverlayStates.current.grid) {
      toggleShowGrid();
      currentOverlayStates.current.grid = false;
    }
    
    if (ctrlPressed && !currentOverlayStates.current.resolution) {
      toggleShowResolutionOverlay();
      currentOverlayStates.current.resolution = true;
    } else if (!ctrlPressed && currentOverlayStates.current.resolution && !initialOverlayStates.current.resolution) {
      toggleShowResolutionOverlay();
      currentOverlayStates.current.resolution = false;
    }
    
    const currentPos = e.target.position();
    const snappedX = snapWithModifiers(currentPos.x / GRID_PX, shiftPressed, ctrlPressed);
    const snappedY = snapWithModifiers(currentPos.y / GRID_PX, shiftPressed, ctrlPressed);
    const snappedPos = { x: snappedX * GRID_PX, y: snappedY * GRID_PX };
    
    // Calculate delta in canvas coordinates
    const deltaX = snappedPos.x - multiDragAnchor.anchor.x;
    const deltaY = snappedPos.y - multiDragAnchor.anchor.y;
    
    const { updateGeometry, updateSource, getAllElements } = useCanvasStore.getState();
    const allElements = getAllElements();
    
    // Update all selected elements
    selectedIds.forEach(id => {
      const initialPos = multiDragAnchor.initialPositions[id];
      if (initialPos) {
        const newX = initialPos.x + deltaX / GRID_PX;
        const newY = initialPos.y + deltaY / GRID_PX;
        
        const elem = allElements.find(e => e.id === id);
        if (elem) {
          if (elem.kind === 'cylinder' || elem.kind === 'rectangle' || elem.kind === 'triangle') {
            updateGeometry(id, { pos: { x: newX, y: newY } });
          } else {
            updateSource(id, { pos: { x: newX, y: newY } });
          }
        }
      }
    });
    
    // Force anchor element position
    e.target.position(snappedPos);
  }, [multiDragAnchor, selectedIds, snapWithModifiers, updateGeometry, GRID_PX, toggleShowGrid, toggleShowResolutionOverlay]);

  const handleMultiDragEnd = React.useCallback((e: any) => {
    if (!multiDragAnchor) return;
    
    const shiftPressed = e.evt.shiftKey;
    const ctrlPressed = e.evt.ctrlKey || e.evt.metaKey;
    
    const currentPos = e.target.position();
    const snappedX = snapWithModifiers(currentPos.x / GRID_PX, shiftPressed, ctrlPressed);
    const snappedY = snapWithModifiers(currentPos.y / GRID_PX, shiftPressed, ctrlPressed);
    const snappedPos = { x: snappedX * GRID_PX, y: snappedY * GRID_PX };
    
    const deltaX = snappedPos.x - multiDragAnchor.anchor.x;
    const deltaY = snappedPos.y - multiDragAnchor.anchor.y;
    
    const { getAllElements } = useCanvasStore.getState();
    const allElements = getAllElements();
    
    // Batch update all selected elements
    selectedIds.forEach(id => {
      const initialPos = multiDragAnchor.initialPositions[id];
      if (initialPos) {
        const newX = initialPos.x + deltaX / GRID_PX;
        const newY = initialPos.y + deltaY / GRID_PX;
        
        const elem = allElements.find(e => e.id === id);
        if (elem) {
          if (elem.kind === 'cylinder' || elem.kind === 'rectangle' || elem.kind === 'triangle') {
            handleUpdateGeometry(id, { pos: { x: newX, y: newY } });
          } else {
            // Need to pass handleUpdateSource from parent
            const parentHandleUpdateSource = (window as any).__handleUpdateSource;
            if (parentHandleUpdateSource) {
              parentHandleUpdateSource(id, { pos: { x: newX, y: newY } });
            }
          }
        }
      }
    });
    
    setMultiDragAnchor(null);
    
    // Restore overlay states
    if (initialOverlayStates.current && currentOverlayStates.current) {
      if (currentOverlayStates.current.grid !== initialOverlayStates.current.grid) {
        toggleShowGrid();
      }
      if (currentOverlayStates.current.resolution !== initialOverlayStates.current.resolution) {
        toggleShowResolutionOverlay();
      }
      initialOverlayStates.current = null;
      currentOverlayStates.current = null;
    }
    
    // Reset instruction set
    setActiveInstructionSet('default');
    setIsDraggingGeometry(false);
  }, [multiDragAnchor, selectedIds, snapWithModifiers, handleUpdateGeometry, setMultiDragAnchor, setActiveInstructionSet, GRID_PX, toggleShowGrid, toggleShowResolutionOverlay]);

  // Keyboard event handlers for showing/hiding grids during drag
  React.useEffect(() => {
    const isDragging = !!multiDragAnchor || !!activeHandle || isDraggingGeometry;
    if (!isDragging) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentOverlayStates.current || !initialOverlayStates.current) return;
      
      // Handle shift key
      if (e.shiftKey && !currentOverlayStates.current.grid) {
        toggleShowGrid();
        currentOverlayStates.current.grid = true;
      }
      
      // Handle ctrl/cmd key
      if ((e.ctrlKey || e.metaKey) && !currentOverlayStates.current.resolution) {
        toggleShowResolutionOverlay();
        currentOverlayStates.current.resolution = true;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!currentOverlayStates.current || !initialOverlayStates.current) return;
      
      // Handle shift key release
      if (!e.shiftKey && currentOverlayStates.current.grid && !initialOverlayStates.current.grid) {
        toggleShowGrid();
        currentOverlayStates.current.grid = false;
      }
      
      // Handle ctrl/cmd key release
      if (!e.ctrlKey && !e.metaKey && currentOverlayStates.current.resolution && !initialOverlayStates.current.resolution) {
        toggleShowResolutionOverlay();
        currentOverlayStates.current.resolution = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [multiDragAnchor, activeHandle, isDraggingGeometry, toggleShowGrid, toggleShowResolutionOverlay]);

  return (
    <>
      {/* Render cylinders */}
      {cylinders.map((cyl) => {
        const isSelected = selectedIds.includes(cyl.id);
        const otherSelected = selectedIds.length > 1 && isSelected;
        
        return (
          <Circle
            key={cyl.id}
            x={cyl.pos.x * GRID_PX}
            y={cyl.pos.y * GRID_PX}
            radius={cyl.radius * GRID_PX}
            rotation={(cyl.orientation || 0) * 180 / Math.PI}
            fill="rgba(59,130,246,0.25)"
            stroke={isSelected ? "#3b82f6" : "transparent"}
            strokeWidth={isSelected ? 1 / scale : 0}
            shadowBlur={isSelected ? 8 : 0}
            draggable
            onDragStart={(e) => {
              if (otherSelected) {
                handleMultiDragStart(e, cyl);
              } else {
                handleSingleDragStart(e, cyl);
              }
            }}
            onDragMove={(e) => {
              if (otherSelected) {
                handleMultiDragMove(e);
              } else {
                handleSingleDragMove(e, cyl);
              }
            }}
            onDragEnd={(e) => {
              if (otherSelected) {
                handleMultiDragEnd(e);
              } else {
                handleSingleDragEnd(e, cyl);
              }
            }}
            onClick={(evt) => selectElement(cyl.id, { shift: evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey })}
          />
        );
      })}
      
      {/* Render rectangles */}
      {rectangles.map((rect) => {
        const isSelected = selectedIds.includes(rect.id);
        const otherSelected = selectedIds.length > 1 && isSelected;
        
        return (
          <React.Fragment key={rect.id}>
            <Group
              x={rect.pos.x * GRID_PX}
              y={rect.pos.y * GRID_PX}
              rotation={(rect.orientation || 0) * 180 / Math.PI}
              draggable
              onDragStart={(e) => {
                setRectangleDragging(rect.id, true);
                if (otherSelected) {
                  handleMultiDragStart(e, rect);
                } else {
                  handleSingleDragStart(e, rect);
                }
              }}
              onDragMove={(e) => {
                if (otherSelected) {
                  handleMultiDragMove(e);
                } else {
                  handleSingleDragMove(e, rect);
                }
              }}
              onDragEnd={(e) => {
                setRectangleDragging(rect.id, false);
                if (otherSelected) {
                  handleMultiDragEnd(e);
                } else {
                  handleSingleDragEnd(e, rect);
                }
              }}
              onClick={(evt) => selectElement(rect.id, { shift: evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey })}
            >
              <Rect
                width={rect.width * GRID_PX}
                height={rect.height * GRID_PX}
                fill="rgba(16,185,129,0.25)"
                stroke={isSelected ? "#10b981" : "transparent"}
                strokeWidth={isSelected ? 1 / scale : 0}
                shadowBlur={isSelected ? 8 : 0}
                offsetX={(rect.width * GRID_PX) / 2}
                offsetY={(rect.height * GRID_PX) / 2}
              />
            </Group>
            {/* Show resize handles when selected and only this rectangle is selected */}
            {isSelected && selectedIds.length === 1 && !isRectangleDragging(rect.id) && (
              <ResizeHandles
                rectangle={rect}
                GRID_PX={GRID_PX}
                onResize={(updates) => updateGeometry(rect.id, updates)}
                onResizeEnd={(updates) => handleUpdateGeometry(rect.id, updates)}
                snapToGrid={snapToGrid}
                scale={scale}
                gridSnapping={gridSnapping}
                resolutionSnapping={resolutionSnapping}
                showGrid={showGrid}
                showResolutionOverlay={showResolutionOverlay}
                toggleShowGrid={toggleShowGrid}
                toggleShowResolutionOverlay={toggleShowResolutionOverlay}
                handleUpdateGeometry={handleUpdateGeometry}
                setActiveInstructionSet={setActiveInstructionSet}
              />
            )}
          </React.Fragment>
        );
      })}
      
      {/* Render triangles */}
      {triangles.map((tri) => {
        const isSelected = selectedIds.includes(tri.id);
        const otherSelected = selectedIds.length > 1 && isSelected;
        
        return (
          <React.Fragment key={tri.id}>
            <Group
              x={tri.pos.x * GRID_PX}
              y={tri.pos.y * GRID_PX}
              rotation={(tri.orientation || 0) * 180 / Math.PI}
              draggable
              onDragStart={(e) => {
                if (otherSelected) {
                  handleMultiDragStart(e, tri);
                } else {
                  handleSingleDragStart(e, tri);
                }
              }}
              onDragMove={(e) => {
                if (otherSelected) {
                  handleMultiDragMove(e);
                } else {
                  handleSingleDragMove(e, tri);
                }
              }}
              onDragEnd={(e) => {
                if (otherSelected) {
                  handleMultiDragEnd(e);
                } else {
                  handleSingleDragEnd(e, tri);
                }
              }}
              onClick={(evt) => selectElement(tri.id, { shift: evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey })}
            >
              <Line
                points={tri.vertices.flatMap((v: any) => [v.x * GRID_PX, v.y * GRID_PX])}
                closed
                fill="rgba(236,72,153,0.25)"
                stroke={isSelected ? "#ec4899" : "transparent"}
                strokeWidth={isSelected ? 1 / scale : 0}
                shadowBlur={isSelected ? 8 : 0}
              />
            </Group>
          </React.Fragment>
        );
      })}
    </>
  );
};