import React from 'react';
import { Circle, Rect, Line, Group } from 'react-konva';
import { Cylinder, Rectangle, Triangle } from '../../types/canvasElementTypes';
import { useCanvasColors } from '../utils/colorUtils';
import { ResizeHandles } from '../utils/resizeHandles';
import { useCanvasStore } from '../../stores/canvas';

interface GeometryRendererProps {
  geometry: Cylinder | Rectangle | Triangle;
  isSelected: boolean;
  scale: number;
  GRID_PX: number;
  resolution?: number;
  onResize?: (updates: any) => void;
  onResizeEnd?: (updates: any) => void;
  handleUpdateGeometry?: (id: string, updates: any) => void;
}

export const GeometryRenderer: React.FC<GeometryRendererProps> = ({
  geometry,
  isSelected,
  scale,
  GRID_PX,
  resolution,
  onResize,
  onResizeEnd,
  handleUpdateGeometry,
}) => {
  const { getFillColor, getStrokeColor, getStrokeWidth } = useCanvasColors();
  
  // Get canvas store state for resize handles
  const { gridSnapping, resolutionSnapping, showGrid, showResolutionOverlay, toggleShowGrid, toggleShowResolutionOverlay } = useCanvasStore();
  
  const fillColor = getFillColor(geometry);
  const strokeColor = getStrokeColor(geometry, isSelected);
  const strokeWidth = getStrokeWidth(isSelected, scale);
  
  // Helper function to snap values
  const snapToGrid = React.useCallback((value: number, forceGrid?: boolean, forceResolution?: boolean) => {
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
  }, [gridSnapping, resolutionSnapping, resolution]);
  
  switch (geometry.kind) {
    case 'cylinder':
      return (
        <Circle
          radius={geometry.radius * GRID_PX}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    
    case 'rectangle':
      // For rectangles, we need to separate the shape from the handles
      // Return just the shape here, handles will be added by the parent
      return (
        <Rect
          width={geometry.width * GRID_PX}
          height={geometry.height * GRID_PX}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          offsetX={(geometry.width * GRID_PX) / 2}
          offsetY={(geometry.height * GRID_PX) / 2}
        />
      );
    
    case 'triangle':
      return (
        <Line
          points={geometry.vertices.flatMap((v: any) => [v.x * GRID_PX, v.y * GRID_PX])}
          closed
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
  }
};
