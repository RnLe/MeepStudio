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

  // dynamic pixel dims
  const CANVAS_W = gridWidth * GRID_PX;
  const CANVAS_H = gridHeight * GRID_PX;

  // dynamic min‐zoom state
  const containerRef = useRef<HTMLDivElement>(null);
  const [minZoomDynamic, setMinZoomDynamic] = useState(1);
  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width, height } = entry.contentRect;
        const zoomW = (width / 2) / CANVAS_W;
        const zoomH = (height / 2) / CANVAS_H;
        setMinZoomDynamic(Math.min(zoomW, zoomH, 1));
      });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { if (containerRef.current) ro.unobserve(containerRef.current); };
  }, [CANVAS_W, CANVAS_H]);

  // zoom & pan state
  const stageRef = useRef<any>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPointer, setLastPointer] = useState<{ x: number; y: number } | null>(null);

  // selection‐box state
  const [selOrigin, setSelOrigin] = useState<{ x: number; y: number } | null>(null);
  const [selBox, setSelBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // wheel handler to zoom around pointer
  const handleWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition()!;
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 0.1;
      const newScale = Math.min(
        maxZoom,
        Math.max(minZoomDynamic, oldScale + direction * factor * oldScale)
      );
      setScale(newScale);
      setPos({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [maxZoom, minZoomDynamic]
  );

  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    // rows (horizontal)
    for (let i = 0; i <= gridHeight; i++) {
      const y = i * GRID_PX;
      lines.push(<Line key={`h${i}`} points={[0, y, CANVAS_W, y]} stroke="#bbb" strokeWidth={0.4} />);
    }
    // cols (vertical)
    for (let j = 0; j <= gridWidth; j++) {
      const x = j * GRID_PX;
      lines.push(<Line key={`v${j}`} points={[x, 0, x, CANVAS_H]} stroke="#bbb" strokeWidth={0.4} />);
    }
    return lines;
  }, [gridWidth, gridHeight]);

  const elements: (Cylinder | RectEl)[] = [
    ...cylinders,
    ...rectangles,
  ];

  return (
    // neutral grey outside
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center bg-neutral-300"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        width={CANVAS_W}
        height={CANVAS_H}
        // apply cursor when panning
        style={{ cursor: isPanning ? "move" : "default" }}
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
            setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
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
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        ref={stageRef}
      >
        <Layer>
          {gridLines}
          <Rect
            x={0}
            y={0}
            width={CANVAS_W}
            height={CANVAS_H}
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
