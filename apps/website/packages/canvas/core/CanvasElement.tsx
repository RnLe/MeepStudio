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
  onBatchUpdate?: (ids: string[], draggedElementUpdate: Partial<ElementType>, delta: { deltaX: number; deltaY: number }) => void;
  onBatchCommit?: (ids: string[], draggedElementUpdate: Partial<ElementType>, delta: { deltaX: number; deltaY: number }) => void;
  onBatchDragStart?: (selectedIds: string[]) => void;
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
  onBatchUpdate,
  onBatchCommit,
  onBatchDragStart,
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

  // Track initial position for batch moving
  const initialPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleDragStart = React.useCallback((e: any) => {
    onSetActiveInstructionSet?.('dragging');
    if (!selectedIds.includes(element.id)) {
      onSelect(element.id);
    }
    // Store initial position for delta calculation
    initialPosRef.current = { x: element.pos.x, y: element.pos.y };
    
    // Initialize batch drag positions for all selected elements
    if (selectedIds.length > 1) {
      onBatchDragStart?.(selectedIds);
    }
  }, [element.id, element.pos.x, element.pos.y, selectedIds, onSelect, onSetActiveInstructionSet, onBatchDragStart]);

  const handleDragMove = React.useCallback((e: any) => {
    const node = e.target;
    const shiftPressed = e.evt?.shiftKey || false;
    const ctrlPressed = e.evt?.ctrlKey || e.evt?.metaKey || false;
    
    // Get position in lattice units
    const x = node.x() / GRID_PX;
    const y = node.y() / GRID_PX;
    
    // Snap based on modifiers
    const snappedX = snapToGrid(x, shiftPressed, ctrlPressed);
    const snappedY = snapToGrid(y, shiftPressed, ctrlPressed);
    
    // Update position
    node.position({ x: snappedX * GRID_PX, y: snappedY * GRID_PX });
    
    // Calculate delta from initial position
    if (initialPosRef.current && selectedIds.length > 1) {
      const deltaX = snappedX - initialPosRef.current.x;
      const deltaY = snappedY - initialPosRef.current.y;
      // Use new onBatchUpdate callback if multiple elements are selected
      // Exclude the currently dragged element to avoid double-updates
      const otherSelectedIds = selectedIds.filter(id => id !== element.id);
      if (otherSelectedIds.length > 0) {
        onBatchUpdate?.(otherSelectedIds, { pos: { x: snappedX, y: snappedY } }, { deltaX, deltaY });
      }
      // Update the dragged element normally
      onUpdate(element.id, { pos: { x: snappedX, y: snappedY } });
    } else {
      // Single element update
      onUpdate(element.id, { pos: { x: snappedX, y: snappedY } });
    }
  }, [element.id, GRID_PX, snapToGrid, onUpdate, onBatchUpdate, selectedIds]);

  const handleDragEnd = React.useCallback((e: any) => {
    const node = e.target;
    const shiftPressed = e.evt?.shiftKey || false;
    const ctrlPressed = e.evt?.ctrlKey || e.evt?.metaKey || false;
    
    // Final position in lattice units
    const x = node.x() / GRID_PX;
    const y = node.y() / GRID_PX;
    
    // Final snap
    const snappedX = snapToGrid(x, shiftPressed, ctrlPressed);
    const snappedY = snapToGrid(y, shiftPressed, ctrlPressed);
    
    // Calculate final delta from initial position
    if (initialPosRef.current && selectedIds.length > 1) {
      const deltaX = snappedX - initialPosRef.current.x;
      const deltaY = snappedY - initialPosRef.current.y;
      // Use new onBatchCommit callback if multiple elements are selected
      // Exclude the currently dragged element to avoid double-updates
      const otherSelectedIds = selectedIds.filter(id => id !== element.id);
      if (otherSelectedIds.length > 0) {
        onBatchCommit?.(otherSelectedIds, { pos: { x: snappedX, y: snappedY } }, { deltaX, deltaY });
      }
      // Commit the dragged element normally
      onCommit(element.id, { pos: { x: snappedX, y: snappedY } });
    } else {
      // Single element commit
      onCommit(element.id, { pos: { x: snappedX, y: snappedY } });
    }
    
    onSetActiveInstructionSet?.('default');
    initialPosRef.current = null; // Reset initial position
  }, [element.id, GRID_PX, snapToGrid, onCommit, onBatchCommit, selectedIds, onSetActiveInstructionSet]);

  // (1) remove the special-case that split shape / handles
  // (2) always render every child inside the one draggable group

  return (
    <Group
      x={element.pos.x * GRID_PX}
      y={element.pos.y * GRID_PX}
      rotation={(element.orientation || 0) * 180 / Math.PI}
      draggable={!element.locked} // Locked objects cannot be dragged
      onDragStart={element.locked ? undefined : handleDragStart}
      onDragMove={element.locked ? undefined : handleDragMove}
      onDragEnd={element.locked ? undefined : handleDragEnd}
      onClick={element.locked ? undefined : (e) => {
        e.cancelBubble = true;
        onSelect(element.id, {
          shift: e.evt?.shiftKey || e.evt?.ctrlKey || e.evt?.metaKey || false,
        });
      }}
      listening={!element.locked} // Locked objects don't listen to events
    >
      {/* shape + resize handles together – single transform applied */}
      {children}
    </Group>
  );
};
