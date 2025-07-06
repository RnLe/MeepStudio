import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { PmlBoundary } from '../../types/canvasElementTypes';
import { CanvasPMLBoundary } from '../../types/meepBoundaryTypes';
import { useCanvasStore } from '../../stores/canvas';

const PARAM_SET_COLORS: Record<number, string> = {
  0: '#1e2939',
  1: '#392e1e',
  2: '#211e39',
  3: '#36391e'
};

interface BoundaryRendererProps {
  boundary: PmlBoundary;
  isSelected: boolean;
  scale: number;
  GRID_PX: number;
  gridWidth: number;
  gridHeight: number;
  onSelect?: (id: string, options?: { shift?: boolean }) => void;
}

export const BoundaryRenderer: React.FC<BoundaryRendererProps> = ({
  boundary,
  isSelected,
  scale,
  GRID_PX,
  gridWidth,
  gridHeight,
  onSelect,
}) => {
  const showColors = useCanvasStore((s) => s.showColors);
  const getElementColorVisibility = useCanvasStore((s) => s.getElementColorVisibility);
  const showXRayMode = useCanvasStore((s) => s.showXRayMode);
  const getElementXRayTransparency = useCanvasStore((s) => s.getElementXRayTransparency);
  
  // Get the full boundary data from the store
  const boundaries = useCanvasStore((s) => s.boundaries);
  const fullBoundary = boundaries.find(b => b.id === boundary.id) as CanvasPMLBoundary | undefined;
  
  if (!fullBoundary) return null;
  
  const CANVAS_W = gridWidth * GRID_PX;
  const CANVAS_H = gridHeight * GRID_PX;
  
  // Helper to get effective assignment
  const getEffectiveAssignment = (edge: 'top' | 'bottom' | 'left' | 'right') => {
    const explicit = fullBoundary.edgeAssignments?.[edge];
    if (explicit !== undefined) return explicit;
    if (fullBoundary.parameterSets?.[0]?.active) return 0;
    return undefined;
  };

  // Helper to get edge color
  const getEdgeColor = (edge: 'top' | 'bottom' | 'left' | 'right') => {
    const showBoundaryColors = getElementColorVisibility('boundaries');
    const boundaryTransparency = getElementXRayTransparency('boundaries');
    const assignment = getEffectiveAssignment(edge);
    
    if (!showBoundaryColors) {
      if (assignment !== undefined) {
        const opacity = showXRayMode ? boundaryTransparency : 1;
        return `rgba(0, 0, 0, ${opacity})`;
      }
      const opacity = showXRayMode ? boundaryTransparency * 0.6 : 0.6;
      return `rgba(0, 0, 0, ${opacity})`;
    }
    
    if (assignment !== undefined) {
      const base = PARAM_SET_COLORS[assignment];
      const [r, g, b] = [1, 3, 5].map(i => parseInt(base.slice(i, i + 2), 16));
      const op = showXRayMode ? boundaryTransparency : 1;
      return `rgba(${r},${g},${b},${op})`;
    }
    
    const opacity = showXRayMode ? boundaryTransparency * 0.8 : 0.8;
    return `rgba(59, 130, 246, ${opacity})`;
  };

  // Check which edges should be rendered
  const shouldRenderEdge = (edge: 'top' | 'bottom' | 'left' | 'right') => {
    if (fullBoundary.edgeAssignments !== undefined) {
      const assignment = fullBoundary.edgeAssignments[edge];
      if (assignment !== undefined && fullBoundary.parameterSets?.[assignment]?.active) {
        return true;
      }
      if (Object.keys(fullBoundary.edgeAssignments).length === 0 && fullBoundary.parameterSets?.[0]?.active) {
        return true;
      }
      return false;
    }
    
    // Legacy direction system
    switch (fullBoundary.direction) {
      case "ALL": return true;
      case "X": return edge === 'left' || edge === 'right';
      case "Y": return edge === 'top' || edge === 'bottom';
      case "+X": return edge === 'right';
      case "-X": return edge === 'left';
      case "+Y": return edge === 'bottom';
      case "-Y": return edge === 'top';
      default: return true;
    }
  };

  // Get thickness for edge
  const getEdgeThickness = (edge: 'top' | 'bottom' | 'left' | 'right') => {
    const assignment = fullBoundary.edgeAssignments?.[edge];
    if (assignment !== undefined && fullBoundary.parameterSets?.[assignment]) {
      return (fullBoundary.parameterSets[assignment].thickness || 1) * GRID_PX;
    }
    if (!fullBoundary.edgeAssignments || Object.keys(fullBoundary.edgeAssignments).length === 0) {
      if (fullBoundary.parameterSets?.[0]?.active) {
        return (fullBoundary.parameterSets[0].thickness || 1) * GRID_PX;
      }
    }
    return (fullBoundary.thickness || 1) * GRID_PX;
  };

  // Render edges
  const edges: React.ReactNode[] = [];
  
  if (shouldRenderEdge('top')) {
    edges.push(
      <Rect
        key="top"
        x={0}
        y={0}
        width={CANVAS_W}
        height={getEdgeThickness('top')}
        fill={getEdgeColor('top')}
        stroke={isSelected ? "#50a2ff" : undefined}
        strokeWidth={isSelected ? 2 / scale : 0}
      />
    );
  }
  
  if (shouldRenderEdge('bottom')) {
    edges.push(
      <Rect
        key="bottom"
        x={0}
        y={CANVAS_H - getEdgeThickness('bottom')}
        width={CANVAS_W}
        height={getEdgeThickness('bottom')}
        fill={getEdgeColor('bottom')}
        stroke={isSelected ? "#50a2ff" : undefined}
        strokeWidth={isSelected ? 2 / scale : 0}
      />
    );
  }
  
  if (shouldRenderEdge('left')) {
    const topOffset = shouldRenderEdge('top') ? getEdgeThickness('top') : 0;
    const bottomOffset = shouldRenderEdge('bottom') ? getEdgeThickness('bottom') : 0;
    edges.push(
      <Rect
        key="left"
        x={0}
        y={topOffset}
        width={getEdgeThickness('left')}
        height={CANVAS_H - topOffset - bottomOffset}
        fill={getEdgeColor('left')}
        stroke={isSelected ? "#50a2ff" : undefined}
        strokeWidth={isSelected ? 2 / scale : 0}
      />
    );
  }
  
  if (shouldRenderEdge('right')) {
    const topOffset = shouldRenderEdge('top') ? getEdgeThickness('top') : 0;
    const bottomOffset = shouldRenderEdge('bottom') ? getEdgeThickness('bottom') : 0;
    edges.push(
      <Rect
        key="right"
        x={CANVAS_W - getEdgeThickness('right')}
        y={topOffset}
        width={getEdgeThickness('right')}
        height={CANVAS_H - topOffset - bottomOffset}
        fill={getEdgeColor('right')}
        stroke={isSelected ? "#50a2ff" : undefined}
        strokeWidth={isSelected ? 2 / scale : 0}
      />
    );
  }

  return (
    <Group
      onClick={(e) => {
        if (onSelect) {
          e.cancelBubble = true;
          onSelect(boundary.id, {
            shift: e.evt?.shiftKey || e.evt?.ctrlKey || e.evt?.metaKey || false,
          });
        }
      }}
    >
      {edges}
    </Group>
  );
};
