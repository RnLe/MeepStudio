import React from "react";
import { Cylinder, Rectangle as RectEl, Triangle } from "../types/canvasElementTypes";
import { Line, Circle, Rect } from "react-konva";
import { ResizeHandles } from "./resizeHandles";

/**
 * Geometry rendering components for ProjectCanvas.
 * Handles cylinders, rectangles, triangles, and their drag/select logic.
 * Expects all props and helpers to be passed in from the parent.
 */

export function GeometryLayer({
  cylinders,
  rectangles,
  triangles,
  selectedIds: selectedGeometryIds,
  gridSnapping,
  resolutionSnapping,
  snapCanvasPosToGrid,
  multiDragAnchor,
  setMultiDragAnchor,
  geometries,
  updateGeometry,
  handleUpdateGeometry,
  selectElement: selectGeometry,
  GRID_PX,
  project,
  scale,
  showGrid,
  showResolutionOverlay,
  toggleShowGrid,
  toggleShowResolutionOverlay
}: any) {
  // Helper function to snap values to grid
  const snapToGrid = React.useCallback((value: number, forceGrid?: boolean, forceResolution?: boolean) => {
    // If ctrl is pressed, force resolution snapping
    if (forceResolution && project?.scene?.resolution && project.scene.resolution > 1) {
      const res = project.scene.resolution;
      const cellSize = 1 / res;
      return Math.round(value / cellSize) * cellSize;
    }
    // If shift is pressed, force grid snapping
    else if (forceGrid) {
      return Math.round(value);
    }
    // Otherwise use current settings
    else if (resolutionSnapping && project?.scene?.resolution && project.scene.resolution > 1) {
      const res = project.scene.resolution;
      const cellSize = 1 / res;
      return Math.round(value / cellSize) * cellSize;
    } else if (gridSnapping) {
      return Math.round(value);
    }
    return value;
  }, [gridSnapping, resolutionSnapping, project?.scene?.resolution]);

  return (
    <>
      {cylinders.map((el: any) => {
        const isSel = selectedGeometryIds.includes(el.id);
        if (el.kind === "cylinder") {
          const c = el as Cylinder;
          return (
            <Circle
              key={c.id}
              x={c.pos.x * GRID_PX}
              y={c.pos.y * GRID_PX}
              radius={c.radius * GRID_PX}
              fill="rgba(59,130,246,0.25)"
              stroke={isSel ? "#3b82f6" : "transparent"}
              strokeWidth={isSel ? 1 / scale : 0}
              shadowBlur={isSel ? 8 : 0}
              draggable
              {...((gridSnapping || resolutionSnapping)
                ? {
                    dragBoundFunc: (canvasPos: any) => snapCanvasPosToGrid(canvasPos),
                  }
                : {}
              )}
              onDragStart={(evt) => {
                if (isSel && selectedGeometryIds.length > 1) {
                  setMultiDragAnchor({
                    id: c.id,
                    anchor: { x: c.pos.x, y: c.pos.y },
                    initialPositions: Object.fromEntries(selectedGeometryIds.map((id: string) => {
                      const g = geometries.find((g: any) => g.id === id);
                      return g ? [id, { x: g.pos.x, y: g.pos.y }] : null;
                    }).filter(Boolean) as [string, { x: number; y: number }][]),
                  });
                }
              }}
              onDragMove={(evt) => {
                if (multiDragAnchor && isSel && selectedGeometryIds.length > 1 && multiDragAnchor.id === c.id) {
                  const newX = evt.target.x() / GRID_PX;
                  const newY = evt.target.y() / GRID_PX;
                  const dx = newX - multiDragAnchor.anchor.x;
                  const dy = newY - multiDragAnchor.anchor.y;
                  
                  // Update all selected items including the anchor
                  selectedGeometryIds.forEach((id: string) => {
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
                if (multiDragAnchor && isSel && selectedGeometryIds.length > 1 && multiDragAnchor.id === c.id) {
                  const newX = evt.target.x() / GRID_PX;
                  const newY = evt.target.y() / GRID_PX;
                  const dx = newX - multiDragAnchor.anchor.x;
                  const dy = newY - multiDragAnchor.anchor.y;
                  
                  // Update all selected items with final positions
                  selectedGeometryIds.forEach((id: string) => {
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
                  // Single item drag
                  const x = evt.target.x() / GRID_PX;
                  const y = evt.target.y() / GRID_PX;
                  handleUpdateGeometry(c.id, { pos: { x, y } });
                }
              }}
              onClick={(evt) => selectGeometry(c.id, { shift: evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey })}
            />
          );
        }
        return null;
      })}
      {rectangles.map((el: any) => {
        const isSel = selectedGeometryIds.includes(el.id);
        if (el.kind === "rectangle") {
          const r = el as RectEl;
          // Track dragging state for this rectangle
          const [isDragging, setIsDragging] = React.useState(false);
          
          return (
            <React.Fragment key={r.id}>
              <Rect
                x={r.pos.x * GRID_PX}
                y={r.pos.y * GRID_PX}
                width={r.width * GRID_PX}
                height={r.height * GRID_PX}
                fill="rgba(16,185,129,0.25)"
                stroke={isSel ? "#10b981" : "transparent"}
                strokeWidth={isSel ? 1 / scale : 0}
                shadowBlur={isSel ? 8 : 0}
                draggable
                rotation={r.rotation ?? 0}
                offsetX={(r.width * GRID_PX) / 2}  // Set offset to center
                offsetY={(r.height * GRID_PX) / 2}
                {...((gridSnapping || resolutionSnapping)
                  ? {
                      dragBoundFunc: (canvasPos: any) => snapCanvasPosToGrid(canvasPos),
                    }
                  : {}
                )}
                onDragStart={(evt) => {
                  setIsDragging(true);
                  if (isSel && selectedGeometryIds.length > 1) {
                    setMultiDragAnchor({
                      id: r.id,
                      anchor: { x: r.pos.x, y: r.pos.y },
                      initialPositions: Object.fromEntries(selectedGeometryIds.map((id: string) => {
                        const g = geometries.find((g: any) => g.id === id);
                        return g ? [id, { x: g.pos.x, y: g.pos.y }] : null;
                      }).filter(Boolean) as [string, { x: number; y: number }][]),
                    });
                  }
                }}
                onDragMove={(evt) => {
                  if (multiDragAnchor && isSel && selectedGeometryIds.length > 1 && multiDragAnchor.id === r.id) {
                    const newX = evt.target.x() / GRID_PX;
                    const newY = evt.target.y() / GRID_PX;
                    const dx = newX - multiDragAnchor.anchor.x;
                    const dy = newY - multiDragAnchor.anchor.y;
                    
                    // Update all selected items including the anchor
                    selectedGeometryIds.forEach((id: string) => {
                      const g = geometries.find((g: any) => g.id === id);
                      if (g) {
                        const init = multiDragAnchor.initialPositions[id];
                        if (init) {
                          updateGeometry(id, { pos: { x: init.x + dx, y: init.y + dy } });
                        }
                      }
                    });
                  } else if (selectedGeometryIds.length === 1) {
                    // Single item drag - update position immediately
                    const centerX = evt.target.x() / GRID_PX;
                    const centerY = evt.target.y() / GRID_PX;
                    updateGeometry(r.id, { pos: { x: centerX, y: centerY } });
                  }
                }}
                onDragEnd={(evt) => {
                  setIsDragging(false);
                  if (multiDragAnchor && isSel && selectedGeometryIds.length > 1 && multiDragAnchor.id === r.id) {
                    const newX = evt.target.x() / GRID_PX;
                    const newY = evt.target.y() / GRID_PX;
                    const dx = newX - multiDragAnchor.anchor.x;
                    const dy = newY - multiDragAnchor.anchor.y;
                    
                    // Update all selected items with final positions
                    selectedGeometryIds.forEach((id: string) => {
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
                    // Single item drag
                    const centerX = evt.target.x() / GRID_PX;
                    const centerY = evt.target.y() / GRID_PX;
                    handleUpdateGeometry(r.id, { pos: { x: centerX, y: centerY } });
                  }
                }}
                onClick={(evt) => selectGeometry(r.id, { shift: evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey })}
              />
              {/* Show resize handles when selected and only this rectangle is selected */}
              {isSel && selectedGeometryIds.length === 1 && !isDragging && (
                <ResizeHandles
                  rectangle={r}
                  GRID_PX={GRID_PX}
                  onResize={(updates) => updateGeometry(r.id, updates)}
                  onResizeEnd={(updates) => handleUpdateGeometry(r.id, updates)}
                  snapToGrid={snapToGrid}
                  scale={scale}
                  gridSnapping={gridSnapping}
                  resolutionSnapping={resolutionSnapping}
                  showGrid={showGrid}
                  showResolutionOverlay={showResolutionOverlay}
                  toggleShowGrid={toggleShowGrid}
                  toggleShowResolutionOverlay={toggleShowResolutionOverlay}
                />
              )}
            </React.Fragment>
          );
        }
        return null;
      })}
      {triangles.map((el: any) => {
        const isSel = selectedGeometryIds.includes(el.id);
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
              stroke={isSel ? "#ec4899" : "transparent"}
              strokeWidth={isSel ? 1 / scale : 0}
              shadowBlur={isSel ? 8 : 0}
              draggable
              {...((gridSnapping || resolutionSnapping)
                ? {
                    dragBoundFunc: (canvasPos: any) => snapCanvasPosToGrid(canvasPos),
                  }
                : {}
              )}
              onDragStart={(evt) => {
                if (isSel && selectedGeometryIds.length > 1) {
                  setMultiDragAnchor({
                    id: t.id,
                    anchor: { x: t.pos.x, y: t.pos.y },
                    initialPositions: Object.fromEntries(selectedGeometryIds.map((id: string) => {
                      const g = geometries.find((g: any) => g.id === id);
                      return g ? [id, { x: g.pos.x, y: g.pos.y }] : null;
                    }).filter(Boolean) as [string, { x: number; y: number }][]),
                  });
                }
              }}
              onDragMove={(evt) => {
                if (multiDragAnchor && isSel && selectedGeometryIds.length > 1 && multiDragAnchor.id === t.id) {
                  const newX = evt.target.x() / GRID_PX;
                  const newY = evt.target.y() / GRID_PX;
                  const dx = newX - multiDragAnchor.anchor.x;
                  const dy = newY - multiDragAnchor.anchor.y;
                  
                  // Update all selected items including the anchor
                  selectedGeometryIds.forEach((id: string) => {
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
                if (multiDragAnchor && isSel && selectedGeometryIds.length > 1 && multiDragAnchor.id === t.id) {
                  const newX = evt.target.x() / GRID_PX;
                  const newY = evt.target.y() / GRID_PX;
                  const dx = newX - multiDragAnchor.anchor.x;
                  const dy = newY - multiDragAnchor.anchor.y;
                  
                  // Update all selected items with final positions
                  selectedGeometryIds.forEach((id: string) => {
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
                  // Single item drag
                  const newX = evt.target.x() / GRID_PX;
                  const newY = evt.target.y() / GRID_PX;
                  handleUpdateGeometry(t.id, { pos: { x: newX, y: newY } });
                }
              }}
              onClick={(evt) => selectGeometry(t.id, { shift: evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey })}
            />
          );
        }
        return null;
      })}
    </>
  );
}
