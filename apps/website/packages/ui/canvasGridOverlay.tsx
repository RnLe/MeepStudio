import React from "react";
import { Rect } from "react-konva";

// inset border so stroke doesn’t cover inner area
const BORDER_WIDTH = 2;
const INSET = BORDER_WIDTH / 2;

/**
 * GridOverlayLayer renders the main grid, resolution overlay, and border rectangle.
 * Draws grid lines and overlays first, then the border rectangle last.
 */
export function GridOverlayLayer({ gridLines, resolutionLines, LOGICAL_W, LOGICAL_H, borderWeight = 1 }: {
  gridLines: React.ReactNode;
  resolutionLines: React.ReactNode;
  LOGICAL_W: number;
  LOGICAL_H: number;
  borderWeight?: number;
}) {
  const baseStrokeWidth = 2;
  const dynamicStrokeWidth = baseStrokeWidth * borderWeight;

  return (
    <>
      {/* Draw resolution overlay first, then main grid on top */}
      {resolutionLines}
      {gridLines}
      {/* Main border with dynamic thickness */}
      <Rect
        x={0}
        y={0}
        width={LOGICAL_W}
        height={LOGICAL_H}
        stroke="#000"
        strokeWidth={dynamicStrokeWidth}
        fill={undefined}
        listening={false}
      />
    </>
  );
}
