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
}) => {
  // Helper to determine source visual type
  const getSourceVisualType = (source: any) => {
    const sizeX = source.size?.x || 0;
    const sizeY = source.size?.y || 0;
    
    if (sizeX === 0 && sizeY === 0) return 'point';
    if (sizeX === 0 || sizeY === 0) return 'line';
    return 'rectangle';
  };

  return (
    <>
      {sources.map((source) => {
        const selected = selectedIds.includes(source.id);
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
        
        const strokeColor = selected ? "#ef4444" : baseColor;
        const fillColor = selected ? `${baseColor}cc` : `${baseColor}99`;
        
        // Fixed arrow size in screen pixels (not affected by zoom)
        const arrowSize = 15 / scale;
        const angle = source.orientation || 0;
        
        return (
          <Group
            key={source.id}
            x={x}
            y={y}
            rotation={(source.orientation || 0) * 180 / Math.PI}
            draggable
            onDragStart={(e) => {
              setActiveInstructionSet('dragging');

              // ensure the dragged source is selected
              if (!selectedIds.includes(source.id)) {
                selectElement(source.id);
              }

              // --- RE-READ the current selection from the store ---
              const currentSel = useCanvasStore.getState().selectedGeometryIds;
              if (currentSel.length > 1 && currentSel.includes(source.id)) {
                const allElements = getAllElements();
                const init: Record<string,{x:number;y:number}> = {};
                currentSel.forEach(id=>{
                  const el = allElements.find(e=>e.id===id);
                  if (el) init[id] = { ...el.pos };
                });
                
                // Get the anchor position in canvas coordinates (not lattice!)
                const anchorPos = e.target.position();
                
                setMultiDragAnchor({
                  id: source.id,
                  anchor: anchorPos,  // This should be in canvas pixels!
                  initialPositions: init,
                });
              }
            }}
            onDragMove={(e) => {
              const node = e.target;
              const pos = node.position();
              const snappedPos = snapCanvasPosToGrid(pos);
              node.position(snappedPos);
              
              if (multiDragAnchor && multiDragAnchor.id === source.id) {
                // Multi-drag logic for all elements
                // Calculate delta in canvas coordinates
                const deltaX = snappedPos.x - multiDragAnchor.anchor.x;
                const deltaY = snappedPos.y - multiDragAnchor.anchor.y;
                
                // Convert delta to lattice units
                const deltaLatticeX = deltaX / GRID_PX;
                const deltaLatticeY = deltaY / GRID_PX;
                
                const { updateGeometry, updateSource } = useCanvasStore.getState();
                const allElements = getAllElements();
                
                Object.entries(multiDragAnchor.initialPositions).forEach(([id, initPos]) => {
                  const typedInitPos = initPos as { x: number; y: number };
                  const newPos = {
                    x: typedInitPos.x + deltaLatticeX,
                    y: typedInitPos.y + deltaLatticeY,
                  };
                  
                  // Check if it's a geometry or source and update accordingly
                  const elem = allElements.find(e => e.id === id);
                  if (elem) {
                    if (elem.kind === 'cylinder' || elem.kind === 'rectangle' || elem.kind === 'triangle') {
                      updateGeometry(id, { pos: newPos });
                    } else {
                      updateSource(id, { pos: newPos });
                    }
                  }
                });
              } else {
                // Single drag
                const newPos = {
                  x: snappedPos.x / GRID_PX,
                  y: snappedPos.y / GRID_PX,
                };
                updateSource(source.id, { pos: newPos });
              }
            }}
            onDragEnd={(e) => {
              setActiveInstructionSet('default');
              const node = e.target;
              const pos = node.position();
              const finalPos = snapCanvasPosToGrid(pos);
              
              if (multiDragAnchor && multiDragAnchor.id === source.id) {
                // Finalize multi-drag for all elements
                // Calculate delta in canvas coordinates
                const deltaX = finalPos.x - multiDragAnchor.anchor.x;
                const deltaY = finalPos.y - multiDragAnchor.anchor.y;
                
                // Convert delta to lattice units
                const deltaLatticeX = deltaX / GRID_PX;
                const deltaLatticeY = deltaY / GRID_PX;
                
                const allElements = getAllElements();
                
                const geomUpdates: Array<{ id: string; pos: { x: number; y: number } }> = [];
                const sourceUpdates: Array<{ id: string; pos: { x: number; y: number } }> = [];
                
                Object.entries(multiDragAnchor.initialPositions).forEach(([id, initPos]) => {
                  const typedInitPos = initPos as { x: number; y: number };
                  const newPos = {
                    x: typedInitPos.x + deltaLatticeX,
                    y: typedInitPos.y + deltaLatticeY,
                  };
                  
                  const elem = allElements.find(e => e.id === id);
                  if (elem) {
                    if (elem.kind === 'cylinder' || elem.kind === 'rectangle' || elem.kind === 'triangle') {
                      geomUpdates.push({ id, pos: newPos });
                    } else {
                      sourceUpdates.push({ id, pos: newPos });
                    }
                  }
                });
                
                // Batch update through project
                if (geomUpdates.length > 0 || sourceUpdates.length > 0) {
                  // Update each geometry
                  geomUpdates.forEach(({ id, pos }) => {
                    handleUpdateGeometry(id, { pos });
                  });
                  
                  // Update each source
                  sourceUpdates.forEach(({ id, pos }) => {
                    handleUpdateSource(id, { pos });
                  });
                }
                
                setMultiDragAnchor(null);
              } else {
                // Single drag update
                const newPos = {
                  x: finalPos.x / GRID_PX,
                  y: finalPos.y / GRID_PX,
                };
                handleUpdateSource(source.id, { pos: newPos });
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
                />
              </>
            )}
            
            {visualType === 'rectangle' && (
              <>
                {/* Semi-transparent black fill */}
                <Rect
                  x={-sizeX/2}
                  y={-sizeY/2}
                  width={sizeX}
                  height={sizeY}
                  fill="rgba(0, 0, 0, 0.5)"
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
