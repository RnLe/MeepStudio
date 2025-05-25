"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { shallow } from "zustand/shallow";
import { useCanvasStore } from "../providers/CanvasStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { MeepProject } from "../types/meepProjectTypes";
import { Stage, Layer, Line, Rect } from "react-konva";
import { nanoid } from "nanoid";
import { GeometryLayer } from "./canvasGeometry";
import { GridOverlayLayer } from "./canvasGridOverlay";
import { SelectionBoxLayer } from "./selectionBoxLayer";

// --- Constants ---
const GRID_PX = 40; // Fixed size for each cell in px

// --- Types ---
interface Props {
  project: MeepProject;
  ghPages: boolean;
  minZoom: number;
  maxZoom: number;
  gridWidth: number;
  gridHeight: number;
}

const ProjectCanvas: React.FC<Props> = (props) => {
  // --- Props and Store Setup ---
  const { project: propProject, ghPages, maxZoom, gridWidth, gridHeight } = props;
  // Use zustand to get active projectId
  const activeProjectId = useCanvasStore((s) => s.activeProjectId);
  const { projects } = useMeepProjects({ ghPages });
  // Find the active project from the list, fallback to prop
  const project = React.useMemo(() => {
    if (!activeProjectId) return propProject;
    const found = projects.find((p) => p.documentId === activeProjectId);
    return found || propProject;
  }, [activeProjectId, projects, propProject]);
  if (!project) return null;
  const projectId = project.documentId;

  const { updateProject } = useMeepProjects({ ghPages });
  const {
    selectedId, selectedIds, selectElement, snapToGrid, geometries, setGeometries,
    addGeometry, updateGeometry, removeGeometry
  } = useCanvasStore(
    (s) => ({
      selectedId: s.selectedId,
      selectedIds: s.selectedIds,
      selectElement: s.selectElement,
      snapToGrid: s.gridSnapping,
      geometries: s.geometries,
      setGeometries: s.setGeometries,
      addGeometry: s.addGeometry,
      updateGeometry: s.updateGeometry,
      removeGeometry: s.removeGeometry,
    }),
    shallow
  );  // --- Geometry Migration Effect ---
  useEffect(() => {
    // Migrate triangles with absolute vertices to relative, and set pos
    const migratedGeoms = (project.scene?.geometries || []).map(g => {
      if (g.kind === "triangle") {
        const tri = g as any;
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
  }, [project.scene?.geometries, setGeometries]);

  // --- Geometry Selectors ---
  const cylinders = useMemo(() => geometries.filter(g => g.kind === "cylinder"), [geometries]);
  const rectangles = useMemo(() => geometries.filter(g => g.kind === "rectangle"), [geometries]);
  const triangles = useMemo(() => geometries.filter(g => g.kind === "triangle"), [geometries]);

  // --- Geometry Actions ---
  const handleAddGeometry = useCallback((geom: any) => {
    const newGeom = { ...geom, id: nanoid() };
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: { 
        scene: {
          ...project.scene,
          geometries: [...geometries, newGeom] 
        }
      },
    });
  }, [addGeometry, updateProject, projectId, geometries]);
  const handleUpdateGeometry = useCallback((id: string, partial: Partial<any>) => {
    updateGeometry(id, partial);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          geometries: geometries.map(g => g.id === id ? { ...g, ...partial } : g),
        }
      },
    });
  }, [updateGeometry, updateProject, projectId, geometries, project.scene]);
  const handleRemoveGeometry = useCallback((id: string) => {
    removeGeometry(id);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          geometries: geometries.filter(g => g.id !== id),
        }
      },
    });
    if (selectedId === id) selectElement(null);
  }, [removeGeometry, updateProject, projectId, geometries, selectedId, selectElement, project.scene]);

  // --- Container Size and Resize Handling ---
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

  // --- Logical and Canvas Size ---
  const LOGICAL_W = gridWidth * GRID_PX;
  const LOGICAL_H = gridHeight * GRID_PX;
  const CANVAS_W = containerSize.width;
  const CANVAS_H = containerSize.height;

  // --- Zoom and Pan Calculations ---
  const getMinZoomDynamic = useCallback(() => {
    if (LOGICAL_W === 0 || LOGICAL_H === 0) return 1;
    // Allow zooming out 5% beyond the fit
    return Math.min(
      CANVAS_W / LOGICAL_W,
      CANVAS_H / LOGICAL_H
    ) / 1.05;
  }, [CANVAS_W, CANVAS_H, LOGICAL_W, LOGICAL_H]);
  const minZoomDynamic = getMinZoomDynamic();
  const maxZoomDynamic = minZoomDynamic * 10;

  // Clamp pan so the rectangle is always visible and pannable
  const clampPan = useCallback((x: number, y: number, scale: number) => {
    const scaledW = LOGICAL_W * scale;
    const scaledH = LOGICAL_H * scale;
    let newX;
    if (scaledW < CANVAS_W) {
      newX = (CANVAS_W - scaledW) / 2;
    } else {
      const minX = CANVAS_W - scaledW / 2;
      const maxX = scaledW / 2;
      newX = Math.max(Math.min(x, maxX), minX - scaledW);
    }
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

  // --- Zoom & Pan State ---
  const stageRef = useRef<any>(null);
  const [scale, setScale] = useState(minZoomDynamic);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPointer, setLastPointer] = useState<{ x: number; y: number } | null>(null);

  // Center the rectangle on mount and when container or zoom changes
  useEffect(() => {
    setScale(minZoomDynamic);
    const scaledW = LOGICAL_W * minZoomDynamic;
    const scaledH = LOGICAL_H * minZoomDynamic;
    const x = scaledW < CANVAS_W ? (CANVAS_W - scaledW) / 2 : 0;
    const y = scaledH < CANVAS_H ? (CANVAS_H - scaledH) / 2 : 0;
    setPos({ x, y });
  }, [minZoomDynamic, LOGICAL_W, LOGICAL_H, CANVAS_W, CANVAS_H]);

  // --- Wheel Handler for Zooming ---
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

  // --- Overlay Toggles ---
  const showGrid = useCanvasStore((s) => s.showGrid);
  const showResolutionOverlay = useCanvasStore((s) => s.showResolutionOverlay);

  // --- Grid Lines (Main and Resolution) ---
  const gridLines = useMemo(() => {
    const gridColor = "#7e909c";
    const bothActive = showGrid && showResolutionOverlay;
    const onlyResolution = !showGrid && showResolutionOverlay;
    if (!showGrid) return null;
    const lines: React.ReactNode[] = [];
    const useSubgridStyle = onlyResolution;
    // --- Fix: dynamicThickness is fixed for res <= 16 ---
    let res = project.scene?.resolution && project.scene.resolution > 1 ? project.scene.resolution : undefined;
    let dynamicThickness: number | undefined = undefined;
    if (res) {
      if (res <= 16) {
        dynamicThickness = GRID_PX / 16 / 3;
      } else {
        dynamicThickness = GRID_PX / res / 3;
      }
    }
    let color = gridColor;
    let strokeWidth = useSubgridStyle
      ? (dynamicThickness ?? 0.5)
      : (dynamicThickness ?? (bothActive ? 0.7 : 0.5));
    if (bothActive) {
      color = "#284b63";
    } else if (!useSubgridStyle) {
      color = "#aaa";
    }
    const opacity = 1;
    // --- Fix: when onlyResolution, all grid lines use the same thickness as subgrid ---
    for (let i = 1; i < gridHeight; i++) {
      const y = i * GRID_PX;
      lines.push(
        <Line
          key={`h${i}`}
          points={[0, y, LOGICAL_W, y]}
          stroke={color}
          strokeWidth={onlyResolution ? (dynamicThickness ?? 0.5) : strokeWidth}
          opacity={opacity}
        />
      );
    }
    for (let j = 1; j < gridWidth; j++) {
      const x = j * GRID_PX;
      lines.push(
        <Line
          key={`v${j}`}
          points={[x, 0, x, LOGICAL_H]}
          stroke={color}
          strokeWidth={onlyResolution ? (dynamicThickness ?? 0.5) : strokeWidth}
          opacity={opacity}
        />
      );
    }
    return lines;
  }, [showGrid, showResolutionOverlay, gridWidth, gridHeight, LOGICAL_W, LOGICAL_H, project.scene?.resolution]);
  const resolutionLines = useMemo(() => {
    if (!showResolutionOverlay || !project.scene?.resolution || project.scene.resolution < 2) return null;
    const lines: React.ReactNode[] = [];
    const res = project.scene.resolution;
    const subgridColor = "#7e909c";
    const weightFactor = res > 16 ? 16 / res : 1;
    const baseStroke = 0.5;
    const weightedStroke = baseStroke * weightFactor;
    // if only resolution overlay (no coarse grid), draw all lines at resolution granularity
    if (!showGrid) {
      // draw horizontal resolution lines spanning full grid
      for (let i = 1; i < gridHeight * res; i++) {
        const y = (i / res) * GRID_PX;
        lines.push(
          <Line
            key={`resall-h-${i}`}
            points={[0, y, LOGICAL_W, y]}
            stroke={subgridColor}
            strokeWidth={weightedStroke}
            opacity={1}
          />
        );
      }
      // draw vertical resolution lines spanning full grid
      for (let j = 1; j < gridWidth * res; j++) {
        const x = (j / res) * GRID_PX;
        lines.push(
          <Line
            key={`resall-v-${j}`}
            points={[x, 0, x, LOGICAL_H]}
            stroke={subgridColor}
            strokeWidth={weightedStroke}
            opacity={1}
          />
        );
      }
      return lines;
    }
    // draw horizontal subgrid lines across full width
    for (let i = 0; i < gridHeight; i++) {
      for (let sub = 1; sub < res; sub++) {
        const y = (i + sub / res) * GRID_PX;
        lines.push(
          <Line
            key={`res-h-${i}-${sub}`}
            points={[0, y, LOGICAL_W, y]}
            stroke={subgridColor}
            strokeWidth={weightedStroke}
            opacity={1}
          />
        );
      }
    }
    // draw vertical subgrid lines across full height
    for (let j = 0; j < gridWidth; j++) {
      for (let sub = 1; sub < res; sub++) {
        const x = (j + sub / res) * GRID_PX;
        lines.push(
          <Line
            key={`res-v-${j}-${sub}`}
            points={[x, 0, x, LOGICAL_H]}
            stroke={subgridColor}
            strokeWidth={weightedStroke}
            opacity={1}
          />
        );
      }
    }
    return lines;
  }, [showResolutionOverlay, showGrid, project.scene?.resolution, gridWidth, gridHeight, LOGICAL_W, LOGICAL_H]);

  // --- Selection Box State ---
  const [selOrigin, setSelOrigin] = useState<{ x: number; y: number } | null>(null);
  const [selBox, setSelBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // --- Snapping Helpers ---
  const gridSnapping = useCanvasStore((s) => s.gridSnapping);
  const resolutionSnapping = useCanvasStore((s) => s.resolutionSnapping);
  const snapCanvasPosToGrid = useCallback((canvasPos: { x: number; y: number }) => {
    // Convert canvas (absolute) position to logical grid coordinates
    const logicalX = (canvasPos.x - pos.x) / scale;
    const logicalY = (canvasPos.y - pos.y) / scale;    if (resolutionSnapping && project.scene?.resolution && project.scene.resolution > 1) {
      const res = project.scene.resolution;
      const cellW = GRID_PX / res;
      const cellH = GRID_PX / res;
      const snappedLogicalX = Math.round(logicalX / cellW) * cellW;
      const snappedLogicalY = Math.round(logicalY / cellH) * cellH;
      return {
        x: snappedLogicalX * scale + pos.x,
        y: snappedLogicalY * scale + pos.y,
      };
    } else if (gridSnapping) {
      const snappedLogicalX = Math.round(logicalX / GRID_PX) * GRID_PX;
      const snappedLogicalY = Math.round(logicalY / GRID_PX) * GRID_PX;
      return {
        x: snappedLogicalX * scale + pos.x,
        y: snappedLogicalY * scale + pos.y,
      };
    } else {
      return canvasPos;
    }
  }, [pos, scale, resolutionSnapping, gridSnapping, project.scene?.resolution]);

  // --- Multi-Select Drag State ---
  const [multiDragAnchor, setMultiDragAnchor] = useState<{
    id: string;
    anchor: { x: number; y: number };
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        selectedIds.forEach(id => handleRemoveGeometry(id));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, handleRemoveGeometry]);

  // --- Dynamic Border Weight Calculation ---
  const borderWeight = useMemo(() => {
    // Consider the longest edge (max of width and height)
    const maxDimension = Math.max(gridWidth, gridHeight);
    
    // If dimension is 10 or higher, weight is 1
    if (maxDimension >= 10) return 1;
    
    // Linear scaling from 1/3 (at dimension 1) to 1 (at dimension 10)
    // weight = 1/3 + (2/3) * (dimension - 1) / 9
    const weight = 1/3 + (2/3) * (maxDimension - 1) / 9;
    return weight;
  }, [gridWidth, gridHeight]);

  // --- Render ---
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
            // Only run drag selection if box has area
            if (selBox.width > 0 && selBox.height > 0) {
              // Compute which elements intersect selBox and select them
              // selBox is in logical coordinates: { x, y, width, height }
              const box = {
                x: selBox.x,
                y: selBox.y,
                width: selBox.width,
                height: selBox.height,
              };
              // --- Geometry intersection helpers ---
              function rectsIntersect(a: {x:number,y:number,width:number,height:number}, b: {x:number,y:number,width:number,height:number}) {
                return (
                  a.x < b.x + b.width &&
                  a.x + a.width > b.x &&
                  a.y < b.y + b.height &&
                  a.y + a.height > b.y
                );
              }
              function circleRectIntersect(cx: number, cy: number, r: number, rect: {x:number,y:number,width:number,height:number}) {
                const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
                const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
                const dx = cx - closestX;
                const dy = cy - closestY;
                return (dx * dx + dy * dy) <= r * r;
              }
              function pointInRect(px: number, py: number, rect: {x:number,y:number,width:number,height:number}) {
                return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
              }
              function linesIntersect(a1: {x:number,y:number}, a2: {x:number,y:number}, b1: {x:number,y:number}, b2: {x:number,y:number}) {
                const det = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - a1.x);
                if (det === 0) return false;
                const lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det;
                const gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det;
                return (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1);
              }
              function pointInTriangle(p: {x:number,y:number}, a: {x:number,y:number}, b: {x:number,y:number}, c: {x:number,y:number}) {
                // Barycentric technique
                const area = 0.5 * (-b.y * c.x + a.y * (-b.x + c.x) + a.x * (b.y - c.y) + b.x * c.y);
                const s = 1 / (2 * area) * (a.y * c.x - a.x * c.y + (c.y - a.y) * p.x + (a.x - c.x) * p.y);
                const t = 1 / (2 * area) * (a.x * b.y - a.y * b.x + (a.y - b.y) * p.x + (b.x - a.x) * p.y);
                const u = 1 - s - t;
                return s >= 0 && t >= 0 && u >= 0;
              }
              function triangleRectPrecise(pos: {x:number,y:number}, verts: {x:number,y:number}[], rect: {x:number,y:number,width:number,height:number}) {
                // Normalize rectangle: ensure width/height positive, x/y is top-left
                const normRect = { ...rect };
                if (normRect.width < 0) {
                  normRect.x += normRect.width;
                  normRect.width = Math.abs(normRect.width);
                }
                if (normRect.height < 0) {
                  normRect.y += normRect.height;
                  normRect.height = Math.abs(normRect.height);
                }
                const absVerts = verts.map(v => ({ x: pos.x + v.x, y: pos.y + v.y }));
                // Degenerate rectangle (point selection)
                if (normRect.width === 0 && normRect.height === 0) {
                  // Only select if the point is inside the triangle
                  return pointInTriangle({ x: normRect.x, y: normRect.y }, absVerts[0], absVerts[1], absVerts[2]);
                }
                // 1. Any triangle vertex in rect?
                if (absVerts.some(v => pointInRect(v.x, v.y, normRect))) return true;
                // 2. Any rect vertex in triangle?
                const rectVerts = [
                  { x: normRect.x, y: normRect.y },
                  { x: normRect.x + normRect.width, y: normRect.y },
                  { x: normRect.x + normRect.width, y: normRect.y + normRect.height },
                  { x: normRect.x, y: normRect.y + normRect.height },
                ];
                if (rectVerts.some(v => pointInTriangle(v, absVerts[0], absVerts[1], absVerts[2]))) return true;
                // 3. Any edge intersection?
                const triEdges = [
                  [absVerts[0], absVerts[1]],
                  [absVerts[1], absVerts[2]],
                  [absVerts[2], absVerts[0]],
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
                return false;
              }
              // --- Convert selBox to lattice units ---
              const pxToLattice = (v: number) => v / GRID_PX;
              const latticeBox = {
                x: pxToLattice(box.x),
                y: pxToLattice(box.y),
                width: pxToLattice(box.width),
                height: pxToLattice(box.height),
              };
              // --- Find intersecting geometries ---
              const selected = geometries.filter(g => {
                if (g.kind === "rectangle") {
                  const rx = g.pos.x - g.width / 2;
                  const ry = g.pos.y - g.height / 2;
                  return rectsIntersect(
                    { x: rx, y: ry, width: g.width, height: g.height },
                    latticeBox
                  );
                } else if (g.kind === "cylinder") {
                  return circleRectIntersect(g.pos.x, g.pos.y, g.radius, latticeBox);
                } else if (g.kind === "triangle") {
                  // Use triangle bounding box intersection for selection
                  const absVerts = (g.vertices as { x: number; y: number }[]).map(v => ({ x: g.pos.x + v.x, y: g.pos.y + v.y }));
                  const xs = absVerts.map(pt => pt.x);
                  const ys = absVerts.map(pt => pt.y);
                  const minX = Math.min(...xs);
                  const maxX = Math.max(...xs);
                  const minY = Math.min(...ys);
                  const maxY = Math.max(...ys);
                  return rectsIntersect(
                    { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
                    latticeBox
                  );
                } else if (g.kind === "continuousSource" || g.kind === "gaussianSource") {
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
            }
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
            fill="#a3a3a3"
            listening={false}
          />
          {/* Draw the main rectangle area with lighter bg to "cut out" the grid area */}
          <Rect
            x={0}
            y={0}
            width={LOGICAL_W}
            height={LOGICAL_H}
            fill="#d4d4d4"
            listening={false}
          />
        </Layer>
        {/* --- Grid and border layer --- */}
        <Layer>
          {/* Draw subgrid (resolution) lines first, then main grid lines above */}
          <GridOverlayLayer
            resolutionLines={resolutionLines}
            gridLines={gridLines}
            LOGICAL_W={LOGICAL_W}
            LOGICAL_H={LOGICAL_H}
            borderWeight={borderWeight}
          />
        </Layer>
        {/* --- Geometry elements layer --- */}
        <Layer>
          <GeometryLayer
            cylinders={cylinders}
            rectangles={rectangles}
            triangles={triangles}
            selectedIds={selectedIds}
            gridSnapping={gridSnapping}
            resolutionSnapping={resolutionSnapping}
            snapCanvasPosToGrid={snapCanvasPosToGrid}
            multiDragAnchor={multiDragAnchor}
            setMultiDragAnchor={setMultiDragAnchor}
            geometries={geometries}
            updateGeometry={updateGeometry}
            handleUpdateGeometry={handleUpdateGeometry}
            selectElement={selectElement}
            GRID_PX={GRID_PX}
          />
        </Layer>

        {/* --- Selection rectangle overlay --- */}
        <SelectionBoxLayer selBox={selBox} />
      </Stage>
    </div>
  );
};

// --- Export ---
export default ProjectCanvas;
