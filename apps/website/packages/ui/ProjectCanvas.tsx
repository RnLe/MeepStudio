"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { shallow } from "zustand/shallow";
import { useCanvasStore } from "../providers/CanvasStore";
import { Cylinder, Rectangle as RectEl, Triangle } from "../types/canvasElementTypes";
import { Vector2d } from "konva/lib/types";
import { MeepProject } from "../types/meepProjectTypes";
import { Stage, Layer, Line, Circle, Rect, RegularPolygon } from "react-konva";
import { nanoid } from "nanoid";
import { useMeepProjects } from "../hooks/useMeepProjects";

/* fixed size for each cell */
const GRID_PX = 40;
const snap = (v: number) => Math.round(v / GRID_PX) * GRID_PX;

interface Props {
  project: MeepProject;
  ghPages: boolean;
  minZoom: number;
  maxZoom: number;
  gridWidth: number;
  gridHeight: number;
}

const ProjectCanvas: React.FC<Props> = (props) => {
  // --- Destructure props and setup stores ---
  const { project, ghPages, maxZoom, gridWidth, gridHeight } = props;
  const projectId = project.documentId;
  const { updateProject } = useMeepProjects({ ghPages });
  const { selectedId, selectedIds, selectElement, snapToGrid, geometries, setGeometries, addGeometry, updateGeometry, removeGeometry } = useCanvasStore(
    (s) => ({
      selectedId: s.selectedId,
      selectedIds: s.selectedIds,
      selectElement: s.selectElement,
      snapToGrid: s.snapToGrid,
      geometries: s.geometries,
      setGeometries: s.setGeometries,
      addGeometry: s.addGeometry,
      updateGeometry: s.updateGeometry,
      removeGeometry: s.removeGeometry,
    }),
    shallow
  );

  // --- Sync project.geometries to store on mount and when project changes ---
  useEffect(() => {
    // --- MIGRATION: convert triangles with absolute vertices to relative, and set pos ---
    const migratedGeoms = (project.geometries || []).map(g => {
      if (g.kind === "triangle") {
        const tri = g as any;
        // If no pos, or vertices are not relative to pos, migrate
        if (!tri.pos || (Array.isArray(tri.vertices) && tri.vertices.length === 3 && (
          typeof tri.pos.x !== "number" || typeof tri.pos.y !== "number" ||
          tri.vertices.some((v: any, i: number) => i === 0 ? (v.x !== 0 || v.y !== 0) : false)
        ))) {
          // Assume vertices are absolute
          const absVerts = tri.vertices;
          const anchor = absVerts[0];
          const relVerts = absVerts.map((v: any) => ({ x: v.x - anchor.x, y: v.y - anchor.y }));
          return { ...tri, pos: anchor, vertices: relVerts };
        }
      }
      return g;
    });
    setGeometries(migratedGeoms);
  }, [project.geometries, setGeometries]);

  // --- Geometry helpers (filter by kind) ---
  const cylinders = useMemo(() => geometries.filter(g => g.kind === "cylinder"), [geometries]);
  const rectangles = useMemo(() => geometries.filter(g => g.kind === "rectangle"), [geometries]);
  const triangles = useMemo(() => geometries.filter(g => g.kind === "triangle"), [geometries]);

  // --- Geometry actions (add, update, remove) ---
  const handleAddGeometry = useCallback((geom: any) => {
    const newGeom = { ...geom, id: nanoid() };
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: { geometries: [...geometries, newGeom] },
    });
  }, [addGeometry, updateProject, projectId, geometries]);

  const handleUpdateGeometry = useCallback((id: string, partial: Partial<any>) => {
    updateGeometry(id, partial);
    updateProject({
      documentId: projectId,
      project: {
        geometries: geometries.map(g => g.id === id ? { ...g, ...partial } : g),
      },
    });
  }, [updateGeometry, updateProject, projectId, geometries]);

  const handleRemoveGeometry = useCallback((id: string) => {
    removeGeometry(id);
    updateProject({
      documentId: projectId,
      project: {
        geometries: geometries.filter(g => g.id !== id),
      },
    });
    if (selectedId === id) selectElement(null);
  }, [removeGeometry, updateProject, projectId, geometries, selectedId, selectElement]);

  // --- Container size and resize observer ---
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

  // --- Logical grid and canvas size ---
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

  // --- Overlay toggles ---
  const showGrid = useCanvasStore((s) => s.showGrid);
  const showResolutionOverlay = useCanvasStore((s) => s.showResolutionOverlay);

  // --- Grid lines only inside the logical rectangle ---
  const gridLines = useMemo(() => {
    // Thicker/darker grid if both overlays are on
    const bothActive = showGrid && showResolutionOverlay;
    const onlyResolution = !showGrid && showResolutionOverlay;
    if (!showGrid && !onlyResolution) return null;
    const lines: React.ReactNode[] = [];
    // rows (horizontal)
    for (let i = 0; i <= gridHeight; i++) {
      const y = i * GRID_PX;
      lines.push(
        <Line
          key={`h${i}`}
          points={[0, y, LOGICAL_W, y]}
          stroke={bothActive ? "#284b63" : onlyResolution ? "#284b63" : "#aaa"}
          strokeWidth={bothActive ? 1.1 : onlyResolution ? 0.5 : 0.5}
          opacity={bothActive ? 0.5 : onlyResolution ? 0.32 : 1}
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
          stroke={bothActive ? "#284b63" : onlyResolution ? "#284b63" : "#aaa"}
          strokeWidth={bothActive ? 1.1 : onlyResolution ? 0.5 : 0.5}
          opacity={bothActive ? 0.5 : onlyResolution ? 0.32 : 1}
        />
      );
    }
    return lines;
  }, [showGrid, showResolutionOverlay, gridWidth, gridHeight, LOGICAL_W, LOGICAL_H]);

  // --- Resolution overlay grid ---
  const resolutionLines = useMemo(() => {
    if (!showResolutionOverlay || !project.resolution || project.resolution < 2) return null;
    const lines: React.ReactNode[] = [];
    const res = project.resolution;
    // If normal grid is off, draw all lines (including main grid lines) in blue
    const drawAll = !showGrid;
    // Draw subgrid for each cell
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        for (let sub = 1; sub < res; sub++) {
          // Horizontal sublines
          const y = (i + sub / res) * GRID_PX;
          lines.push(
            <Line
              key={`res-h-${i}-${j}-${sub}`}
              points={[j * GRID_PX, y, (j + 1) * GRID_PX, y]}
              stroke="#284b63"
              strokeWidth={0.5}
              opacity={0.32}
            />
          );
          // Vertical sublines
          const x = (j + sub / res) * GRID_PX;
          lines.push(
            <Line
              key={`res-v-${i}-${j}-${sub}`}
              points={[x, i * GRID_PX, x, (i + 1) * GRID_PX]}
              stroke="#284b63"
              strokeWidth={0.5}
              opacity={0.32}
            />
          );
        }
      }
    }
    // Draw the last main lines if normal grid is off
    if (drawAll) {
      const y = gridHeight * GRID_PX;
      lines.push(
        <Line
          key={`res-h-main-last`}
          points={[0, y, LOGICAL_W, y]}
          stroke="#284b63"
          strokeWidth={0.7}
          opacity={0.32}
        />
      );
      const x = gridWidth * GRID_PX;
      lines.push(
        <Line
          key={`res-v-main-last`}
          points={[x, 0, x, LOGICAL_H]}
          stroke="#284b63"
          strokeWidth={0.7}
          opacity={0.32}
        />
      );
    }
    return lines;
  }, [showResolutionOverlay, showGrid, project.resolution, gridWidth, gridHeight, LOGICAL_W, LOGICAL_H]);

  // --- Selection box state ---
  const [selOrigin, setSelOrigin] = useState<{ x: number; y: number } | null>(null);
  const [selBox, setSelBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // --- Helper: snap a canvas position to the grid, accounting for scale and pan ---
  const snapToResolutionGrid = useCanvasStore((s) => s.snapToResolutionGrid);
  // --- Helper: snap a canvas position to the grid, accounting for scale and pan ---
  const snapCanvasPosToGrid = useCallback((canvasPos: { x: number; y: number }) => {
    // Convert canvas (absolute) position to logical grid coordinates
    const logicalX = (canvasPos.x - pos.x) / scale;
    const logicalY = (canvasPos.y - pos.y) / scale;
    if (snapToResolutionGrid && project.resolution && project.resolution > 1) {
      // Snap to resolution subgrid
      const res = project.resolution;
      const cellW = GRID_PX / res;
      const cellH = GRID_PX / res;
      // Snap logical coordinates to resolution subgrid
      const snappedLogicalX = Math.round(logicalX / cellW) * cellW;
      const snappedLogicalY = Math.round(logicalY / cellH) * cellH;
      // Convert back to canvas coordinates
      return {
        x: snappedLogicalX * scale + pos.x,
        y: snappedLogicalY * scale + pos.y,
      };
    } else {
      // Snap to normal grid
      const snappedLogicalX = Math.round(logicalX / GRID_PX) * GRID_PX;
      const snappedLogicalY = Math.round(logicalY / GRID_PX) * GRID_PX;
      // Convert back to canvas coordinates
      return {
        x: snappedLogicalX * scale + pos.x,
        y: snappedLogicalY * scale + pos.y,
      };
    }
  }, [pos, scale, snapToResolutionGrid, project.resolution]);

  // --- Multi-select drag state ---
  const [multiDragAnchor, setMultiDragAnchor] = useState<{ id: string; anchor: { x: number; y: number }; initialPositions: Record<string, { x: number; y: number }> } | null>(null);

  // --- Keyboard handler for Delete key ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        selectedIds.forEach(id => handleRemoveGeometry(id));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, handleRemoveGeometry]);

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
        // --- Mouse handlers for pan and selection ---
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
            // Compute which elements intersect selBox and select them
            // selBox is in logical coordinates: { x, y, width, height }
            const box = {
              x: selBox.x,
              y: selBox.y,
              width: selBox.width,
              height: selBox.height,
            };
            // Helper: rectangle intersection
            function rectsIntersect(a: {x:number,y:number,width:number,height:number}, b: {x:number,y:number,width:number,height:number}) {
              return (
                a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.y + a.height > b.y
              );
            }
            // Helper: circle-rectangle intersection
            function circleRectIntersect(cx: number, cy: number, r: number, rect: {x:number,y:number,width:number,height:number}) {
              // Find closest point to circle center within the rectangle
              const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
              const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
              // Distance from circle center to closest point
              const dx = cx - closestX;
              const dy = cy - closestY;
              return (dx * dx + dy * dy) <= r * r;
            }
            // Helper: point in rectangle
            function pointInRect(px: number, py: number, rect: {x:number,y:number,width:number,height:number}) {
              return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
            }
            // Helper: line segment intersection
            function linesIntersect(a1: {x:number,y:number}, a2: {x:number,y:number}, b1: {x:number,y:number}, b2: {x:number,y:number}) {
              // Returns true if line segments (a1,a2) and (b1,b2) intersect
              const det = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - a1.x);
              if (det === 0) return false; // parallel
              const lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det;
              const gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det;
              return (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1);
            }
            // Helper: triangle-rectangle intersection (precise)
            function triangleRectPrecise(pos: {x:number,y:number}, verts: {x:number,y:number}[], rect: {x:number,y:number,width:number,height:number}) {
              // Absolute triangle vertices
              const absVerts = verts.map(v => ({ x: pos.x + v.x, y: pos.y + v.y }));
              // 1. Any vertex in rect?
              if (absVerts.some(v => pointInRect(v.x, v.y, rect))) return true;
              // 2. Any triangle edge cross any rect edge?
              const triEdges = [
                [absVerts[0], absVerts[1]],
                [absVerts[1], absVerts[2]],
                [absVerts[2], absVerts[0]],
              ];
              const rectVerts = [
                { x: rect.x, y: rect.y },
                { x: rect.x + rect.width, y: rect.y },
                { x: rect.x + rect.width, y: rect.y + rect.height },
                { x: rect.x, y: rect.y + rect.height },
              ];
              const rectEdges = [
                [rectVerts[0], rectVerts[1]],
                [rectVerts[1], rectVerts[2]],
                [rectVerts[2], rectVerts[3]],
                [rectVerts[3], rectVerts[0]],
              ];
              for (const [a1, a2] of triEdges) {
                for (const [b1, b2] of rectEdges) {
                  if (linesIntersect(a1, a2, b1, b2)) return true;
                }
              }
              // 3. (Optional) Rectangle fully inside triangle (rare, omitted for now)
              return false;
            }
            // --- FIX: selBox is in logical units, but geometries are in lattice units, so convert box to lattice units ---
            // Each lattice unit = 1, but selBox is in px, so convert to lattice units
            const pxToLattice = (v: number) => v / GRID_PX;
            const latticeBox = {
              x: pxToLattice(box.x),
              y: pxToLattice(box.y),
              width: pxToLattice(box.width),
              height: pxToLattice(box.height),
            };
            // Find intersecting geometries
            const selected = geometries.filter(g => {
              if (g.kind === "rectangle") {
                // Rectangle: center pos, width/height (in lattice units)
                const rx = g.pos.x - g.width / 2;
                const ry = g.pos.y - g.height / 2;
                return rectsIntersect(
                  { x: rx, y: ry, width: g.width, height: g.height },
                  latticeBox
                );
              } else if (g.kind === "cylinder") {
                // Cylinder: center pos, radius (in lattice units)
                return circleRectIntersect(g.pos.x, g.pos.y, g.radius, latticeBox);
              } else if (g.kind === "triangle") {
                // Triangle: pos, vertices (relative, in lattice units)
                return triangleRectPrecise(g.pos, g.vertices, latticeBox);
              } else if (g.kind === "continuousSource" || g.kind === "gaussianSource") {
                // Treat as point (in lattice units)
                return (
                  g.pos.x >= latticeBox.x &&
                  g.pos.x <= latticeBox.x + latticeBox.width &&
                  g.pos.y >= latticeBox.y &&
                  g.pos.y <= latticeBox.y + latticeBox.height
                );
              } else if (g.kind === "pmlBoundary") {
                // Assume has pos, thickness, treat as rectangle (in lattice units)
                const rx = g.pos.x - (g.thickness || 0) / 2;
                const ry = g.pos.y - (g.thickness || 0) / 2;
                return rectsIntersect(
                  { x: rx, y: ry, width: g.thickness || 1, height: g.thickness || 1 },
                  latticeBox
                );
              }
              return false;
            }).map(g => g.id);
            useCanvasStore.getState().setSelectedIds(selected);
            setSelOrigin(null);
            setSelBox(null);
          }
        }}
        onWheel={handleWheel}
      >
        {/* --- Background layers --- */}
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
        {/* --- Grid and border layer --- */}
        <Layer>
          {gridLines}
          {resolutionLines}
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

        {/* --- Geometry elements layer --- */}
        <Layer>
          {cylinders.map((el) => {
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
                  {...(snapToGrid
                    ? {
                        dragBoundFunc: (canvasPos) => snapCanvasPosToGrid(canvasPos),
                      }
                    : {}
                  )}
                  onDragStart={(evt) => {
                    if (isSel && selectedIds.length > 1) {
                      // Record anchor and all initial positions
                      setMultiDragAnchor({
                        id: c.id,
                        anchor: { x: c.pos.x, y: c.pos.y },
                        initialPositions: Object.fromEntries(selectedIds.map(id => {
                          const g = geometries.find(g => g.id === id);
                          return g ? [id, { x: g.pos.x, y: g.pos.y }] : null;
                        }).filter(Boolean) as [string, { x: number; y: number }][]),
                      });
                    }
                  }}
                  onDragMove={(evt) => {
                    if (multiDragAnchor && isSel && selectedIds.length > 1 && multiDragAnchor.id === c.id) {
                      // Calculate delta in logical units
                      const newX = evt.target.x() / GRID_PX;
                      const newY = evt.target.y() / GRID_PX;
                      const dx = newX - multiDragAnchor.anchor.x;
                      const dy = newY - multiDragAnchor.anchor.y;
                      // Update all selected geometries visually
                      selectedIds.forEach(id => {
                        if (id === c.id) return; // skip self, already being dragged
                        const g = geometries.find(g => g.id === id);
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
                      // Finalize all selected geometries' positions
                      const newX = evt.target.x() / GRID_PX;
                      const newY = evt.target.y() / GRID_PX;
                      const dx = newX - multiDragAnchor.anchor.x;
                      const dy = newY - multiDragAnchor.anchor.y;
                      selectedIds.forEach(id => {
                        const g = geometries.find(g => g.id === id);
                        if (g) {
                          const init = multiDragAnchor.initialPositions[id];
                          if (init) {
                            handleUpdateGeometry(id, { pos: { x: init.x + dx, y: init.y + dy } });
                          }
                        }
                      });
                      setMultiDragAnchor(null);
                    } else {
                      // --- Update geometry position in logical grid units ---
                      const x = (evt.target.x()) / GRID_PX;
                      const y = (evt.target.y()) / GRID_PX;
                      handleUpdateGeometry(c.id, { pos: { x, y } });
                    }
                  }}
                  onClick={(evt) => selectElement(c.id, { shift: evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey })}
                />
              );
            }
            return null;
          })}
          {rectangles.map((el) => {
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
                  {...(snapToGrid
                    ? {
                        dragBoundFunc: (canvasPos) => snapCanvasPosToGrid(canvasPos),
                      }
                    : {}
                  )}
                  onDragStart={(evt) => {
                    if (isSel && selectedIds.length > 1) {
                      setMultiDragAnchor({
                        id: r.id,
                        anchor: { x: r.pos.x, y: r.pos.y },
                        initialPositions: Object.fromEntries(selectedIds.map(id => {
                          const g = geometries.find(g => g.id === id);
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
                      selectedIds.forEach(id => {
                        if (id === r.id) return;
                        const g = geometries.find(g => g.id === id);
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
                      selectedIds.forEach(id => {
                        const g = geometries.find(g => g.id === id);
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
          {triangles.map((el) => {
            const isSel = selectedIds.includes(el.id);

            if (el.kind === "triangle") {
              const t = el as Triangle;
              // Use t.pos as anchor, vertices are relative to pos
              const anchorX = t.pos.x * GRID_PX;
              const anchorY = t.pos.y * GRID_PX;
              // Points relative to anchor
              const relPoints = t.vertices.flatMap(v => [
                v.x * GRID_PX,
                v.y * GRID_PX
              ]);
              return (
                <Line
                  key={t.id}
                  x={anchorX}
                  y={anchorY}
                  points={relPoints}
                  closed
                  fill="rgba(236,72,153,0.25)" // Tailwind pink-500
                  stroke="#ec4899"
                  strokeWidth={1}
                  shadowBlur={isSel ? 8 : 0}
                  draggable
                  {...(snapToGrid
                    ? {
                        dragBoundFunc: (canvasPos) => snapCanvasPosToGrid(canvasPos),
                      }
                    : {}
                  )}
                  onDragStart={(evt) => {
                    if (isSel && selectedIds.length > 1) {
                      setMultiDragAnchor({
                        id: t.id,
                        anchor: { x: t.pos.x, y: t.pos.y },
                        initialPositions: Object.fromEntries(selectedIds.map(id => {
                          const g = geometries.find(g => g.id === id);
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
                      selectedIds.forEach(id => {
                        if (id === t.id) return;
                        const g = geometries.find(g => g.id === id);
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
                      selectedIds.forEach(id => {
                        const g = geometries.find(g => g.id === id);
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
        </Layer>

        {/* --- Selection rectangle overlay --- */}
        {selBox && (
          <Layer>
            <Rect
              x={selBox.x}
              y={selBox.y}
              width={selBox.width}
              height={selBox.height}
              fill="rgba(0,123,255,0.2)"
              // stroke="#007bff" // removed border
              listening={false}
            />
          </Layer>
        )}
      </Stage>
    </div>
  );
};

// --- Export ---
export default ProjectCanvas;
