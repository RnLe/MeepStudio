import React from 'react';
import { Circle, Line, Rect } from 'react-konva';
import { Source } from '../../types/meepSourceTypes';
import { useCanvasStore } from '../../stores/canvas';

interface SourceRendererProps {
  source: { id: string; kind: string; pos: { x: number; y: number } };
  isSelected: boolean;
  scale: number;
  GRID_PX: number;
}

export const SourceRenderer: React.FC<SourceRendererProps> = ({
  source,
  isSelected,
  scale,
  GRID_PX,
}) => {
  // Get the full source data from the store
  const sources = useCanvasStore((s) => s.sources);
  const showXRayMode = useCanvasStore((s) => s.showXRayMode);
  const getElementXRayTransparency = useCanvasStore((s) => s.getElementXRayTransparency);
  const fullSource = sources.find(s => s.id === source.id) as Source | undefined;
  
  if (!fullSource) return null;
  
  // Now TypeScript knows fullSource has the correct type with size property
  const sizeX = (fullSource.size?.x || 0) * GRID_PX;
  const sizeY = (fullSource.size?.y || 0) * GRID_PX;
  const visualType = sizeX === 0 && sizeY === 0 ? 'point' : 
                    (sizeX === 0 || sizeY === 0) ? 'line' : 'rectangle';

  // Colors and transparency
  const baseColor = source.kind === "continuousSource" ? "#f59e0b" :
                   source.kind === "gaussianSource" ? "#3b82f6" :
                   source.kind === "eigenModeSource" ? "#8b5cf6" :
                   source.kind === "gaussianBeamSource" ? "#10b981" : "#6b7280";

  const strokeColor = isSelected ? "#50a2ff" : "#000000";
  
  // Calculate transparency
  const sourceTransparency = getElementXRayTransparency('sources');
  const finalOpacity = showXRayMode ? sourceTransparency : 1;

  switch (visualType) {
    case 'point':
      return (
        <Circle
          x={0}
          y={0}
          radius={6 / scale}
          fill={isSelected ? "#50a2ff" : "#000000"}
          stroke={isSelected ? "#50a2ff" : "#000000"}
          opacity={finalOpacity}
        />
      );

    case 'line':
      return (
        <Line
          points={sizeX === 0 ? [0, -sizeY/2, 0, sizeY/2] : [-sizeX/2, 0, sizeX/2, 0]}
          stroke={isSelected ? "#50a2ff" : "#000000"}
          strokeWidth={6 / scale}
          lineCap="butt"
          opacity={finalOpacity}
        />
      );

    case 'rectangle':
      return (
        <Rect
          x={-sizeX/2}
          y={-sizeY/2}
          width={sizeX}
          height={sizeY}
          fill="#000000"
          stroke={isSelected ? "#50a2ff" : "#000000"}
          strokeWidth={2 / scale}
          opacity={finalOpacity}
        />
      );
  }
};
