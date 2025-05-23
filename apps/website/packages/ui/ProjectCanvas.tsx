"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { shallow } from "zustand/shallow";
import { useCanvasStore } from "../providers/CanvasStore";
import { Cylinder, Rectangle as RectEl } from "../types/canvasElementTypes";
import { MeepProject } from "../types/meepProjectTypes";
import { Stage, Layer, Line, Circle, Rect } from "react-konva";

/* fixed size for each cell */
const GRID_PX = 40;
const snap = (v: number) => Math.round(v / GRID_PX) * GRID_PX;

interface Props {
  project: MeepProject;
  minZoom: number;
  maxZoom: number;
  gridWidth: number;
  gridHeight: number;
}

const ProjectCanvas: React.FC<Props> = (props) => {
  const { maxZoom, gridWidth, gridHeight } = props;
  const {
    cylinders,
    rectangles,
    selectedId,
    selectElement,
    updateCylinder,
    updateRectangle,
    snapToGrid,
  } = useCanvasStore(
    (s) => ({
      cylinders:      s.cylinders,
      rectangles:     s.rectangles,
      selectedId:     s.selectedId,
      selectElement:  s.selectElement,
      updateCylinder: s.updateCylinder,
      updateRectangle:s.updateRectangle,
      snapToGrid:     s.snapToGrid,
    }),
    shallow
  );

  // dynamic pixel dims (now based on container size)
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      setContainerSize({
        width: containerRef.current!.offsetWidth,
        height: containerRef.current!.offsetHeight,
      });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Logical grid size
  const LOGICAL_W = gridWidth * GRID_PX;
  const LOGICAL_H = gridHeight * GRID_PX;

  // Stage size is always container size
  const CANVAS_W = containerSize.width;
  const CANVAS_H = containerSize.height;

  // --- Dynamic min zoom: fit rectangle to container, based on limiting dimension ---
  const getMinZoomDynamic = useCallback(() => {
    if (LOGICAL_W === 0 || LOGICAL_H === 0) return 1;
    // Allow zooming out 5% beyond the fit
    return Math.min(
      CANVAS_W / LOGICAL_W,
      CANVAS_H / LOGICAL_H
    ) / 1.05;
  }, [CANVAS_W, CANVAS_H, LOGICAL_W, LOGICAL_H]);
  const minZoomDynamic = getMinZoomDynamic();

  // --- Dynamic max zoom: allow zooming in up to 10x the min zoom ---
  const maxZoomDynamic = minZoomDynamic * 10;

  // --- Clamp pan so the rectangle is always visible and pannable ---
  const clampPan = useCallback((x: number, y: number, scale: number) => {
    const scaledW = LOGICAL_W * scale;
    const scaledH = LOGICAL_H * scale;
    // X axis
    let newX;
    if (scaledW < CANVAS_W) {
      newX = (CANVAS_W - scaledW) / 2;
    } else {
      const minX = CANVAS_W - scaledW / 2;
      const maxX = scaledW / 2;
      newX = Math.max(Math.min(x, maxX), minX - scaledW);
    }
    // Y axis
    let newY;
    if (scaledH < CANVAS_H) {
      newY = (CANVAS_H - scaledH) / 2;
    } else {
      const minY = CANVAS_H - scaledH / 2;
      const maxY = scaledH / 2;
      newY = Math.max(Math.min(y, maxY), minY - scaledH);
    }
    return { x: newX, y: newY };
  }, [CANVAS_W, CANVAS_H, LOGICAL_W, LOGICAL_H]);

  // --- Zoom & pan state ---
  const stageRef = useRef<any>(null);
  const [scale, setScale] = useState(minZoomDynamic);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPointer, setLastPointer] = useState<{ x: number; y: number } | null>(null);

  // --- Center the rectangle on mount and when container or zoom changes ---
  useEffect(() => {
    setScale(minZoomDynamic);
    const scaledW = LOGICAL_W * minZoomDynamic;
    const scaledH = LOGICAL_H * minZoomDynamic;
    const x = scaledW < CANVAS_W ? (CANVAS_W - scaledW) / 2 : 0;
    const y = scaledH < CANVAS_H ? (CANVAS_H - scaledH) / 2 : 0;
    setPos({ x, y });
  }, [minZoomDynamic, LOGICAL_W, LOGICAL_H, CANVAS_W, CANVAS_H]);

  // --- Wheel handler to zoom around pointer ---
  const handleWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = scale;
      const pointer = stage.getPointerPosition()!;
      const mousePointTo = {
        x: (pointer.x - pos.x) / oldScale,
        y: (pointer.y - pos.y) / oldScale,
      };
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 0.1;
      let newScale = oldScale + direction * factor * oldScale;
      newScale = Math.max(minZoomDynamic, Math.min(maxZoomDynamic, newScale));
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      setScale(newScale);
      setPos(clampPan(newPos.x, newPos.y, newScale));
    },
    [minZoomDynamic, maxZoomDynamic, scale, pos, clampPan]
  );

  // --- Grid lines only inside the logical rectangle ---
  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    // rows (horizontal)
    for (let i = 0; i <= gridHeight; i++) {
      const y = i * GRID_PX;
      lines.push(
        <Line
          key={`h${i}`}
          points={[0, y, LOGICAL_W, y]}
          stroke="#bbb"
          strokeWidth={0.4}
        />
      );
    }
    // cols (vertical)
    for (let j = 0; j <= gridWidth; j++) {
      const x = j * GRID_PX;
      lines.push(
        <Line
          key={`v${j}`}
          points={[x, 0, x, LOGICAL_H]}
          stroke="#bbb"
          strokeWidth={0.4}
        />
      );
    }
    return lines;
  }, [gridWidth, gridHeight, LOGICAL_W, LOGICAL_H]);

  const elements: (Cylinder | RectEl)[] = [
    ...cylinders,
    ...rectangles,
  ];

  // Selection box state (restore)
  const [selOrigin, setSelOrigin] = useState<{ x: number; y: number } | null>(null);
  const [selBox, setSelBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center bg-neutral-300 w-full h-full overflow-hidden"
      style={{ width: "100%", height: "100%" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        key={containerSize.width + 'x' + containerSize.height}
        width={containerSize.width}
        height={containerSize.height}
        style={{ width: "100%", height: "100%", cursor: isPanning ? "move" : "default" }}
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        ref={stageRef}
        onMouseDown={(e) => {
          const evt = e.evt;
          const abs = stageRef.current!.getPointerPosition()!;

          if (evt.button === 2) {
            // begin pan
            evt.preventDefault();
            setLastPointer(abs);
            setIsPanning(true);

          } else if (evt.button === 0 && e.target === e.target.getStage()) {
            // begin selection in *local* coords
            const x = (abs.x - pos.x) / scale;
            const y = (abs.y - pos.y) / scale;
            setSelOrigin({ x, y });
            setSelBox({ x, y, width: 0, height: 0 });
            selectElement(null);
          }
        }}
        onMouseMove={(e) => {
          const evt = e.evt;
          const abs = stageRef.current!.getPointerPosition()!;

          if (isPanning && lastPointer) {
            const dx = abs.x - lastPointer.x;
            const dy = abs.y - lastPointer.y;
            const nextPos = { x: pos.x + dx, y: pos.y + dy };
            setPos(clampPan(nextPos.x, nextPos.y, scale));
            setLastPointer(abs);

          } else if (selOrigin) {
            // update selection box in *local* coords
            const lx = (abs.x - pos.x) / scale;
            const ly = (abs.y - pos.y) / scale;
            const x = Math.min(selOrigin.x, lx);
            const y = Math.min(selOrigin.y, ly);
            const width = Math.abs(lx - selOrigin.x);
            const height = Math.abs(ly - selOrigin.y);
            setSelBox({ x, y, width, height });
          }
        }}
        onMouseUp={(e) => {
          const evt = e.evt;
          if (isPanning && evt.button === 2) {
            setIsPanning(false);
            setLastPointer(null);
          }
          if (selBox && evt.button === 0) {
            // TODO: compute which elements intersect selBox and call selectElement(...)
            setSelOrigin(null);
            setSelBox(null);
          }
        }}
        onWheel={handleWheel}
      >
        {/* --- Darker background outside the rectangle --- */}
        <Layer>
          {/* Fill the whole canvas with a slightly darker neutral gray */}
          <Rect
            x={-pos.x / scale}
            y={-pos.y / scale}
            width={CANVAS_W / scale}
            height={CANVAS_H / scale}
            fill="#a3a3a3" // Tailwind neutral-400
            listening={false}
          />
          {/* Draw the main rectangle area with lighter bg to "cut out" the grid area */}
          <Rect
            x={0}
            y={0}
            width={LOGICAL_W}
            height={LOGICAL_H}
            fill="#d4d4d4" // Tailwind neutral-300
            listening={false}
          />
        </Layer>
        <Layer>
          {gridLines}
          {/* Rectangle border */}
          <Rect
            x={0}
            y={0}
            width={LOGICAL_W}
            height={LOGICAL_H}
            stroke="black"
            strokeWidth={2}
            listening={false}
          />
        </Layer>

        <Layer>
          {elements.map((el) => {
            const isSel = el.id === selectedId;

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
                  {...(snapToGrid
                    ? {
                        dragBoundFunc: (pos) => ({ x: snap(pos.x), y: snap(pos.y) }),
                      }
                    : {}
                  )}
                  onDragEnd={(evt) => {
                    const x = evt.target.x() / GRID_PX;
                    const y = evt.target.y() / GRID_PX;
                    updateCylinder(c.id, { pos: { x, y } });
                  }}
                  onClick={() => selectElement(c.id)}
                />
              );
            }

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
                  {...(snapToGrid
                    ? {
                        dragBoundFunc: (pos) => ({ x: snap(pos.x), y: snap(pos.y) }),
                      }
                    : {}
                  )}
                  onDragEnd={(evt) => {
                    const centerX = (evt.target.x() + (r.width * GRID_PX) / 2) / GRID_PX;
                    const centerY = (evt.target.y() + (r.height * GRID_PX) / 2) / GRID_PX;
                    updateRectangle(r.id, { pos: { x: centerX, y: centerY } });
                  }}
                  onClick={() => selectElement(r.id)}
                />
              );
            }

            return null;
          })}
        </Layer>

        {/* selection rectangle overlay */}
        {selBox && (
          <Layer>
            <Rect
              x={selBox.x}
              y={selBox.y}
              width={selBox.width}
              height={selBox.height}
              fill="rgba(0,123,255,0.2)"
              stroke="#007bff"
              dash={[4, 4]}
              listening={false}
            />
          </Layer>
        )}
      </Stage>
    </div>
  );
};

export default ProjectCanvas;
