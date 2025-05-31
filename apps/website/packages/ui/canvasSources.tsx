"use client";

import React, { useMemo } from "react";
import { Group, Circle, Arrow, Rect, Line, Text, Path, Shape } from "react-konva";
import { nanoid } from "nanoid";
import { useCanvasStore } from "../providers/CanvasStore";

export const SourceLayer: React.FC<{
  sources: any[];
  selectedIds: string[];
  gridSnapping: boolean;
  resolutionSnapping: boolean;
  snapCanvasPosToGrid: (pos: { x: number; y: number }) => { x: number; y: number };
  multiDragAnchor: { id: string; anchor: { x: number; y: number }; initialPositions: Record<string, { x: number; y: number }> } | null;
  setMultiDragAnchor: (anchor: { id: string; anchor: { x: number; y: number }; initialPositions: Record<string, { x: number; y: number }> } | null) => void;
  updateSource: (id: string, partial: Partial<any>) => void;
  handleUpdateSource: (id: string, partial: Partial<any>) => void;
  handleUpdateGeometry: (id: string, partial: Partial<any>) => void;
  selectElement: (id: string | null, opts?: { shift?: boolean }) => void;
  GRID_PX: number;
  project: any;
  scale: number;
  setActiveInstructionSet: (set: any) => void;
  getAllElements: () => any[];
  showGrid: boolean;
  showResolutionOverlay: boolean;
  toggleShowGrid: () => void;
  toggleShowResolutionOverlay: () => void;
}> = ({
  sources,
  selectedIds,
  gridSnapping,
  resolutionSnapping,
  snapCanvasPosToGrid,
  multiDragAnchor,
  setMultiDragAnchor,
  updateSource,
  handleUpdateSource,
  handleUpdateGeometry,
  selectElement,
  GRID_PX,
  project,
  scale,
  setActiveInstructionSet,
  getAllElements,
  showGrid,
  showResolutionOverlay,
  toggleShowGrid,
  toggleShowResolutionOverlay,
}) => {
  // Add state to track initial overlay states during drag
  const initialOverlayStates = React.useRef<{ grid: boolean; resolution: boolean } | null>(null);
  const currentOverlayStates = React.useRef<{ grid: boolean; resolution: boolean } | null>(null);

  // Add state to track if we're dragging any source
  const [isDraggingSource, setIsDraggingSource] = React.useState(false);

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

  // Helper to determine source visual type
  const getSourceVisualType = (source: any) => {
    const sizeX = source.size?.x || 0;
    const sizeY = source.size?.y || 0;
    
    if (sizeX === 0 && sizeY === 0) return 'point';
    if (sizeX === 0 || sizeY === 0) return 'line';
    return 'rectangle';
  };

  // Single drag handlers
  const handleSingleDragStart = React.useCallback((e: any, source: any) => {
    setActiveInstructionSet('dragging');
    setIsDraggingSource(true);
    
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
    
    // ensure the dragged source is selected
    if (!selectedIds.includes(source.id)) {
      selectElement(source.id);
    }
  }, [selectElement, setActiveInstructionSet, showGrid, showResolutionOverlay, selectedIds]);

  const handleSingleDragMove = React.useCallback((e: any, source: any) => {
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
    
    // Update source with snapped position
    updateSource(source.id, { pos: latticePos });
    
    // Force position update on the Konva node
    e.target.position({ x: snappedX * GRID_PX, y: snappedY * GRID_PX });
  }, [snapWithModifiers, updateSource, GRID_PX, toggleShowGrid, toggleShowResolutionOverlay]);

  const handleSingleDragEnd = React.useCallback((e: any, source: any) => {
    const shiftPressed = e.evt.shiftKey;
    const ctrlPressed = e.evt.ctrlKey || e.evt.metaKey;
    
    // Final snap position
    const pos = e.target.position();
    const snappedX = snapWithModifiers(pos.x / GRID_PX, shiftPressed, ctrlPressed);
    const snappedY = snapWithModifiers(pos.y / GRID_PX, shiftPressed, ctrlPressed);
    
    handleUpdateSource(source.id, { pos: { x: snappedX, y: snappedY } });
    
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
    setIsDraggingSource(false);
  }, [snapWithModifiers, handleUpdateSource, setActiveInstructionSet, GRID_PX, toggleShowGrid, toggleShowResolutionOverlay]);

  // Multi drag handlers
  const handleMultiDragStart = React.useCallback((e: any, source: any) => {
    setActiveInstructionSet('dragging');
    setIsDraggingSource(true);
    
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
    const allElements = getAllElements();
    
    const initialPositions = selectedIds.reduce((acc, id) => {
      const elem = allElements.find(e => e.id === id);
      if (elem) {
        acc[id] = { ...elem.pos };
      }
      return acc;
    }, {} as Record<string, { x: number; y: number }>);
    
    setMultiDragAnchor({
      id: source.id,
      anchor: anchorPos,
      initialPositions,
    });
  }, [selectedIds, setMultiDragAnchor, setActiveInstructionSet, showGrid, showResolutionOverlay, getAllElements]);

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
    
    const { updateGeometry, updateSource } = useCanvasStore.getState();
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
  }, [multiDragAnchor, selectedIds, snapWithModifiers, GRID_PX, toggleShowGrid, toggleShowResolutionOverlay, getAllElements]);

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
            handleUpdateSource(id, { pos: { x: newX, y: newY } });
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
    setIsDraggingSource(false);
  }, [multiDragAnchor, selectedIds, snapWithModifiers, handleUpdateGeometry, handleUpdateSource, setMultiDragAnchor, setActiveInstructionSet, GRID_PX, toggleShowGrid, toggleShowResolutionOverlay, getAllElements]);

  // Keyboard event handlers for showing/hiding grids during drag
  React.useEffect(() => {
    const isDragging = !!multiDragAnchor || isDraggingSource;
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
  }, [multiDragAnchor, isDraggingSource, toggleShowGrid, toggleShowResolutionOverlay]);

  const showXRayMode = useCanvasStore((s) => s.showXRayMode);
  const xRayTransparency = useCanvasStore((s) => s.xRayTransparency);
  const xRayRevision = useCanvasStore((s) => s.xRayTransparencyRevision); // trigger re-render  +++
  const getElementXRayTransparency = useCanvasStore((s) => s.getElementXRayTransparency);       // +++

  const sourceTransparency = getElementXRayTransparency('sources'); // +++

  return (
    <>
      {sources.map((source) => {
        const selected = selectedIds.includes(source.id);
        const otherSelected = selectedIds.length > 1 && selected;
        const visualType = getSourceVisualType(source);
        
        // Convert lattice units to pixels
        const x = source.pos.x * GRID_PX;
        const y = source.pos.y * GRID_PX;
        const sizeX = (source.size?.x || 0) * GRID_PX;
        const sizeY = (source.size?.y || 0) * GRID_PX;
        
        // Base colors for different source types
        const baseColor = source.kind === "continuousSource" ? "#f59e0b" :
                         source.kind === "gaussianSource" ? "#3b82f6" :
                         source.kind === "eigenModeSource" ? "#8b5cf6" :
                         source.kind === "gaussianBeamSource" ? "#10b981" : "#6b7280";
        
        const strokeColor = selected ? "#50a2ff" : "#000000";
        
        return (
          <Group
            key={source.id}
            x={x}
            y={y}
            rotation={(source.orientation || 0) * 180 / Math.PI}
            draggable
            onDragStart={(e) => {
              if (otherSelected) {
                handleMultiDragStart(e, source);
              } else {
                handleSingleDragStart(e, source);
              }
            }}
            onDragMove={(e) => {
              if (otherSelected) {
                handleMultiDragMove(e);
              } else {
                handleSingleDragMove(e, source);
              }
            }}
            onDragEnd={(e) => {
              if (otherSelected) {
                handleMultiDragEnd(e);
              } else {
                handleSingleDragEnd(e, source);
              }
            }}
            onClick={(evt) => {
              // Handle selection on click (not drag)
              const shift = evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey;
              selectElement(source.id, { shift });
            }}
          >
            {/* Visual representation based on size */}
            {visualType === 'point' && (
              <>
                <Circle
                  x={0}
                  y={0}
                  radius={6 / scale}
                  fill={selected ? "#50a2ff" : "#000000"}
                  stroke={selected ? "#50a2ff" : "#000000"}
                  opacity={showXRayMode ? sourceTransparency : 1} // Fully opaque when X-Ray mode is off
                />
              </>
            )}
            
            {visualType === 'line' && (
              <>
                {/* Main line - changes color when selected */}
                <Line
                  points={sizeX === 0 ? [0, -sizeY/2, 0, sizeY/2] : [-sizeX/2, 0, sizeX/2, 0]}
                  stroke={selected ? "#50a2ff" : "#000000"}
                  strokeWidth={6 / scale}
                  lineCap="butt"
                  opacity={showXRayMode ? sourceTransparency : 1} // Fully opaque when X-Ray mode is off
                />
              </>
            )}
            
            {visualType === 'rectangle' && (
              <>
                {/* Solid black fill */}
                <Rect
                  x={-sizeX/2}
                  y={-sizeY/2}
                  width={sizeX}
                  height={sizeY}
                  fill="#000000" // Always black
                  opacity={showXRayMode ? sourceTransparency : 1} // Fully opaque when X-Ray mode is off
                  stroke={selected ? "#50a2ff" : "#000000"}
                  strokeWidth={2 / scale}
                />
              </>
            )}
          </Group>
        );
      })}
    </>
  );
};
