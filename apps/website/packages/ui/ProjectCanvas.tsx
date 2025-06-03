"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { shallow } from "zustand/shallow";
import { useCanvasStore } from "../providers/CanvasStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { MeepProject } from "../types/meepProjectTypes";
import { Stage, Layer, Line, Rect } from "react-konva";
import { nanoid } from "nanoid";
import { GridOverlayRenderer } from "../canvas/renderers/GridOverlayRenderer";
import { SelectionBoxLayer } from "./selectionBoxLayer";
import { useMaterialColorStore } from "../providers/MaterialColorStore";
import { MaterialCatalog } from "packages/constants/meepMaterialPresets";
import { ElementLayer } from "../canvas/layers/ElementLayer";

// --- Constants ---
const GRID_PX = 40; // Fixed size for each cell in px

// --- Instruction Sets for Canvas Info ---
const INSTRUCTION_SETS = {
  default: [
    "Right Click + Drag: Pan",
    "Left Click + Drag: Select"
  ],
  rotating: [
    "Shift + Drag: Snap to 5°",
    "Ctrl + Drag: Snap to 1°"
  ],
  resizing: [
    "Shift + Drag: Snap to grid",
    "Ctrl + Drag: Snap to resolution"
  ],
  dragging: [
    "Shift + Drag: Snap to grid",
    "Ctrl + Drag: Snap to resolution"
  ]
} as const;

type InstructionSetKey = keyof typeof INSTRUCTION_SETS;

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
  
  // Simply keep the prop as the project
  const project = propProject;
  if (!project) return null;
  const projectId = project.documentId;

  const { updateProject } = useMeepProjects({ ghPages });
  const {
    selectedGeometryId,
    selectedGeometryIds,
    selectGeometry,
    setSelectedGeometryIds,
    gridSnapping,
    geometries,
    setGeometries,
    addGeometry,
    updateGeometry,
    removeGeometry,
    removeGeometries,
    sources,
    setSources,
    addSource,
    updateSource,
    removeSource,
    removeSources,
    boundaries,
    setBoundaries,
    addBoundary,
    updateBoundary,
    removeBoundary,
    removeBoundaries,
    lattices,
    setLattices,
    addLattice,
    updateLattice,
    removeLattice,
    removeLattices,
    getAllElements,
    sceneMaterial,
    setSceneMaterial,
    setCanvasSize,
  } = useCanvasStore(
    (s) => ({
      selectedGeometryId: s.selectedGeometryId,
      selectedGeometryIds: s.selectedGeometryIds,
      selectGeometry: s.selectGeometry,
      setSelectedGeometryIds: s.setSelectedGeometryIds,
      gridSnapping: s.gridSnapping,
      geometries: s.geometries,
      setGeometries: s.setGeometries,
      addGeometry: s.addGeometry,
      updateGeometry: s.updateGeometry,
      removeGeometry: s.removeGeometry,
      removeGeometries: s.removeGeometries,
      sources: s.sources,
      setSources: s.setSources,
      addSource: s.addSource,
      updateSource: s.updateSource,
      removeSource: s.removeSource,
      removeSources: s.removeSources,
      boundaries: s.boundaries,
      setBoundaries: s.setBoundaries,
      addBoundary: s.addBoundary,
      updateBoundary: s.updateBoundary,
      removeBoundary: s.removeBoundary,
      removeBoundaries: s.removeBoundaries,
      lattices: s.lattices,
      setLattices: s.setLattices,
      addLattice: s.addLattice,
      updateLattice: s.updateLattice,
      removeLattice: s.removeLattice,
      removeLattices: s.removeLattices,
      getAllElements: s.getAllElements,
      sceneMaterial: s.sceneMaterial,
      setSceneMaterial: s.setSceneMaterial,
      setCanvasSize: s.setCanvasSize,
    }),
    shallow
  );  // --- Geometry Migration Effect ---
  useEffect(() => {
    // Migrate triangles with absolute vertices to relative, and set pos
    const migratedGeoms = (project.scene?.geometries || []).map(g => {
      // Ensure all geometries have orientation (default to 0)
      if (g.orientation === undefined) {
        g = { ...g, orientation: 0 };
      }
      
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
    
    // Load sources
    setSources(project.scene?.sources || []);
    setBoundaries(project.scene?.boundaries || []);
    setLattices(project.scene?.lattices || []);
    setSceneMaterial(project.scene?.material || "Air");
  }, [project.scene?.geometries, project.scene?.sources, project.scene?.boundaries, project.scene?.lattices, project.scene?.material, setGeometries, setSources, setBoundaries, setLattices, setSceneMaterial]);

  // --- Geometry Selectors ---
  const cylinders = useMemo(() => geometries.filter(g => g.kind === "cylinder"), [geometries]);
  const rectangles = useMemo(() => geometries.filter(g => g.kind === "rectangle"), [geometries]);
  const triangles = useMemo(() => geometries.filter(g => g.kind === "triangle"), [geometries]);

  // --- helper that always commits the *current* store state ---
  const commitScene = useCallback(() => {
    const { geometries: gs, sources: ss, boundaries: bs, lattices: ls } = useCanvasStore.getState();
    updateProject({
      documentId: projectId,
      project: { scene: { ...project.scene, geometries: gs, sources: ss, boundaries: bs, lattices: ls } }
    });
  }, [updateProject, projectId, project.scene]);

  // --- Geometry Actions ---
  const handleAddGeometry = useCallback((geom: any) => {
    const newGeom = { ...geom, id: nanoid(), orientation: geom.orientation || 0 };
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
    updateGeometry(id, partial);          // update store only
    commitScene();                        // commit both arrays
  }, [updateGeometry, commitScene]);
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
    if (selectedGeometryId === id) selectGeometry(null);
  }, [removeGeometry, updateProject, projectId, geometries, selectedGeometryId, selectGeometry, project.scene]);

  // Batch delete handler for multiple geometries
  const handleBatchRemoveGeometries = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    
    // Create a new geometries array without the deleted items
    const remainingGeometries = geometries.filter(g => !ids.includes(g.id));
    
    // Update the project with the new geometries array
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          geometries: remainingGeometries,
        }
      },
    });
    
    // Update the store in one operation
    removeGeometries(ids);
  }, [removeGeometries, updateProject, projectId, geometries, project.scene]);

  // --- Source Actions ---
  const handleAddSource = useCallback((source: any) => {
    const newSource = { ...source, id: nanoid(), orientation: source.orientation || 0 };
    addSource(newSource);
    updateProject({
      documentId: projectId,
      project: { 
        scene: {
          ...project.scene,
          sources: [...(project.scene.sources || []), newSource] 
        }
      },
    });
  }, [addSource, updateProject, projectId, project.scene]);

  const handleUpdateSource = useCallback((id: string, partial: Partial<any>) => {
    updateSource(id, partial);            // update store only
    commitScene();                        // commit both arrays
  }, [updateSource, commitScene]);
  
  // Make handleUpdateSource available globally for multi-drag
  React.useEffect(() => {
    (window as any).__handleUpdateSource = handleUpdateSource;
    return () => {
      delete (window as any).__handleUpdateSource;
    };
  }, [handleUpdateSource]);

  const handleRemoveSource = useCallback((id: string) => {
    removeSource(id);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          sources: sources.filter(s => s.id !== id),
        }
      },
    });
    if (selectedGeometryId === id) selectGeometry(null);
  }, [removeSource, updateProject, projectId, sources, selectedGeometryId, selectGeometry, project.scene]);

  // --- Boundary Actions
  const handleUpdateBoundary = useCallback((id: string, partial: Partial<any>) => {
    updateBoundary(id, partial);
    commitScene();
  }, [updateBoundary, commitScene]);

  const handleRemoveBoundary = useCallback((id: string) => {
    removeBoundary(id);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          boundaries: boundaries.filter(b => b.id !== id),
        }
      },
    });
    if (selectedGeometryId === id) selectGeometry(null);
  }, [removeBoundary, updateProject, projectId, boundaries, selectedGeometryId, selectGeometry, project.scene]);

  // --- Lattice Actions ---
  const handleUpdateLattice = useCallback((id: string, partial: Partial<any>) => {
    updateLattice(id, partial);
    commitScene();
  }, [updateLattice, commitScene]);

  const handleRemoveLattice = useCallback((id: string) => {
    removeLattice(id);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          lattices: lattices.filter(l => l.id !== id),
        }
      },
    });
    if (selectedGeometryId === id) selectGeometry(null);
  }, [removeLattice, updateProject, projectId, lattices, selectedGeometryId, selectGeometry, project.scene]);

  // Make handleUpdateLattice available globally for multi-drag
  React.useEffect(() => {
    (window as any).__handleUpdateLattice = handleUpdateLattice;
    return () => {
      delete (window as any).__handleUpdateLattice;
    };
  }, [handleUpdateLattice]);

  // Update batch remove to handle lattices
  const handleBatchRemoveElements = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    
    const geomIds = ids.filter(id => geometries.some(g => g.id === id));
    const sourceIds = ids.filter(id => sources.some(s => s.id === id));
    const boundaryIds = ids.filter(id => boundaries.some(b => b.id === id));
    const latticeIds = ids.filter(id => lattices.some(l => l.id === id));
    
    const remainingGeometries = geometries.filter(g => !geomIds.includes(g.id));
    const remainingSources = sources.filter(s => !sourceIds.includes(s.id));
    const remainingBoundaries = boundaries.filter(b => !boundaryIds.includes(b.id));
    const remainingLattices = lattices.filter(l => !latticeIds.includes(l.id));
    
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          geometries: remainingGeometries,
          sources: remainingSources,
          boundaries: remainingBoundaries,
          lattices: remainingLattices,
        }
      },
    });
    
    if (geomIds.length > 0) removeGeometries(geomIds);
    if (sourceIds.length > 0) removeSources(sourceIds);
    if (boundaryIds.length > 0) removeBoundaries(boundaryIds);
    if (latticeIds.length > 0) removeLattices(latticeIds);
  }, [removeGeometries, removeSources, removeBoundaries, removeLattices, updateProject, projectId, geometries, sources, boundaries, lattices, project.scene]);

  // --- Container Size and Resize Handling ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  // Sync container size with store
  useEffect(() => {
    setCanvasSize(containerSize);
  }, [containerSize, setCanvasSize]);
  
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
  const toggleShowGrid = useCanvasStore((s) => s.toggleShowGrid);
  const toggleShowResolutionOverlay = useCanvasStore((s) => s.toggleShowResolutionOverlay);
  const showCanvasInfo = useCanvasStore((s) => s.showCanvasInfo);
  const showXRayMode = useCanvasStore((s) => s.showXRayMode);
  const showColors = useCanvasStore((s) => s.showColors);

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
  const resolutionSnapping = useCanvasStore((s) => s.resolutionSnapping);
  const snapCanvasPosToGrid = useCallback((canvasPos: { x: number; y: number }) => {
    // The canvasPos is already in logical coordinates (not stage coordinates)
    // So we don't need to transform from stage to logical
    const logicalX = canvasPos.x;
    const logicalY = canvasPos.y;

    if (resolutionSnapping && project.scene?.resolution && project.scene.resolution > 1) {
      const res = project.scene.resolution;
      const cellW = GRID_PX / res;
      const cellH = GRID_PX / res;
      const snappedLogicalX = Math.round(logicalX / cellW) * cellW;
      const snappedLogicalY = Math.round(logicalY / cellH) * cellH;
      return {
        x: snappedLogicalX,
        y: snappedLogicalY,
      };
    } else if (gridSnapping) {
      const snappedLogicalX = Math.round(logicalX / GRID_PX) * GRID_PX;
      const snappedLogicalY = Math.round(logicalY / GRID_PX) * GRID_PX;
      return {
        x: snappedLogicalX,
        y: snappedLogicalY,
      };
    } else {
      return canvasPos;
    }
  }, [resolutionSnapping, gridSnapping, project.scene?.resolution]);

  // --- Multi-Select Drag State ---
  const [multiDragAnchor, setMultiDragAnchor] = useState<{
    id: string;
    anchor: { x: number; y: number };
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedGeometryIds.length > 0) {
        e.preventDefault();
        handleBatchRemoveElements(selectedGeometryIds);
      } else if (e.key === "Escape") {
        e.preventDefault();
        selectGeometry(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedGeometryIds, handleBatchRemoveElements, selectGeometry]);

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

  // --- Draggable Canvas Info State ---
  const [infoPosition, setInfoPosition] = useState({ x: null as number | null, y: null as number | null });
  const [isDraggingInfo, setIsDraggingInfo] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const infoRef = useRef<HTMLDivElement>(null);
  const [activeInstructionSet, setActiveInstructionSet] = useState<InstructionSetKey>('default');

  // Initialize position on mount and when container resizes
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      setInfoPosition({
        x: 20, // 20px from the left edge (bottom left placement)
        y: containerSize.height - 120, // 100px → 120px (20px more up)
      });
    }
  }, [containerSize.width, containerSize.height]);

  // Export setActiveInstructionSet for use in child components
  const canvasContext = useMemo(() => ({
    setActiveInstructionSet
  }), []);

  // Get X-Ray transparency from store
  const xRayTransparency = useCanvasStore((s) => s.xRayTransparency);
  const getElementXRayTransparency = useCanvasStore((s) => s.getElementXRayTransparency);

  // Set initial X-Ray transparency value (optional - adjust as needed)
  React.useEffect(() => {
    // Only set if not already initialized
    const currentTransparency = useCanvasStore.getState().xRayTransparency;
    if (currentTransparency === 0.3) {
      useCanvasStore.getState().setXRayTransparency(0.3);
    }
  }, []);
  
  // Get background color visibility from store
  const getElementColorVisibility = useCanvasStore((s) => s.getElementColorVisibility);
  const showBackgroundColor = getElementColorVisibility('background');
  
  // Get background color from material
  const { getMaterialColor } = useMaterialColorStore();
  const backgroundColor = React.useMemo(() => {
    // Check if background colors are enabled
    if (!showBackgroundColor) {
      return "#d4d4d4"; // Always use default gray when colors are disabled
    }
    
    if (sceneMaterial === "Air") {
      return "#d4d4d4"; // Keep default gray for Air
    }
    
    // Get the material color, handling edge cases
    const materialColor = getMaterialColor(sceneMaterial);
    
    // If getMaterialColor returns undefined/null, try to get color from catalog
    if (!materialColor) {
      const material = MaterialCatalog[sceneMaterial as keyof typeof MaterialCatalog];
      if (material?.color) {
        return material.color;
      }
    }
    
    // Return the material color if found, otherwise default
    return materialColor || "#d4d4d4";
  }, [sceneMaterial, getMaterialColor, showBackgroundColor]);

  // ← add this line (value is unused; it just triggers re-render)
  const colorRevision = useCanvasStore((s) => s.colorSettingsRevision);
  const xRayRevision = useCanvasStore((s) => s.xRayTransparencyRevision); // trigger re-render

  // Combine all elements into single array
  const allElements = React.useMemo(() => {
    // Map to ensure all elements have correct type field
    const mappedGeometries = geometries.map(g => ({ ...g, type: g.kind }));
    const mappedSources = sources.map(s => ({ ...s, type: s.kind }));
    const mappedBoundaries = boundaries.map(b => ({ ...b, type: b.kind }));
    const mappedLattices = lattices.map(l => ({ ...l, type: 'lattice' }));
    
    return [...mappedGeometries, ...mappedSources, ...mappedBoundaries, ...mappedLattices];
  }, [geometries, sources, boundaries, lattices]);

  // Unified update handler
  const handleUpdateElement = useCallback((id: string, updates: Partial<any>) => {
    const element = allElements.find(e => e.id === id);
    if (!element) return;
    
    // Check by kind first, then by type
    const elementType = element.kind || element.type;
    
    switch (elementType) {
      case 'cylinder':
      case 'rectangle':
      case 'triangle':
        updateGeometry(id, updates);
        break;
      case 'continuousSource':
      case 'gaussianSource':
      case 'eigenModeSource':
      case 'gaussianBeamSource':
        updateSource(id, updates);
        break;
      case 'pmlBoundary':
        updateBoundary(id, updates);
        break;
      case 'lattice':
        updateLattice(id, updates);
        break;
    }
  }, [allElements, updateGeometry, updateSource, updateBoundary, updateLattice]);

  // Unified commit handler
  const handleCommitElement = useCallback((id: string, updates: Partial<any>) => {
    const element = allElements.find(e => e.id === id);
    if (!element) return;
    
    // Check by kind first, then by type
    const elementType = element.kind || element.type;
    
    switch (elementType) {
      case 'cylinder':
      case 'rectangle':
      case 'triangle':
        handleUpdateGeometry(id, updates);
        break;
      case 'continuousSource':
      case 'gaussianSource':
      case 'eigenModeSource':
      case 'gaussianBeamSource':
        handleUpdateSource(id, updates);
        break;
      case 'pmlBoundary':
        handleUpdateBoundary(id, updates);
        break;
      case 'lattice':
        handleUpdateLattice(id, updates);
        break;
    }
  }, [allElements, handleUpdateGeometry, handleUpdateSource, handleUpdateBoundary, handleUpdateLattice]);

  // --- Render ---
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center bg-neutral-300"
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
            selectGeometry(null);
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
              
              // Helper: Check if two line segments intersect
              function segmentsIntersect(p1: {x:number,y:number}, p2: {x:number,y:number}, p3: {x:number,y:number}, p4: {x:number,y:number}) {
                const d1 = direction(p3, p4, p1);
                const d2 = direction(p3, p4, p2);
                const d3 = direction(p1, p2, p3);
                const d4 = direction(p1, p2, p4);
                
                if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
                    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
                  return true;
                }
                
                if (d1 === 0 && onSegment(p3, p1, p4)) return true;
                if (d2 === 0 && onSegment(p3, p2, p4)) return true;
                if (d3 === 0 && onSegment(p1, p3, p2)) return true;
                if (d4 === 0 && onSegment(p1, p4, p2)) return true;
                
                return false;
              }
              
              function direction(a: {x:number,y:number}, b: {x:number,y:number}, c: {x:number,y:number}) {
                return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
              }
              
              function onSegment(p: {x:number,y:number}, q: {x:number,y:number}, r: {x:number,y:number}) {
                return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
                       q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
              }
              
              function pointInTriangle(p: {x:number,y:number}, a: {x:number,y:number}, b: {x:number,y:number}, c: {x:number,y:number}) {
                // Barycentric coordinates method
                const v0x = c.x - a.x;
                const v0y = c.y - a.y;
                const v1x = b.x - a.x;
                const v1y = b.y - a.y;
                const v2x = p.x - a.x;
                const v2y = p.y - a.y;
                
                const dot00 = v0x * v0x + v0y * v0y;
                const dot01 = v0x * v1x + v0y * v1y;
                const dot02 = v0x * v2x + v0y * v2y;
                const dot11 = v1x * v1x + v1y * v1y;
                const dot12 = v1x * v2x + v1y * v2y;
                
                const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
                const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
                const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
                
                return (u >= 0) && (v >= 0) && (u + v <= 1);
              }
              
              function triangleRectIntersect(triPos: {x:number,y:number}, triVerts: {x:number,y:number}[], rect: {x:number,y:number,width:number,height:number}) {
                // Convert relative vertices to absolute positions
                const absVerts = triVerts.map(v => ({ x: triPos.x + v.x, y: triPos.y + v.y }));
                
                // Rectangle corners
                const rectCorners = [
                  { x: rect.x, y: rect.y },
                  { x: rect.x + rect.width, y: rect.y },
                  { x: rect.x + rect.width, y: rect.y + rect.height },
                  { x: rect.x, y: rect.y + rect.height }
                ];
                
                // Check 1: Any triangle vertex inside rectangle?
                for (const vert of absVerts) {
                  if (pointInRect(vert.x, vert.y, rect)) {
                    return true;
                  }
                }
                
                // Check 2: Any rectangle corner inside triangle?
                for (const corner of rectCorners) {
                  if (pointInTriangle(corner, absVerts[0], absVerts[1], absVerts[2])) {
                    return true;
                  }
                }
                
                // Check 3: Any triangle edge intersects any rectangle edge?
                const triEdges = [
                  [absVerts[0], absVerts[1]],
                  [absVerts[1], absVerts[2]],
                  [absVerts[2], absVerts[0]]
                ];
                
                const rectEdges = [
                  [rectCorners[0], rectCorners[1]],
                  [rectCorners[1], rectCorners[2]],
                  [rectCorners[2], rectCorners[3]],
                  [rectCorners[3], rectCorners[0]]
                ];
                
                for (const [t1, t2] of triEdges) {
                  for (const [r1, r2] of rectEdges) {
                    if (segmentsIntersect(t1, t2, r1, r2)) {
                      return true;
                    }
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
              const selected = [...geometries, ...sources, ...lattices].filter(elem => {
                if (elem.kind === "rectangle") {
                  const rx = elem.pos.x - elem.width / 2;
                  const ry = elem.pos.y - elem.height / 2;
                  return rectsIntersect(
                    { x: rx, y: ry, width: elem.width, height: elem.height },
                    latticeBox
                  );
                } else if (elem.kind === "cylinder") {
                  return circleRectIntersect(elem.pos.x, elem.pos.y, elem.radius, latticeBox);
                } else if (elem.kind === "triangle") {
                  // First pass: bounding box check
                  const absVerts = (elem.vertices as { x: number; y: number }[]).map(v => ({ x: elem.pos.x + v.x, y: elem.pos.y + v.y }));
                  const xs = absVerts.map(pt => pt.x);
                  const ys = absVerts.map(pt => pt.y);
                  const minX = Math.min(...xs);
                  const maxX = Math.max(...xs);
                  const minY = Math.min(...ys);
                  const maxY = Math.max(...ys);
                  
                  const boundingBoxIntersects = rectsIntersect(
                    { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
                    latticeBox
                  );
                  
                  // Second pass: precise triangle-rectangle intersection only if bounding box intersects
                  if (boundingBoxIntersects) {
                    return triangleRectIntersect(elem.pos, elem.vertices as { x: number; y: number }[], latticeBox);
                  }
                  return false;
                } else if (elem.kind === "continuousSource" || elem.kind === "gaussianSource" || 
                          elem.kind === "eigenModeSource" || elem.kind === "gaussianBeamSource") {
                  return (
                    elem.pos.x >= latticeBox.x &&
                    elem.pos.x <= latticeBox.x + latticeBox.width &&
                    elem.pos.y >= latticeBox.y &&
                    elem.pos.y <= latticeBox.y + latticeBox.height
                  );
                } else if (elem.kind === "pmlBoundary") {
                  // Assume has pos, thickness, treat as rectangle (in lattice units)
                  const rx = elem.pos.x - (elem.thickness || 0) / 2;
                  const ry = elem.pos.y - (elem.thickness || 0) / 2;
                  return rectsIntersect(
                    { x: rx, y: ry, width: elem.thickness || 1, height: elem.thickness || 1 },
                    latticeBox
                  );
                } else if (elem.kind === "lattice") {
                  // Check if lattice origin is in selection box
                  return (
                    elem.pos.x >= latticeBox.x &&
                    elem.pos.x <= latticeBox.x + latticeBox.width &&
                    elem.pos.y >= latticeBox.y &&
                    elem.pos.y <= latticeBox.y + latticeBox.height
                  );
                }
                return false;
              }).map(elem => elem.id);
              
              // Update selection state
              useCanvasStore.getState().setSelectedGeometryIds(selected);
              
              // If only one element selected, also set selectedGeometryId for property panel
              if (selected.length === 1) {
                useCanvasStore.getState().selectGeometry(selected[0]);
              }
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
            fill="#e5e5e5"
            listening={false}
          />
          {/* Draw the main rectangle area with material color */}
          <Rect
            x={0}
            y={0}
            width={LOGICAL_W}
            height={LOGICAL_H}
            fill={backgroundColor}
            listening={false}
            opacity={showXRayMode ? getElementXRayTransparency('background') : 1}
          />
        </Layer>
        
        {/* --- Grid and border layer --- */}
        <Layer>
          {/* Draw subgrid (resolution) lines first, then main grid lines above */}
          <GridOverlayRenderer
            resolutionLines={resolutionLines}
            gridLines={gridLines}
            LOGICAL_W={LOGICAL_W}
            LOGICAL_H={LOGICAL_H}
            borderWeight={borderWeight}
          />
        </Layer>
        
        {/* --- All elements in unified layer --- */}
        <ElementLayer
          elements={allElements}
          selectedIds={selectedGeometryIds}
          onSelect={selectGeometry}
          onUpdate={handleUpdateElement}
          onCommit={handleCommitElement}
          GRID_PX={GRID_PX}
          scale={scale}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          onSetActiveInstructionSet={(set) => setActiveInstructionSet(set as InstructionSetKey)}
          resolution={project.scene?.resolution}
        />
        
        {/* --- Selection rectangle overlay --- */}
        <SelectionBoxLayer selBox={selBox} />
      </Stage>
      
      {/* Canvas info overlay */}
      {showCanvasInfo && infoPosition.x !== null && infoPosition.y !== null && (
        <div
          ref={infoRef}
          className="absolute bg-gray-800/90 backdrop-blur rounded-lg p-3 text-xs text-gray-300 select-none whitespace-nowrap"
          style={{
            left: `${infoPosition.x}px`,
            top: `${infoPosition.y}px`,
            minWidth: '160px',
          }}
          onMouseDown={(e) => {
            const rect = infoRef.current?.getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (rect && containerRect) {
              setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
              setIsDraggingInfo(true);
              e.preventDefault();
            }
          }}
        >
          <div className="space-y-1">
            {INSTRUCTION_SETS[activeInstructionSet].map((instruction, index) => (
              <div key={index} className="text-gray-200">{instruction}</div>
            ))}
            <div className="text-gray-500 mt-2 pt-2 border-t border-gray-700">
              <div>Zoom: {(scale / minZoomDynamic).toFixed(1)}</div>
              {gridSnapping && <div>Grid snapping</div>}
              {resolutionSnapping && <div>Resolution snapping</div>}
              {!gridSnapping && !resolutionSnapping && <div>No snapping</div>}
            </div>
          </div>
        </div>
      )}
      
      {/* Global mouse handlers for dragging */}
      {isDraggingInfo && (
        <div
          className="fixed inset-0 z-50"
          onMouseMove={(e) => {
            const containerRect = containerRef.current?.getBoundingClientRect();
            const infoRect = infoRef.current?.getBoundingClientRect();
            if (containerRect && infoRect) {
              const x = e.clientX - containerRect.left - dragOffset.x;
              const y = e.clientY - containerRect.top - dragOffset.y;
              setInfoPosition({
                x: Math.max(0, Math.min(containerSize.width - infoRect.width, x)),
                y: Math.max(0, Math.min(containerSize.height - infoRect.height, y)),
              });
            }
          }}
          onMouseUp={() => {
            setIsDraggingInfo(false);
          }}
        />
      )}
    </div>
  );
};

// --- Export ---
export default ProjectCanvas;
