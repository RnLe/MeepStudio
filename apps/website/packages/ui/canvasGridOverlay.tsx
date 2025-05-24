import React from "react";
import { Rect } from "react-konva";

// inset border so stroke doesn’t cover inner area
const BORDER_WIDTH = 2;
const INSET = BORDER_WIDTH / 2;

/**
 * GridOverlayLayer renders the main grid, resolution overlay, and border rectangle.
 * Draws grid lines and overlays first, then the border rectangle last.
 */
export function GridOverlayLayer({ gridLines, resolutionLines, LOGICAL_W, LOGICAL_H }: {
  gridLines: React.ReactNode;
  resolutionLines: React.ReactNode;
  LOGICAL_W: number;
  LOGICAL_H: number;
}) {
  return (
    <>
      {/* Draw resolution overlay first, then main grid on top */}
      {resolutionLines}
      {gridLines}
      {/* Outset border rectangle so inner edge matches content area */}
      <Rect
        x={-INSET}
        y={-INSET}
        width={LOGICAL_W + BORDER_WIDTH}
        height={LOGICAL_H + BORDER_WIDTH}
        stroke="black"
        strokeWidth={BORDER_WIDTH}
        listening={false}
      />
    </>
  );
}
