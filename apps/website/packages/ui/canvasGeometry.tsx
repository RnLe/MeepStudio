import React from "react";
import { Cylinder, Rectangle as RectEl, Triangle } from "../types/canvasElementTypes";
import { Line, Circle, Rect } from "react-konva";

/**
 * Geometry rendering components for ProjectCanvas.
 * Handles cylinders, rectangles, triangles, and their drag/select logic.
 * Expects all props and helpers to be passed in from the parent.
 */

export function GeometryLayer({
  cylinders,
  rectangles,
  triangles,
  selectedIds,
  gridSnapping,
  resolutionSnapping,
  snapCanvasPosToGrid,
  multiDragAnchor,
  setMultiDragAnchor,
  geometries,
  updateGeometry,
  handleUpdateGeometry,
  selectElement,
  GRID_PX
}: any) {
  return (
    <>
      {cylinders.map((el: any) => {
        const isSel = selectedIds.includes(el.id);
        if (el.kind === "cylinder") {
          const c = el as Cylinder;
          return (
            <Circle
              key={c.id}
              x={c.pos.x * GRID_PX}
              y={c.pos.y * GRID_PX}
              radius={c.radius * GRID_PX}
              fill="rgba(59,130,246,0.25)"
              stroke="#3b82f6"
              strokeWidth={1}
              shadowBlur={isSel ? 8 : 0}
              draggable
              {...((gridSnapping || resolutionSnapping)
                ? {
                    dragBoundFunc: (canvasPos: any) => snapCanvasPosToGrid(canvasPos),
                  }
                : {}
              )}
              onDragStart={(evt) => {
                if (isSel && selectedIds.length > 1) {
                  setMultiDragAnchor({
                    id: c.id,
                    anchor: { x: c.pos.x, y: c.pos.y },
                    initialPositions: Object.fromEntries(selectedIds.map((id: string) => {
                      const g = geometries.find((g: any) => g.id === id);
                      return g ? [id, { x: g.pos.x, y: g.pos.y }] : null;
                    }).filter(Boolean) as [string, { x: number; y: number }][]),
                  });
                }
              }}
              onDragMove={(evt) => {
                if (multiDragAnchor && isSel && selectedIds.length > 1 && multiDragAnchor.id === c.id) {
                  const newX = evt.target.x() / GRID_PX;
                  const newY = evt.target.y() / GRID_PX;
                  const dx = newX - multiDragAnchor.anchor.x;
                  const dy = newY - multiDragAnchor.anchor.y;
                  selectedIds.forEach((id: string) => {
                    if (id === c.id) return;
                    const g = geometries.find((g: any) => g.id === id);
                    if (g) {
                      const init = multiDragAnchor.initialPositions[id];
                      if (init) {
                        updateGeometry(id, { pos: { x: init.x + dx, y: init.y + dy } });
                      }
                    }
                  });
                }
              }}
              onDragEnd={(evt) => {
                if (multiDragAnchor && isSel && selectedIds.length > 1 && multiDragAnchor.id === c.id) {
                  const newX = evt.target.x() / GRID_PX;
                  const newY = evt.target.y() / GRID_PX;
                  const dx = newX - multiDragAnchor.anchor.x;
                  const dy = newY - multiDragAnchor.anchor.y;
                  selectedIds.forEach((id: string) => {
                    const g = geometries.find((g: any) => g.id === id);
                    if (g) {
                      const init = multiDragAnchor.initialPositions[id];
                      if (init) {
                        handleUpdateGeometry(id, { pos: { x: init.x + dx, y: init.y + dy } });
                      }
                    }
                  });
                  setMultiDragAnchor(null);
                } else {
                  const x = evt.target.x() / GRID_PX;
                  const y = evt.target.y() / GRID_PX;
                  handleUpdateGeometry(c.id, { pos: { x, y } });
                }
              }}
              onClick={(evt) => selectElement(c.id, { shift: evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey })}
            />
          );
        }
        return null;
      })}
      {rectangles.map((el: any) => {
        const isSel = selectedIds.includes(el.id);
        if (el.kind === "rectangle") {
          const r = el as RectEl;
          return (
            <Rect
              key={r.id}
              x={r.pos.x * GRID_PX - r.width * GRID_PX * 0.5}
              y={r.pos.y * GRID_PX - r.height * GRID_PX * 0.5}
              width={r.width * GRID_PX}
              height={r.height * GRID_PX}
              fill="rgba(16,185,129,0.25)"
              stroke="#10b981"
              strokeWidth={1}
              shadowBlur={isSel ? 8 : 0}
              draggable
              {...((gridSnapping || resolutionSnapping)
                ? {
                    dragBoundFunc: (canvasPos: any) => snapCanvasPosToGrid(canvasPos),
                  }
                : {}
              )}
              onDragStart={(evt) => {
                if (isSel && selectedIds.length > 1) {
                  setMultiDragAnchor({
                    id: r.id,
                    anchor: { x: r.pos.x, y: r.pos.y },
                    initialPositions: Object.fromEntries(selectedIds.map((id: string) => {
                      const g = geometries.find((g: any) => g.id === id);
                      return g ? [id, { x: g.pos.x, y: g.pos.y }] : null;
                    }).filter(Boolean) as [string, { x: number; y: number }][]),
                  });
                }
              }}
              onDragMove={(evt) => {
                if (multiDragAnchor && isSel && selectedIds.length > 1 && multiDragAnchor.id === r.id) {
                  const newX = (evt.target.x() + (r.width * GRID_PX) / 2) / GRID_PX;
                  const newY = (evt.target.y() + (r.height * GRID_PX) / 2) / GRID_PX;
                  const dx = newX - multiDragAnchor.anchor.x;
                  const dy = newY - multiDragAnchor.anchor.y;
                  selectedIds.forEach((id: string) => {
                    if (id === r.id) return;
                    const g = geometries.find((g: any) => g.id === id);
                    if (g) {
                      const init = multiDragAnchor.initialPositions[id];
                      if (init) {
                        updateGeometry(id, { pos: { x: init.x + dx, y: init.y + dy } });
                      }
                    }
                  });
                }
              }}
              onDragEnd={(evt) => {
                if (multiDragAnchor && isSel && selectedIds.length > 1 && multiDragAnchor.id === r.id) {
                  const newX = (evt.target.x() + (r.width * GRID_PX) / 2) / GRID_PX;
                  const newY = (evt.target.y() + (r.height * GRID_PX) / 2) / GRID_PX;
                  const dx = newX - multiDragAnchor.anchor.x;
                  const dy = newY - multiDragAnchor.anchor.y;
                  selectedIds.forEach((id: string) => {
                    const g = geometries.find((g: any) => g.id === id);
                    if (g) {
                      const init = multiDragAnchor.initialPositions[id];
                      if (init) {
                        handleUpdateGeometry(id, { pos: { x: init.x + dx, y: init.y + dy } });
                      }
                    }
                  });
                  setMultiDragAnchor(null);
                } else {
                  const centerX = (evt.target.x() + (r.width * GRID_PX) / 2) / GRID_PX;
                  const centerY = (evt.target.y() + (r.height * GRID_PX) / 2) / GRID_PX;
                  handleUpdateGeometry(r.id, { pos: { x: centerX, y: centerY } });
                }
              }}
              onClick={(evt) => selectElement(r.id, { shift: evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey })}
            />
          );
        }
        return null;
      })}
      {triangles.map((el: any) => {
        const isSel = selectedIds.includes(el.id);
        if (el.kind === "triangle") {
          const t = el as Triangle;
          const anchorX = t.pos.x * GRID_PX;
          const anchorY = t.pos.y * GRID_PX;
          const relPoints = t.vertices.flatMap((v: any) => [v.x * GRID_PX, v.y * GRID_PX]);
          return (
            <Line
              key={t.id}
              x={anchorX}
              y={anchorY}
              points={relPoints}
              closed
              fill="rgba(236,72,153,0.25)"
              stroke="#ec4899"
              strokeWidth={1}
              shadowBlur={isSel ? 8 : 0}
              draggable
              {...((gridSnapping || resolutionSnapping)
                ? {
                    dragBoundFunc: (canvasPos: any) => snapCanvasPosToGrid(canvasPos),
                  }
                : {}
              )}
              onDragStart={(evt) => {
                if (isSel && selectedIds.length > 1) {
                  setMultiDragAnchor({
                    id: t.id,
                    anchor: { x: t.pos.x, y: t.pos.y },
                    initialPositions: Object.fromEntries(selectedIds.map((id: string) => {
                      const g = geometries.find((g: any) => g.id === id);
                      return g ? [id, { x: g.pos.x, y: g.pos.y }] : null;
                    }).filter(Boolean) as [string, { x: number; y: number }][]),
                  });
                }
              }}
              onDragMove={(evt) => {
                if (multiDragAnchor && isSel && selectedIds.length > 1 && multiDragAnchor.id === t.id) {
                  const newX = evt.target.x() / GRID_PX;
                  const newY = evt.target.y() / GRID_PX;
                  const dx = newX - multiDragAnchor.anchor.x;
                  const dy = newY - multiDragAnchor.anchor.y;
                  selectedIds.forEach((id: string) => {
                    if (id === t.id) return;
                    const g = geometries.find((g: any) => g.id === id);
                    if (g) {
                      const init = multiDragAnchor.initialPositions[id];
                      if (init) {
                        updateGeometry(id, { pos: { x: init.x + dx, y: init.y + dy } });
                      }
                    }
                  });
                }
              }}
              onDragEnd={(evt) => {
                if (multiDragAnchor && isSel && selectedIds.length > 1 && multiDragAnchor.id === t.id) {
                  const newX = evt.target.x() / GRID_PX;
                  const newY = evt.target.y() / GRID_PX;
                  const dx = newX - multiDragAnchor.anchor.x;
                  const dy = newY - multiDragAnchor.anchor.y;
                  selectedIds.forEach((id: string) => {
                    const g = geometries.find((g: any) => g.id === id);
                    if (g) {
                      const init = multiDragAnchor.initialPositions[id];
                      if (init) {
                        handleUpdateGeometry(id, { pos: { x: init.x + dx, y: init.y + dy } });
                      }
                    }
                  });
                  setMultiDragAnchor(null);
                } else {
                  const newX = evt.target.x() / GRID_PX;
                  const newY = evt.target.y() / GRID_PX;
                  handleUpdateGeometry(t.id, { pos: { x: newX, y: newY } });
                }
              }}
              onClick={(evt) => selectElement(t.id, { shift: evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey })}
            />
          );
        }
        return null;
      })}
    </>
  );
}
