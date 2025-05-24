import React from "react";
import { Layer, Rect } from "react-konva";

/**
 * SelectionBoxLayer renders the selection rectangle overlay.
 * Accepts the selection box state as props.
 */
export function SelectionBoxLayer({ selBox }: { selBox: { x: number; y: number; width: number; height: number } | null }) {
  if (!selBox) return null;
  return (
    <Layer>
      <Rect
        x={selBox.x}
        y={selBox.y}
        width={selBox.width}
        height={selBox.height}
        fill="rgba(0,123,255,0.2)"
        listening={false}
      />
    </Layer>
  );
}
