import React from "react";
import { Line, Rect } from "react-konva";

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
      {/* Draw grid lines and overlays first */}
      {gridLines}
      {resolutionLines}
      {/* Draw border rectangle last */}
      <Rect
        x={0}
        y={0}
        width={LOGICAL_W}
        height={LOGICAL_H}
        stroke="black"
        strokeWidth={2}
        listening={false}
      />
    </>
  );
}
