import React from 'react';
import { Group } from 'react-konva';
import { CanvasElement as ElementType } from '../../types/canvasElementTypes';
import { useCanvasStore } from '../../stores/canvas';

interface CanvasElementProps {
  element: ElementType;
  isSelected: boolean;
  selectedIds: string[];
  onSelect: (id: string | null, opts?: { shift?: boolean }) => void;
  onUpdate: (id: string, updates: Partial<ElementType>) => void;
  onCommit: (id: string, updates: Partial<ElementType>) => void;
  GRID_PX: number;
  scale: number;
  children: React.ReactNode;
  onSetActiveInstructionSet?: (set: string) => void;
  resolution?: number;
}

export const CanvasElementComponent: React.FC<CanvasElementProps> = ({
  element,
  isSelected,
  selectedIds,
  onSelect,
  onUpdate,
  onCommit,
  GRID_PX,
  scale,
  onSetActiveInstructionSet,
  resolution,
  children,
}) => {
  const { gridSnapping, resolutionSnapping } = useCanvasStore();
  
  // Snap helper
  const snapToGrid = React.useCallback((value: number, forceGrid?: boolean, forceResolution?: boolean) => {
    if (forceResolution && resolution && resolution > 1) {
      const cellSize = 1 / resolution;
      return Math.round(value / cellSize) * cellSize;
    } else if (forceGrid) {
      return Math.round(value);
    } else if (resolutionSnapping && resolution && resolution > 1) {
      const cellSize = 1 / resolution;
      return Math.round(value / cellSize) * cellSize;
    } else if (gridSnapping) {
      return Math.round(value);
    }
    return value;
  }, [gridSnapping, resolutionSnapping, resolution]);

  const handleDragStart = React.useCallback((e: any) => {
    onSetActiveInstructionSet?.('dragging');
    if (!selectedIds.includes(element.id)) {
      onSelect(element.id);
    }
  }, [element.id, selectedIds, onSelect, onSetActiveInstructionSet]);

  const handleDragMove = React.useCallback((e: any) => {
    const node = e.target;
    const shiftPressed = e.evt.shiftKey;
    const ctrlPressed = e.evt.ctrlKey || e.evt.metaKey;
    
    // Get position in lattice units
    const x = node.x() / GRID_PX;
    const y = node.y() / GRID_PX;
    
    // Snap based on modifiers
    const snappedX = snapToGrid(x, shiftPressed, ctrlPressed);
    const snappedY = snapToGrid(y, shiftPressed, ctrlPressed);
    
    // Update position
    node.position({ x: snappedX * GRID_PX, y: snappedY * GRID_PX });
    onUpdate(element.id, { pos: { x: snappedX, y: snappedY } });
  }, [element.id, GRID_PX, snapToGrid, onUpdate]);

  const handleDragEnd = React.useCallback((e: any) => {
    const node = e.target;
    const shiftPressed = e.evt.shiftKey;
    const ctrlPressed = e.evt.ctrlKey || e.evt.metaKey;
    
    // Final position in lattice units
    const x = node.x() / GRID_PX;
    const y = node.y() / GRID_PX;
    
    // Final snap
    const snappedX = snapToGrid(x, shiftPressed, ctrlPressed);
    const snappedY = snapToGrid(y, shiftPressed, ctrlPressed);
    
    // Commit the change
    onCommit(element.id, { pos: { x: snappedX, y: snappedY } });
    onSetActiveInstructionSet?.('default');
  }, [element.id, GRID_PX, snapToGrid, onCommit, onSetActiveInstructionSet]);

  // (1) remove the special-case that split shape / handles
  // (2) always render every child inside the one draggable group

  return (
    <Group
      x={element.pos.x * GRID_PX}
      y={element.pos.y * GRID_PX}
      rotation={(element.orientation || 0) * 180 / Math.PI}
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(element.id, {
          shift: e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey,
        });
      }}
    >
      {/* shape + resize handles together – single transform applied */}
      {children}
    </Group>
  );
};
