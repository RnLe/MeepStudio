import React from 'react';
import { Rect, Line, Group, Text } from 'react-konva';
import { RegionBox } from '../../types/canvasElementTypes';
import { useCanvasStore } from '../../stores/canvas';

interface RegionBoxRendererProps {
  regionBox: RegionBox;
  isSelected: boolean;
  scale: number;
  GRID_PX: number;
}

export const RegionBoxRenderer: React.FC<RegionBoxRendererProps> = ({
  regionBox,
  isSelected,
  scale,
  GRID_PX,
}) => {
  const showXRayMode = useCanvasStore((s) => s.showXRayMode);
  const getElementXRayTransparency = useCanvasStore((s) => s.getElementXRayTransparency);

  // Calculate visual dimensions
  const width = regionBox.width * GRID_PX;
  const height = regionBox.height * GRID_PX;

  // Colors based on region type
  const baseColor = regionBox.regionType === "flux" ? "#ef4444" :      // red
                   regionBox.regionType === "energy" ? "#f97316" :    // orange
                   regionBox.regionType === "force" ? "#8b5cf6" :     // purple
                   "#6b7280";                                          // gray

  const strokeColor = isSelected ? "#50a2ff" : baseColor;
  const fillColor = `${baseColor}10`; // Very transparent fill

  // Calculate transparency
  const regionTransparency = getElementXRayTransparency('regions');
  const finalOpacity = showXRayMode ? regionTransparency : 0.8;

  // Line thickness for edges
  const lineThickness = Math.max(3 / scale, 1.5);

  // Edge positions - prevent overlap: top/bottom take full width, left/right are inset
  const inset = lineThickness / 2;
  const edges = {
    top: { x1: -width/2, y1: -height/2, x2: width/2, y2: -height/2 },
    right: { x1: width/2, y1: -height/2 + inset, x2: width/2, y2: height/2 - inset },
    bottom: { x1: width/2, y1: height/2, x2: -width/2, y2: height/2 },
    left: { x1: -width/2, y1: height/2 - inset, x2: -width/2, y2: -height/2 + inset }
  };

  // Get edge color based on weight sign and selection
  const getEdgeColor = (weight: number, edgeName: string) => {
    if (weight === 0) return '#6b7280'; // Gray for disabled
    
    // Always use baseColor (which changes with regionType), regardless of weight sign
    return baseColor;
  };

  // Get edge opacity based on enabled state
  const getEdgeOpacity = (enabled: boolean, weight: number) => {
    if (!enabled || weight === 0) return 0; // Disabled edges are completely transparent
    return finalOpacity;
  };

  // Check if all edges are disabled
  const allEdgesDisabled = !regionBox.edges.top.enabled && 
                          !regionBox.edges.right.enabled && 
                          !regionBox.edges.bottom.enabled && 
                          !regionBox.edges.left.enabled;

  return (
    <Group>
      {/* Selection bounding box - thin light blue outline when selected */}
      {isSelected && (
        <Rect
          x={-width/2 - 3}
          y={-height/2 - 3}
          width={width + 6}
          height={height + 6}
          fill="transparent"
          stroke="#7dd3fc"
          strokeWidth={3 / scale}
          opacity={0.8}
        />
      )}

      {/* Background rectangle for area */}
      <Rect
        x={-width/2}
        y={-height/2}
        width={width}
        height={height}
        fill={fillColor}
        stroke="transparent"
        opacity={0.1}
      />

      {/* Individual edge lines */}
      {Object.entries(edges).map(([edgeName, edgePos]) => {
        const edge = regionBox.edges[edgeName as keyof typeof regionBox.edges];
        const edgeColor = getEdgeColor(edge.weight, edgeName);
        const edgeOpacity = getEdgeOpacity(edge.enabled, edge.weight);
        
        return (
          <Line
            key={edgeName}
            points={[edgePos.x1, edgePos.y1, edgePos.x2, edgePos.y2]}
            stroke={edgeColor}
            strokeWidth={Math.abs(edge.weight) * lineThickness + lineThickness}
            opacity={edgeOpacity}
            lineCap="butt"
          />
        );
      })}

      {/* Weight indicators for each edge */}
      {Object.entries(edges).map(([edgeName, edgePos]) => {
        const edge = regionBox.edges[edgeName as keyof typeof regionBox.edges];
        if (!edge.enabled || edge.weight === 0) return null;

        const edgeOpacity = getEdgeOpacity(edge.enabled, edge.weight);

        // Calculate text position at edge midpoint
        const textX = (edgePos.x1 + edgePos.x2) / 2;
        const textY = (edgePos.y1 + edgePos.y2) / 2;
        
        // Offset text slightly away from edge
        const offsetDistance = 25 / scale; // Increased from 15 to 25 for better readability
        let offsetX = 0, offsetY = 0;
        
        switch (edgeName) {
          case 'top': offsetY = -offsetDistance; break;
          case 'bottom': offsetY = offsetDistance; break;
          case 'left': offsetX = -offsetDistance; break;
          case 'right': offsetX = offsetDistance; break;
        }

        return (
          <Text
            key={`${edgeName}-label`}
            x={textX + offsetX}
            y={textY + offsetY}
            text={edge.weight > 0 ? `+${edge.weight.toFixed(1)}` : edge.weight.toFixed(1)}
            fontSize={16 / scale}
            fill={getEdgeColor(edge.weight, edgeName)}
            align="center"
            verticalAlign="middle"
            offsetX={0} // Center horizontally
            offsetY={8 / scale} // Center vertically (half of font size)
            opacity={edgeOpacity}
          />
        );
      })}

      {/* Arrow indicators for edge direction */}
      {Object.entries(edges).map(([edgeName, edgePos]) => {
        const edge = regionBox.edges[edgeName as keyof typeof regionBox.edges];
        if (!edge.enabled || edge.weight === 0) return null;

        const edgeOpacity = getEdgeOpacity(edge.enabled, edge.weight);
        const arrowSize = 36 / scale; // Increased from 24 to 36 for much longer arrows
        
        // Calculate arrow position at edge midpoint
        const arrowX = (edgePos.x1 + edgePos.x2) / 2;
        const arrowY = (edgePos.y1 + edgePos.y2) / 2;
        
        // Get arrow direction based on edge and weight sign
        let arrowPoints: number[] = [];
        const isPositive = edge.weight > 0;
        
        switch (edgeName) {
          case 'top':
            // Top edge: positive = up, negative = down
            if (isPositive) {
              arrowPoints = [arrowX, arrowY - arrowSize, arrowX - arrowSize/4, arrowY, arrowX + arrowSize/4, arrowY];
            } else {
              arrowPoints = [arrowX, arrowY + arrowSize, arrowX - arrowSize/4, arrowY, arrowX + arrowSize/4, arrowY];
            }
            break;
          case 'bottom':
            // Bottom edge: for default -1.0 weight, should point UP (inward to box)
            if (isPositive) {
              arrowPoints = [arrowX, arrowY + arrowSize, arrowX - arrowSize/4, arrowY, arrowX + arrowSize/4, arrowY];
            } else {
              arrowPoints = [arrowX, arrowY - arrowSize, arrowX - arrowSize/4, arrowY, arrowX + arrowSize/4, arrowY];
            }
            break;
          case 'left':
            // Left edge: for default -1.0 weight, should point RIGHT (inward to box)
            if (isPositive) {
              arrowPoints = [arrowX - arrowSize, arrowY, arrowX, arrowY - arrowSize/4, arrowX, arrowY + arrowSize/4];
            } else {
              arrowPoints = [arrowX + arrowSize, arrowY, arrowX, arrowY - arrowSize/4, arrowX, arrowY + arrowSize/4];
            }
            break;
          case 'right':
            // Right edge: positive = right, negative = left
            if (isPositive) {
              arrowPoints = [arrowX + arrowSize, arrowY, arrowX, arrowY - arrowSize/4, arrowX, arrowY + arrowSize/4];
            } else {
              arrowPoints = [arrowX - arrowSize, arrowY, arrowX, arrowY - arrowSize/4, arrowX, arrowY + arrowSize/4];
            }
            break;
        }

        return (
          <Line
            key={`${edgeName}-arrow`}
            points={arrowPoints}
            fill={getEdgeColor(edge.weight, edgeName)}
            stroke={getEdgeColor(edge.weight, edgeName)}
            strokeWidth={1 / scale}
            opacity={edgeOpacity * 0.8}
            closed={true}
          />
        );
      })}

      {/* Center label */}
      <Text
        x={0}
        y={0}
        text={`${regionBox.regionType?.toUpperCase() || 'FLUX'}${allEdgesDisabled ? ' (DISABLED)' : ''}`}
        fontSize={18 / scale} 
        fill={baseColor}
        align="center"
        verticalAlign="middle"
        offsetX={0} // Center horizontally
        offsetY={9 / scale} // Center vertically (half of font size)
        opacity={finalOpacity * 0.7}
      />
    </Group>
  );
};
