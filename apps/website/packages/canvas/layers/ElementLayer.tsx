import React from 'react';
import { Layer } from 'react-konva';
import { CanvasElement } from '../../types/canvasElementTypes';
import { CanvasElementComponent } from '../core/CanvasElement';
import { GeometryRenderer } from '../renderers/GeometryRenderer';
import { SourceRenderer } from '../renderers/SourceRenderer';
import { BoundaryRenderer } from '../renderers/BoundaryRenderer';
import { LatticeRenderer } from '../renderers/LatticeRenderer';
import { ResizeHandles } from '../utils/resizeHandles';
import { useCanvasStore } from '../../stores/canvas';

interface ElementLayerProps {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (id: string | null, opts?: { shift?: boolean }) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onCommit: (id: string, updates: Partial<CanvasElement>) => void;
  GRID_PX: number;
  scale: number;
  gridWidth: number;
  gridHeight: number;
  onSetActiveInstructionSet?: (set: string) => void;
  resolution?: number;
}

export const ElementLayer: React.FC<ElementLayerProps> = ({
  elements,
  selectedIds,
  onSelect,
  onUpdate,
  onCommit,
  GRID_PX,
  scale,
  gridWidth,
  gridHeight,
  onSetActiveInstructionSet,
  resolution,
}) => {
  // Get store methods for resize handles
  const { gridSnapping, resolutionSnapping, showGrid, showResolutionOverlay, toggleShowGrid, toggleShowResolutionOverlay } = useCanvasStore();

  // Sort elements by type for proper layering
  const sortedElements = React.useMemo(() => {
    const order = ['lattice', 'cylinder', 'rectangle', 'triangle', 'source', 'boundary'];
    return [...elements].sort((a, b) => {
      const aIndex = order.indexOf(getElementCategory(a));
      const bIndex = order.indexOf(getElementCategory(b));
      return aIndex - bIndex;
    });
  }, [elements]);

  return (
    <Layer>
      {sortedElements.map((element) => {
        const isSelected = selectedIds.includes(element.id);
        
        return (
          <CanvasElementComponent
            key={element.id}
            element={element}
            isSelected={isSelected}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onUpdate={onUpdate}
            onCommit={onCommit}
            GRID_PX={GRID_PX}
            scale={scale}
            onSetActiveInstructionSet={onSetActiveInstructionSet}
            resolution={resolution}
          >
            {renderElement(
              element, 
              isSelected, 
              scale, 
              GRID_PX,
              resolution || 1,
              gridWidth, 
              gridHeight,
              onUpdate,
              onCommit,
              onSetActiveInstructionSet,
              selectedIds,
              gridSnapping,
              resolutionSnapping,
              showGrid,
              showResolutionOverlay,
              toggleShowGrid,
              toggleShowResolutionOverlay
            )}
          </CanvasElementComponent>
        );
      })}
    </Layer>
  );
};

function getElementCategory(element: CanvasElement): string {
  if (element.type === 'lattice') return 'lattice';
  if (element.type === 'pmlBoundary') return 'boundary';
  if ('component' in element) return 'source';
  return element.type;
}

function renderElement(
  element: CanvasElement,
  isSelected: boolean,
  scale: number,
  GRID_PX: number,
  resolution: number,  // Now required, not optional
  gridWidth: number,
  gridHeight: number,
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void,
  onCommit: (id: string, updates: Partial<CanvasElement>) => void,
  onSetActiveInstructionSet?: (set: string) => void,
  selectedIds?: string[],
  gridSnapping?: boolean,
  resolutionSnapping?: boolean,
  showGrid?: boolean,
  showResolutionOverlay?: boolean,
  toggleShowGrid?: () => void,
  toggleShowResolutionOverlay?: () => void
): React.ReactNode {
  // Type guards for proper type narrowing
  if (element.type === 'cylinder' || element.type === 'rectangle' || element.type === 'triangle') {
    // For rectangles with resize handles, we return a special structure
    if (element.type === 'rectangle' && isSelected && !element.locked && selectedIds?.length === 1) {
      return (
        <>
          <GeometryRenderer
            geometry={element as any}
            isSelected={isSelected}
            scale={scale}
            GRID_PX={GRID_PX}
            resolution={resolution}
            onResize={(updates: Partial<CanvasElement>) => onUpdate(element.id, updates)}
            onResizeEnd={(updates: Partial<CanvasElement>) => onCommit(element.id, updates)}
            handleUpdateGeometry={(id: string, updates: Partial<CanvasElement>) => onCommit(id, updates)}
          />
          <ResizeHandles
            rectangle={element as any}
            GRID_PX={GRID_PX}
            scale={scale}
            onResize={(updates: Partial<CanvasElement>) => onUpdate(element.id, updates)}
            onResizeEnd={(updates: Partial<CanvasElement>) => onCommit(element.id, updates)}
            snapToGrid={(value: number, forceGrid?: boolean, forceResolution?: boolean) => {
              const res = resolution;
              if (forceResolution && res && res > 1) {
                const cellSize = 1 / res;
                return Math.round(value / cellSize) * cellSize;
              } else if (forceGrid) {
                return Math.round(value);
              } else if (resolutionSnapping && res && res > 1) {
                const cellSize = 1 / res;
                return Math.round(value / cellSize) * cellSize;
              } else if (gridSnapping) {
                return Math.round(value);
              }
              return value;
            }}
            gridSnapping={gridSnapping || false}
            resolutionSnapping={resolutionSnapping || false}
            showGrid={showGrid || false}
            showResolutionOverlay={showResolutionOverlay || false}
            toggleShowGrid={toggleShowGrid || (() => {})}
            toggleShowResolutionOverlay={toggleShowResolutionOverlay || (() => {})}
            handleUpdateGeometry={(id: string, updates: Partial<CanvasElement>) => onCommit(id, updates)}
            setActiveInstructionSet={(key: string) => onSetActiveInstructionSet?.(key)}
          />
        </>
      );
    }
    
    return (
      <GeometryRenderer
        geometry={element as any}
        isSelected={isSelected}
        scale={scale}
        GRID_PX={GRID_PX}
        resolution={resolution}
      />
    );
  }
  
  if (element.type === 'continuousSource' || element.type === 'gaussianSource' || 
      element.type === 'eigenModeSource' || element.type === 'gaussianBeamSource') {
    return (
      <SourceRenderer
        source={element as any}
        isSelected={isSelected}
        scale={scale}
        GRID_PX={GRID_PX}
      />
    );
  }
  
  if (element.type === 'pmlBoundary') {
    return (
      <BoundaryRenderer
        boundary={element as any}
        isSelected={isSelected}
        scale={scale}
        GRID_PX={GRID_PX}
        gridWidth={gridWidth}
        gridHeight={gridHeight}
      />
    );
  }
  
  if (element.type === 'lattice') {
    return (
      <LatticeRenderer
        lattice={element as any}
        isSelected={isSelected}
        scale={scale}
        GRID_PX={GRID_PX}
      />
    );
  }
  
  return null;
}
