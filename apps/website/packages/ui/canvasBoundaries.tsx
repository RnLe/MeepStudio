"use client";

import React, { useState, useRef, useEffect } from "react";
import { Group, Rect, Text } from "react-konva";
import { useCanvasStore } from "../providers/CanvasStore";

// Parameter set colors matching PMLBoundaryProperties
const PARAM_SET_COLORS: Record<number, string> = {
  0: '#60a5fa',    // blue-400
  1: '#f97316',    // orange-500
  2: '#a855f7',    // purple-500
  3: '#eab308'     // yellow-500
};

export const BoundaryLayer: React.FC<{
  boundaries: any[];
  selectedIds: string[];
  selectElement: (id: string | null, opts?: { shift?: boolean }) => void;
  GRID_PX: number;
  gridWidth: number;
  gridHeight: number;
  project: any;
  scale: number;
}> = ({
  boundaries,
  selectedIds,
  selectElement,
  GRID_PX,
  gridWidth,
  gridHeight,
  project,
  scale,
}) => {
  // Canvas dimensions in pixels
  const CANVAS_W = gridWidth * GRID_PX;
  const CANVAS_H = gridHeight * GRID_PX;

  // Tooltip offset tuples for each boundary edge [x, y]
  const TOP_OFFSET = [-180, 20];    // Tooltip below top edge
  const BOTTOM_OFFSET = [-180, -30]; // Tooltip above bottom edge
  const LEFT_OFFSET = [-160, 0];   // Tooltip right of left edge
  const RIGHT_OFFSET = [-210, -20];  // Tooltip left of right edge

  // State for hover - now tracking which specific edge
  const [hoveredBoundaryId, setHoveredBoundaryId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Helper to get edge color based on parameter set assignment
  const getEdgeColor = (boundary: any, edge: 'top' | 'bottom' | 'left' | 'right', selected: boolean, hovered: boolean) => {
    const assignment = boundary.edgeAssignments?.[edge];
    
    // If edge has an assigned parameter set and that set is active
    if (assignment !== undefined && boundary.parameterSets?.[assignment]?.active) {
      const baseColor = PARAM_SET_COLORS[assignment];
      
      // Parse hex color and apply opacity
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      
      const opacity = selected ? 0.6 : hovered ? 0.4 : 0.3;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // Default blue color for unassigned or legacy boundaries
    return selected 
      ? "rgba(59, 130, 246, 0.4)"  // blue-500 with 40% opacity
      : hovered 
      ? "rgba(59, 130, 246, 0.25)" // blue-500 with 25% opacity
      : "rgba(59, 130, 246, 0.2)";  // blue-500 with 20% opacity
  };

  // Helper to get edge stroke color
  const getEdgeStrokeColor = (boundary: any, edge: 'top' | 'bottom' | 'left' | 'right') => {
    const assignment = boundary.edgeAssignments?.[edge];
    
    if (assignment !== undefined && boundary.parameterSets?.[assignment]?.active) {
      const baseColor = PARAM_SET_COLORS[assignment];
      // Darken the color slightly for stroke
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      return `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
    }
    
    return "#2563eb"; // blue-600 default
  };

  // Helper to render PML boundaries
  const renderPMLBoundary = (boundary: any) => {
    if (boundary.kind !== "pmlBoundary") return null;

    const selected = selectedIds.includes(boundary.id);
    const hovered = hoveredBoundaryId === boundary.id;
    
    const strokeWidth = selected ? 2 / scale : 0; // Only show stroke when selected

    const rects: React.ReactNode[] = [];

    // Get thickness for a specific edge
    const getEdgeThickness = (edge: 'top' | 'bottom' | 'left' | 'right') => {
      const assignment = boundary.edgeAssignments?.[edge];
      if (assignment !== undefined && boundary.parameterSets?.[assignment]) {
        return (boundary.parameterSets[assignment].thickness || 1) * GRID_PX;
      }
      return (boundary.thickness || 1) * GRID_PX;
    };

    // Helper to create rect with handlers - now tracks which edge and uses edge-specific colors
    const createRect = (key: string, x: number, y: number, width: number, height: number, edge: 'top' | 'bottom' | 'left' | 'right') => {
      const edgeHovered = hovered && hoveredEdge === edge;
      const fillColor = getEdgeColor(boundary, edge, selected, edgeHovered);
      const strokeColor = selected ? getEdgeStrokeColor(boundary, edge) : undefined;
      
      // Only show stroke on outer edges to avoid double borders
      const showStroke = selected && (() => {
        switch (edge) {
          case 'top': return true; // Always show top stroke
          case 'bottom': return true; // Always show bottom stroke
          case 'left': return !shouldRenderEdge('top') && !shouldRenderEdge('bottom'); // Only if no top/bottom
          case 'right': return !shouldRenderEdge('top') && !shouldRenderEdge('bottom'); // Only if no top/bottom
          default: return false;
        }
      })();
      
      return (
        <Rect
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fillColor}
          stroke={showStroke ? strokeColor : undefined}
          strokeWidth={strokeWidth}
          onMouseEnter={(e) => {
            setHoveredBoundaryId(boundary.id);
            setHoveredEdge(edge);
            const stage = e.target.getStage();
            const pos = stage?.getPointerPosition();
            if (pos) {
              setTooltipPos({ x: pos.x, y: pos.y });
            }
          }}
          onMouseMove={(e) => {
            const stage = e.target.getStage();
            const pos = stage?.getPointerPosition();
            if (pos) {
              setTooltipPos({ x: pos.x, y: pos.y });
            }
          }}
          onMouseLeave={() => {
            setHoveredBoundaryId(null);
            setHoveredEdge(null);
            setTooltipPos(null);
          }}
        />
      );
    };

    // Check which edges should be rendered based on edgeAssignments
    const shouldRenderEdge = (edge: 'top' | 'bottom' | 'left' | 'right') => {
      // If using new edge assignments system
      if (boundary.edgeAssignments) {
        const assignment = boundary.edgeAssignments[edge];
        return assignment !== undefined && boundary.parameterSets?.[assignment]?.active;
      }
      
      // Fall back to legacy direction system
      switch (boundary.direction) {
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

    // Get individual edge thicknesses
    const topThickness = getEdgeThickness('top');
    const bottomThickness = getEdgeThickness('bottom');
    const leftThickness = getEdgeThickness('left');
    const rightThickness = getEdgeThickness('right');

    // Render individual edges based on assignments with proper priority
    // Top and bottom edges have priority (full width)
    if (shouldRenderEdge('top')) {
      rects.push(createRect(`${boundary.id}-top`, 0, 0, CANVAS_W, topThickness, 'top'));
    }
    if (shouldRenderEdge('bottom')) {
      rects.push(createRect(`${boundary.id}-bottom`, 0, CANVAS_H - bottomThickness, CANVAS_W, bottomThickness, 'bottom'));
    }
    
    // Left and right edges fill the remaining height
    if (shouldRenderEdge('left')) {
      const topOffset = shouldRenderEdge('top') ? topThickness : 0;
      const bottomOffset = shouldRenderEdge('bottom') ? bottomThickness : 0;
      rects.push(createRect(
        `${boundary.id}-left`, 
        0, 
        topOffset, 
        leftThickness, 
        CANVAS_H - topOffset - bottomOffset, 
        'left'
      ));
    }
    if (shouldRenderEdge('right')) {
      const topOffset = shouldRenderEdge('top') ? topThickness : 0;
      const bottomOffset = shouldRenderEdge('bottom') ? bottomThickness : 0;
      rects.push(createRect(
        `${boundary.id}-right`, 
        CANVAS_W - rightThickness, 
        topOffset, 
        rightThickness, 
        CANVAS_H - topOffset - bottomOffset, 
        'right'
      ));
    }

    // Calculate tooltip dimensions and position
    const tooltipWidth = 105;
    const tooltipHeight = 72;
    const tooltipOffset = 10; // Distance from cursor in screen pixels
    
    let tooltipX = 0;
    let tooltipY = 0;
    
    if (tooltipPos && hovered && hoveredEdge) {
      // Get stage from the canvas to access pan and scale
      const stage = document.querySelector('.konvajs-content');
      if (!stage) return null;
      
      // Convert stage (screen) coordinates to logical (canvas) coordinates
      const stageX = tooltipPos.x;
      const stageY = tooltipPos.y;
      
      const logicalOffsetX = tooltipOffset / scale;
      const logicalOffsetY = tooltipOffset / scale;
      
      // Position based on which edge is hovered, with custom offsets
      switch (hoveredEdge) {
        case 'top':
          tooltipX = (stageX / scale) - (tooltipWidth / 2) + (TOP_OFFSET[0] / scale);
          tooltipY = (stageY / scale) + logicalOffsetY + (TOP_OFFSET[1] / scale);
          break;
        case 'bottom':
          tooltipX = (stageX / scale) - (tooltipWidth / 2) + (BOTTOM_OFFSET[0] / scale);
          tooltipY = (stageY / scale) - tooltipHeight - logicalOffsetY + (BOTTOM_OFFSET[1] / scale);
          break;
        case 'left':
          tooltipX = (stageX / scale) + logicalOffsetX + (LEFT_OFFSET[0] / scale);
          tooltipY = (stageY / scale) - (tooltipHeight / 2) + (LEFT_OFFSET[1] / scale);
          break;
        case 'right':
          tooltipX = (stageX / scale) - tooltipWidth - logicalOffsetX + (RIGHT_OFFSET[0] / scale);
          tooltipY = (stageY / scale) - (tooltipHeight / 2) + (RIGHT_OFFSET[1] / scale);
          break;
      }
      
      // Clamp to stage bounds
      const stageBounds = stage.getBoundingClientRect();
      const tooltipScreenX = tooltipX * scale;
      const tooltipScreenY = tooltipY * scale;
      const tooltipScreenWidth = tooltipWidth * scale;
      const tooltipScreenHeight = tooltipHeight * scale;
      
      // Adjust if tooltip goes off screen
      if (tooltipScreenX < 0) {
        tooltipX = logicalOffsetX;
      } else if (tooltipScreenX + tooltipScreenWidth > stageBounds.width) {
        tooltipX = (stageBounds.width / scale) - tooltipWidth - logicalOffsetX;
      }
      
      if (tooltipScreenY < 0) {
        tooltipY = logicalOffsetY;
      } else if (tooltipScreenY + tooltipScreenHeight > stageBounds.height) {
        tooltipY = (stageBounds.height / scale) - tooltipHeight - logicalOffsetY;
      }
    }

    // Get parameters for the hovered edge
    const getEdgeParams = () => {
      if (!hoveredEdge || !boundary.edgeAssignments) {
        // Fall back to default boundary parameters
        return {
          thickness: boundary.thickness,
          strength: boundary.strength,
          power: boundary.power,
          R_asymptotic: boundary.R_asymptotic
        };
      }
      
      const assignment = boundary.edgeAssignments[hoveredEdge];
      if (assignment !== undefined && boundary.parameterSets?.[assignment]) {
        return boundary.parameterSets[assignment];
      }
      
      // Default parameters
      return {
        thickness: boundary.thickness || 1,
        strength: boundary.strength || 1,
        power: boundary.power || 2,
        R_asymptotic: boundary.R_asymptotic || 1e-15
      };
    };

    const edgeParams = getEdgeParams();

    return (
      <Group
        key={boundary.id}
        onClick={(evt) => {
          evt.cancelBubble = true;
          const shift = evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey;
          selectElement(boundary.id, { shift });
        }}
        onTap={(evt) => {
          evt.cancelBubble = true;
          selectElement(boundary.id);
        }}
      >
        {rects}
        
        {/* Modern Tooltip */}
        {hovered && tooltipPos && hoveredEdge && (
          <Group 
            x={tooltipX} 
            y={tooltipY}
            listening={false}
          >
            {/* Background */}
            <Rect
              width={tooltipWidth}
              height={tooltipHeight}
              fill="#262626"
              cornerRadius={4}
              shadowColor="rgba(0, 0, 0, 0.5)"
              shadowBlur={6}
              shadowOffsetX={0}
              shadowOffsetY={2}
              shadowOpacity={0.3}
            />
            
            {/* Title with edge indicator */}
            <Text
              x={8}
              y={6}
              text={`PML - ${hoveredEdge.charAt(0).toUpperCase() + hoveredEdge.slice(1)}`}
              fontSize={13 / scale}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontStyle="500"
              fill="#f3f4f6"
            />
            
            {/* Properties grid */}
            <Group y={24}>
              {/* Thickness */}
              <Text
                x={8}
                y={0}
                text="Thickness:"
                fontSize={11 / scale}
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#9ca3af"
              />
              <Text
                x={60}
                y={0}
                text={edgeParams.thickness?.toFixed(2) || "1.00"}
                fontSize={11 / scale}
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#e5e7eb"
              />
              
              {/* Strength */}
              <Text
                x={8}
                y={12}
                text="Strength:"
                fontSize={11 / scale}
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#9ca3af"
              />
              <Text
                x={60}
                y={12}
                text={edgeParams.strength?.toFixed(1) || "1.0"}
                fontSize={11 / scale}
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#e5e7eb"
              />
              
              {/* Power */}
              <Text
                x={8}
                y={24}
                text="Power:"
                fontSize={11 / scale}
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#9ca3af"
              />
              <Text
                x={60}
                y={24}
                text={edgeParams.power?.toFixed(1) || "2.0"}
                fontSize={11 / scale}
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#e5e7eb"
              />
              
              {/* R_asymp */}
              <Text
                x={8}
                y={36}
                text="R_asymp:"
                fontSize={11 / scale}
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#9ca3af"
              />
              <Text
                x={60}
                y={36}
                text={edgeParams.R_asymptotic ? edgeParams.R_asymptotic.toExponential(1) : "1.0e-15"}
                fontSize={11 / scale}
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#e5e7eb"
              />
            </Group>
          </Group>
        )}
      </Group>
    );
  };

  // Render all boundaries
  return (
    <>
      {boundaries.map((boundary) => {
        // For now, only render PML boundaries
        // Future: support other boundary types
        return renderPMLBoundary(boundary);
      })}
    </>
  );
};
