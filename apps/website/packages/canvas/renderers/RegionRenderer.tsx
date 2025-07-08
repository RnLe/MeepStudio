import React from 'react';
import { Circle, Line, Rect, Arrow, Group } from 'react-konva';
import { FluxRegion } from '../../types/canvasElementTypes';
import { useCanvasStore } from '../../stores/canvas';
import { RegionDirection } from '../../types/meepRegionTypes';

interface RegionRendererProps {
  region: { id: string; kind: string; pos: { x: number; y: number } };
  isSelected: boolean;
  scale: number;
  GRID_PX: number;
}

export const RegionRenderer: React.FC<RegionRendererProps> = ({
  region,
  isSelected,
  scale,
  GRID_PX,
}) => {
  // Get the full region data from the store
  const regions = useCanvasStore((s) => s.regions);
  const showXRayMode = useCanvasStore((s) => s.showXRayMode);
  const getElementXRayTransparency = useCanvasStore((s) => s.getElementXRayTransparency);
  const fullRegion = regions.find(r => r.id === region.id) as FluxRegion | undefined;
  
  if (!fullRegion) return null;
  
  // Calculate visual size
  const sizeX = (fullRegion.size?.x || 0) * GRID_PX;
  const sizeY = (fullRegion.size?.y || 0) * GRID_PX;
  const visualType = sizeX === 0 && sizeY === 0 ? 'point' : 
                    (sizeX === 0 || sizeY === 0) ? 'line' : 'rectangle';

  // Colors based on region type
  const baseColor = fullRegion.regionType === "flux" ? "#ef4444" :      // red
                   fullRegion.regionType === "energy" ? "#f97316" :    // orange
                   fullRegion.regionType === "force" ? "#8b5cf6" :     // purple
                   "#6b7280";                                          // gray

  const strokeColor = isSelected ? "#50a2ff" : baseColor;
  const fillColor = baseColor; // Keep original color for fill, only border changes when selected

  // Calculate transparency
  const regionTransparency = getElementXRayTransparency('regions');
  const finalOpacity = showXRayMode ? regionTransparency : 1.0;

  // Direction arrow properties
  const arrowLength = Math.max(30 / scale, 15); // Increased size for better visibility
  const arrowOffset = Math.max(15 / scale, 8); // Offset from center for better visibility
  
  const directionInfo = React.useMemo(() => {
    // Get direction from region, default to X
    const direction = fullRegion.direction ?? 1; // Default to X direction
    
    // Weight sign determines direction polarity
    const weight = fullRegion.weight ?? 1.0;
    const actualSign = weight >= 0 ? 1 : -1;
    
    // Get axis color based on direction (canvas coordinates)
    let arrowColor = "#6b7280"; // Default gray
    switch (direction) {
      case 1: // X direction - red
        arrowColor = "#ef4444";
        break;
      case 2: // Y direction - green  
        arrowColor = "#22c55e";
        break;
      case 3: // Z direction - blue
        arrowColor = "#3b82f6";
        break;
    }
    
    // Calculate arrow direction and position - ALWAYS fixed to canvas axes
    let arrowPoints = [0, 0, 0, 0];
    let showAsCircle = false;
    
    switch (direction) {
      case 1: // X direction - ALWAYS horizontal
        if (actualSign > 0) {
          // Positive X direction (right)
          arrowPoints = [0, 0, arrowLength, 0];
        } else {
          // Negative X direction (left)
          arrowPoints = [0, 0, -arrowLength, 0];
        }
        break;
      case 2: // Y direction - ALWAYS vertical
        if (actualSign > 0) {
          // Positive Y direction (up in canvas, negative Y in screen coordinates)
          arrowPoints = [0, 0, 0, -arrowLength];
        } else {
          // Negative Y direction (down in canvas, positive Y in screen coordinates)
          arrowPoints = [0, 0, 0, arrowLength];
        }
        break;
      case 3: // Z direction - ALWAYS centered circle
        showAsCircle = true;
        break;
    }
    
    return {
      actualDir: direction,
      actualSign,
      arrowPoints,
      showAsCircle,
      arrowColor
    };
  }, [fullRegion.direction, fullRegion.weight, arrowLength]);

  return (
    <Group>
      {/* Main region shape - no rotation */}
      <Group>
        {visualType === 'point' && (
          <Circle
            x={0}
            y={0}
            radius={6 / scale}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2 / scale}
            opacity={finalOpacity}
          />
        )}
        
        {visualType === 'line' && (
          <Line
            points={sizeX === 0 ? [0, -sizeY/2, 0, sizeY/2] : [-sizeX/2, 0, sizeX/2, 0]}
            stroke={strokeColor}
            strokeWidth={4 / scale}
            lineCap="butt"
            opacity={finalOpacity}
          />
        )}
        
        {visualType === 'rectangle' && (
          <Rect
            x={-sizeX/2}
            y={-sizeY/2}
            width={sizeX}
            height={sizeY}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2 / scale}
            opacity={finalOpacity}
          />
        )}
      </Group>

      {/* Direction indicators - these do NOT rotate and stay aligned with canvas axes */}
      {!directionInfo.showAsCircle && (directionInfo.arrowPoints[2] !== directionInfo.arrowPoints[0] || directionInfo.arrowPoints[3] !== directionInfo.arrowPoints[1]) && (
        <Arrow
          points={directionInfo.arrowPoints}
          stroke={directionInfo.arrowColor}
          fill={directionInfo.arrowColor}
          strokeWidth={2.5 / scale}
          pointerLength={8 / scale}
          pointerWidth={6 / scale}
          opacity={finalOpacity}
        />
      )}

      {/* Z direction indicator (circle with dot/cross) - does NOT rotate */}
      {directionInfo.showAsCircle && (
        <Group 
          opacity={finalOpacity}
          x={0}
          y={0}
        >
          <Circle
            x={0}
            y={0}
            radius={10 / scale}
            stroke={directionInfo.arrowColor}
            strokeWidth={2.5 / scale}
            fill="transparent"
          />
          {directionInfo.actualSign > 0 ? (
            // Positive Z (out of page) - dot
            <Circle
              x={0}
              y={0}
              radius={3 / scale}
              fill={directionInfo.arrowColor}
            />
          ) : (
            // Negative Z (into page) - cross
            <Group>
              <Line
                points={[-5 / scale, -5 / scale, 5 / scale, 5 / scale]}
                stroke={directionInfo.arrowColor}
                strokeWidth={2 / scale}
              />
              <Line
                points={[-5 / scale, 5 / scale, 5 / scale, -5 / scale]}
                stroke={directionInfo.arrowColor}
                strokeWidth={2 / scale}
              />
            </Group>
          )}
        </Group>
      )}
    </Group>
  );
};
