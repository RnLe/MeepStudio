"use client";

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Stage, Layer, Line, Circle, Text, Arrow, Rect, Group } from "react-konva";
import { Lattice } from "../types/meepLatticeTypes";
import { useLatticeStore } from "../providers/LatticeStore";
import { getWasmModule } from "../utils/wasmLoader";
import { useLatticeDataLoader } from "../hooks/useLatticeDataLoader";
import { 
  getSymmetryPointsForLattice, 
  getSymmetryPathsForLattice,
  calculateHighSymmetryPosition,
  HighSymmetryPoint,
  HighSymmetryPath
} from "../utils/latticeDefaults";
import { LatticeType, detectLatticeType } from "../utils/latticeTypeChecker";

interface Props {
  lattice: Lattice;
  ghPages: boolean;
}

const LatticeCanvas: React.FC<Props> = ({ lattice, ghPages }) => {
  // --- Container Size and Resize Handling ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  // Get space mode from store
  const spaceMode              = useLatticeStore((s) => s.spaceMode);
  const voronoiData            = useLatticeStore((s) => s.voronoiData);
  const showLatticePoints      = useLatticeStore((s) => s.showLatticePoints);
  const showUnitCell           = useLatticeStore((s) => s.showUnitCell);
  const showUnitTilesLattice   = useLatticeStore((s) => s.showUnitTilesLattice);
  const showGrid               = useLatticeStore((s) => s.showGrid);
  const latticeScale           = useLatticeStore((s) => s.latticeScale);
  const gridDensity            = useLatticeStore((s) => s.gridDensity);
  const normalizeMode          = useLatticeStore((s) => s.normalizeMode);
  const showBaseVectors        = useLatticeStore((s) => s.showBaseVectors);
  const showHighSymmetryPoints = useLatticeStore((s) => s.showHighSymmetryPoints);

  // --- NEW: bring these selectors up here so they are declared
  //          before any effect / code that references them
  const currentBasis1          = useLatticeStore((s) => s.currentBasis1);
  const currentBasis2          = useLatticeStore((s) => s.currentBasis2);
  const currentLatticeType     = useLatticeStore((s) => s.currentLatticeType);
  const canvasUpdateTrigger    = useLatticeStore((s) => s.canvasUpdateTrigger);

  // Get lattice point cache from store
  const latticePointCache = useLatticeStore((s) => s.latticePointCache);

  // Get Voronoi data flags
  const showVoronoiCell   = useLatticeStore((s) => s.showVoronoiCell);
  const showVoronoiTiling = useLatticeStore((s) => s.showVoronoiTiling);

  // Get zone counts
  const realSpaceZoneCount       = useLatticeStore((s) => s.realSpaceZoneCount);
  const reciprocalSpaceZoneCount = useLatticeStore((s) => s.reciprocalSpaceZoneCount);
  
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };
    
    // Initial size
    handleResize();
    
    // Add resize observer for more reliable size detection
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Also listen to window resize as fallback
    window.addEventListener("resize", handleResize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // --- Zoom & Pan State ---
  const stageRef = useRef<any>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPointer, setLastPointer] = useState<{ x: number; y: number } | null>(null);

  // --- Canvas dimensions ---
  const CANVAS_W = containerSize.width;
  const CANVAS_H = containerSize.height;

  // Center the view on mount
  useEffect(() => {
    setPos({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  }, [CANVAS_W, CANVAS_H]);

  // --- Wheel Handler for Zooming ---
  const handleWheel = useCallback((e: any) => {
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
    newScale = Math.max(0.1, Math.min(10, newScale));
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    
    setScale(newScale);
    setPos(newPos);
  }, [scale, pos]);

  // Get normalization factor from the data loader hook
  const { getNormalizationFactor, checkAndCalculateVoronoi } = useLatticeDataLoader({ lattice, ghPages });
  const normalizationFactor = getNormalizationFactor();
  
  // Check if grid is sparse (for k-space typically)
  const checkIfSparse = useCallback(() => {
    if (!lattice?.meepLattice || spaceMode !== 'reciprocal') return false;
    
    const b1 = lattice.meepLattice.reciprocal_basis1;
    const b2 = lattice.meepLattice.reciprocal_basis2;
    if (!b1 || !b2) return false;
    
    const len1 = Math.sqrt(b1.x * b1.x + b1.y * b1.y);
    const len2 = Math.sqrt(b2.x * b2.x + b2.y * b2.y);
    
    return Math.max(len1, len2) >= 2;
  }, [lattice, spaceMode]);

  const isSparse = checkIfSparse();

  // --- REVISED: Simplified vector calculation ---
  // Calculate vectors directly without memoization to ensure reactivity
  const calculateVectors = () => {
    if (!lattice?.meepLattice) return { v1: { x: 0, y: 0 }, v2: { x: 0, y: 0 } };
    
    const isRealSpace = spaceMode === 'real';
    const scale = latticeScale * (normalizeMode ? normalizationFactor : 1);
    
    if (isRealSpace) {
      return {
        v1: {
          x: lattice.meepLattice.basis1.x * lattice.meepLattice.basis_size.x * scale,
          y: -lattice.meepLattice.basis1.y * lattice.meepLattice.basis_size.y * scale
        },
        v2: {
          x: lattice.meepLattice.basis2.x * lattice.meepLattice.basis_size.x * scale,
          y: -lattice.meepLattice.basis2.y * lattice.meepLattice.basis_size.y * scale
        }
      };
    } else {
      return {
        v1: lattice.meepLattice.reciprocal_basis1 ? {
          x: lattice.meepLattice.reciprocal_basis1.x * scale,
          y: -lattice.meepLattice.reciprocal_basis1.y * scale
        } : { x: 0, y: 0 },
        v2: lattice.meepLattice.reciprocal_basis2 ? {
          x: lattice.meepLattice.reciprocal_basis2.x * scale,
          y: -lattice.meepLattice.reciprocal_basis2.y * scale
        } : { x: 0, y: 0 }
      };
    }
  };

  // Instead, compute vectors via useMemo (will only update when lattice or mode changes)
  const computedVectors = useMemo(() => calculateVectors(), [
    lattice?.meepLattice,
    spaceMode,
    latticeScale,
    normalizeMode,
    normalizationFactor
  ]);

  const drawLatticeVectors = () => {
    if (!lattice?.meepLattice || !showBaseVectors) return null;
    
    const isRealSpace = spaceMode === 'real';
    
    // Colors based on mode
    const v1Color = isRealSpace ? "#10b981" : "#60a5fa";
    const v2Color = isRealSpace ? "#f59e0b" : "#a78bfa";
    const v1Label = isRealSpace ? "a₁" : "b₁";
    const v2Label = isRealSpace ? "a₂" : "b₂";
    
    // Destructure computed vectors
    const { v1, v2 } = computedVectors;
    
    return (
      <>
        {/* Basis vector 1 */}
        <Arrow
          points={[0, 0, v1.x, v1.y]}
          stroke={v1Color}
          strokeWidth={3}
          fill={v1Color}
          pointerLength={10}
          pointerWidth={10}
        />
        <Text
          x={v1.x + 15}
          y={v1.y - 15}
          text={v1Label}
          fontSize={16}
          fontFamily="system-ui"
          fill={v1Color}
          fontStyle="bold"
        />
        
        {/* Basis vector 2 */}
        <Arrow
          points={[0, 0, v2.x, v2.y]}
          stroke={v2Color}
          strokeWidth={3}
          fill={v2Color}
          pointerLength={10}
          pointerWidth={10}
        />
        <Text
          x={v2.x + 15}
          y={v2.y - 15}
          text={v2Label}
          fontSize={16}
          fontFamily="system-ui"
          fill={v2Color}
          fontStyle="bold"
        />
        
        {/* Origin */}
        <Circle
          x={0}
          y={0}
          radius={5}
          fill="#fff"
          stroke="#1f2937"
          strokeWidth={2}
        />
      </>
    );
  };

  // Draw lattice points using cached data from Rust
  const drawLatticePoints = () => {
    if (!lattice?.meepLattice || !showLatticePoints || !latticePointCache) return null;
    
    const isRealSpace = spaceMode === 'real';
    const scale = latticeScale * (normalizeMode ? normalizationFactor : 1);
    const points: React.ReactNode[] = [];
    
    const pointColor = isRealSpace ? "#60a5fa" : "#a78bfa";
    const strokeColor = isRealSpace ? "#1e40af" : "#6d28d9";
    
    // Calculate the maximum distance for opacity calculation
    const maxDistance = latticePointCache.maxDistance * scale;
    
    latticePointCache.points.forEach((point: { x: number; y: number; i: number; j: number; distance: number }, idx: number) => {
      const x = point.x * scale;
      const y = -point.y * scale; // Flip y for canvas coordinate system
      
      // Calculate opacity based on distance with non-linear gradient
      const distance = point.distance * scale;
      const normalizedDistance = distance / maxDistance;
      // Use power function for non-linear gradient (exponent 1.5 for moderate non-linearity)
      const opacity = Math.max(0.1, 1 - Math.pow(normalizedDistance / 1.2, 1.8));
      
      // Dynamic radius based on distance from origin
      const baseRadius = 4;
      // Only apply dynamic scaling when NOT in normalize mode
      const radius = normalizeMode ? baseRadius : baseRadius * Math.max(1, latticePointCache.maxDistance / 10);
      
      points.push(
        <Circle
          key={`${point.i}-${point.j}-${idx}`}
          x={x}
          y={y}
          radius={radius}
          fill={pointColor}
          opacity={opacity}
          strokeWidth={1}
          stroke={strokeColor}
        />
      );
    });
    
    return <>{points}</>;
  };

  // Draw unit cell outline with animation and fill
  const drawUnitCell = () => {
     if (!lattice?.meepLattice || !showUnitCell) return null;
    
    const isRealSpace = spaceMode === 'real';
    const strokeColor = isRealSpace ? "#94a3b8" : "#c4b5fd";
    const fillColor = isRealSpace ? "rgba(148, 163, 184, 0.08)" : "rgba(196, 181, 253, 0.08)";
    
    // Get current values from computed vectors
    const { v1, v2 } = computedVectors;
    
    const unitCellPoints = [
      0, 0,
      v1.x, v1.y,
      v1.x + v2.x, v1.y + v2.y,
      v2.x, v2.y,
      0, 0
    ];
    
    return (
      <>
        {/* Unit cell fill (drawn first so it's behind everything) - only show if unit tiles areNOT active */}
        {!showUnitTilesLattice && (
          <Line
            points={unitCellPoints}
            fill={fillColor}
            closed
            strokeWidth={0}
          />
        )}
        
        {/* Unit cell outline - only show if unit tiles are NOT active */}
        {!showUnitTilesLattice && (
          <Line
            points={unitCellPoints}
            stroke={strokeColor}
            strokeWidth={2}
            dash={[5, 5]}
            opacity={0.5}
            closed={false}
          />
        )}
        
        {/* Origin point (always visible when unit cell is shown) */}
        <Circle
          x={0}
          y={0}
          radius={5}
          fill="#fff"
          stroke="#1f2937"
          strokeWidth={2}
        />
      </>
    );
  };

  // Draw unit cell tiling - unit cells at each lattice point
  const drawUnitTilesLattice = () => {
    if (!lattice?.meepLattice || !showUnitTilesLattice || !latticePointCache) return null;
    
    const isRealSpace = spaceMode === 'real';
    const scale = latticeScale * (normalizeMode ? normalizationFactor : 1);
    const strokeColor = isRealSpace ? "#94a3b8" : "#c4b5fd";
    const fillColor = isRealSpace ? "rgba(148, 163, 184, 0.05)" : "rgba(196, 181, 253, 0.05)"; // More transparent for tiling
    
    const tiles: React.ReactNode[] = [];
    const maxDistance = latticePointCache.maxDistance * scale;
    
    // Get values from computed vectors
    const { v1, v2 } = computedVectors;
    
    // Draw a unit cell at each lattice point
    latticePointCache.points.forEach((point: { x: number; y: number; i: number; j: number; distance: number }, idx: number) => {
      const px = point.x * scale;
      const py = -point.y * scale; // Flip y for canvas coordinate system
      
      // Calculate opacity based on distance with non-linear gradient
      const distance = point.distance * scale;
      const normalizedDistance = distance / maxDistance;
      const opacity = Math.max(0.05, 0.8 - Math.pow(normalizedDistance / 1.1, 0.8));
      
      tiles.push(
        <Line
          key={`tile-${point.i}-${point.j}-${idx}`}
          points={[
            px, py,
            px + v1.x, py + v1.y,
            px + v1.x + v2.x, py + v1.y + v2.y,
            px + v2.x, py + v2.y,
            px, py
          ]}
          stroke={strokeColor}
          strokeWidth={1}
          fill={fillColor}
          closed
          opacity={opacity}
        />
      );
    });
    
    return <>{tiles}</>;
  };

  // Draw coordinate system with grid
  const drawGrid = () => {
    if (!showGrid) return null;
    
    const axisLength = 2000;
    const tickSpacing = 50;
    const tickLength = 10;
    
    return (
      <Group opacity={0.3}>
        {/* X axis */}
        <Line
          points={[-axisLength, 0, axisLength, 0]}
          stroke="#475569"
          strokeWidth={1}
        />
        {/* Y axis */}
        <Line
          points={[0, -axisLength, 0, axisLength]}
          stroke="#475569"
          strokeWidth={1}
        />
        
        {/* Grid lines */}
        {Array.from({ length: Math.floor(axisLength / tickSpacing) * 2 + 1 }, (_, i) => {
          const pos = (i - Math.floor(axisLength / tickSpacing)) * tickSpacing;
          return (
            <React.Fragment key={i}>
              <Line
                points={[pos, -axisLength, pos, axisLength]}
                stroke="#334155"
                strokeWidth={0.5}
              />
              <Line
                points={[-axisLength, pos, axisLength, pos]}
                stroke="#334155"
                strokeWidth={0.5}
              />
            </React.Fragment>
          );
        })}
      </Group>
    );
  };

  // --- helper : convert "#rrggbb" → "rgba(r,g,b,alpha)" ------------------------
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace("#", "");
    const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // Draw Voronoi cell tiling - voronoi cells at each lattice point
  const drawVoronoiTiling = () => {
    if (!lattice?.meepLattice || !showVoronoiTiling || !latticePointCache || !voronoiData) return null;
    
    const isRealSpace = spaceMode === 'real';
    const scale = latticeScale * (normalizeMode ? normalizationFactor : 1);
    
    // Get the first zone data
    let zoneVertices: any[] = [];
    if (isRealSpace && voronoiData.realSpaceZones && voronoiData.realSpaceZones.length > 0) {
      const zone = voronoiData.realSpaceZones[0];
      zoneVertices = Array.isArray(zone) ? zone : zone.vertices;
    } else if (!isRealSpace && voronoiData.brillouinZones && voronoiData.brillouinZones.length > 0) {
      const zone = voronoiData.brillouinZones[0];
      zoneVertices = Array.isArray(zone) ? zone : zone.vertices;
    } else if (isRealSpace && voronoiData.wignerSeitzCell) {
      // Fallback to single zone data
      zoneVertices = Array.isArray(voronoiData.wignerSeitzCell) 
        ? voronoiData.wignerSeitzCell 
        : voronoiData.wignerSeitzCell.vertices;
    }
    
    if (zoneVertices.length === 0) return null;
    
    const strokeColor = isRealSpace ? "#10b981" : "#60a5fa";
    const fillColor = isRealSpace ? "rgba(16, 185, 129, 0.05)" : "rgba(96, 165, 250, 0.05)";
    
    const tiles: React.ReactNode[] = [];
    const maxDistance = latticePointCache.maxDistance * scale;
    
    // Draw a voronoi cell at each lattice point
    latticePointCache.points.forEach((point: { x: number; y: number; i: number; j: number; distance: number }, idx: number) => {
      const px = point.x * scale;
      const py = -point.y * scale; // Flip y for canvas coordinate system
      
      // Calculate opacity based on distance with non-linear gradient
      const distance = point.distance * scale;
      const normalizedDistance = distance / maxDistance;
      // Use power function for non-linear gradient (exponent 1.8 for stronger fade)
      const opacity = Math.max(0.05, 0.8 - Math.pow(normalizedDistance / 1.1, 0.7));
      
      // Transform vertices to be centered at the lattice point
      const pts = zoneVertices.flatMap((v: any) => [
        px + v.x * scale,
        py - v.y * scale
      ]);
      
      tiles.push(
        <Line
          key={`voronoi-tile-${point.i}-${point.j}-${idx}`}
          points={[...pts, pts[0], pts[1]]} // Close the polygon
          stroke={strokeColor}
          strokeWidth={1}
          fill={fillColor}
          closed
          opacity={opacity}
        />
      );
    });
    
    return <>{tiles}</>;
  };

  // Draw Voronoi cells (Wigner-Seitz or Brillouin zones)
  const drawVoronoiCells = () => {
    if (!voronoiData || !showVoronoiCell || showVoronoiTiling) return null; // Don't draw individual cells when tiling is active

    const isRealSpace = spaceMode === "real";
    const scale = latticeScale * (normalizeMode ? normalizationFactor : 1);
    const cells: React.ReactNode[] = [];

    // --- common helpers ---
    const pushCell = (
      key: string,
      pts: number[],
      stroke: string,
      dashed: boolean = false
    ) =>
      cells.push(
        <Line
          key={key}
          points={[...pts, pts[0], pts[1]]}       /* close polygon */
          stroke={stroke}
          strokeWidth={1}
          dash={dashed ? [5, 5] : undefined}
          fill={hexToRgba(stroke, 0.05)}          /* 5 % opaque fill  */
          closed
        />
      );

    // Draw based on current space mode
    if (isRealSpace && voronoiData.realSpaceZones) {
      // Use the new multi-zone data
      const zones = voronoiData.realSpaceZones;
      const zonesToDraw = Math.min(realSpaceZoneCount, zones.length);
      const palette = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

      zones.slice(0, zonesToDraw).forEach((zone: any, idx: number) => {
        const verts = Array.isArray(zone) ? zone : zone.vertices;
        const pts = verts.flatMap((v: any) => [v.x * scale, -v.y * scale]);
        pushCell(`ws-${idx}`, pts, palette[idx % palette.length], idx > 0);
      });
    } else if (isRealSpace && voronoiData.wignerSeitzCell) {
      // Fallback to single zone
      const verts = Array.isArray(voronoiData.wignerSeitzCell)
        ? voronoiData.wignerSeitzCell
        : voronoiData.wignerSeitzCell.vertices;
      const pts = verts.flatMap((v: any) => [v.x * scale, -v.y * scale]);
      pushCell("wigner-seitz", pts, "#10b981");
    } else if (!isRealSpace && voronoiData.brillouinZones) {
      const zones = voronoiData.brillouinZones as any[];
      const zonesToDraw = Math.min(reciprocalSpaceZoneCount, zones.length);
      const palette = ["#60a5fa", "#a78bfa", "#f472b6", "#fb923c", "#fbbf24"];

      zones.slice(0, zonesToDraw).forEach((zone, idx) => {
        const verts = Array.isArray(zone) ? zone : zone.vertices;
        const pts = verts.flatMap((v: any) => [v.x * scale, -v.y * scale]);
        pushCell(`bz-${idx}`, pts, palette[idx % palette.length], idx > 0);
      });
    }
    return <>{cells}</>;
  };

  // Draw high symmetry points and paths
  const drawHighSymmetryPoints = () => {
    if (!lattice?.meepLattice || !showHighSymmetryPoints || spaceMode !== 'reciprocal') return null;
    
    const scale = latticeScale * (normalizeMode ? normalizationFactor : 1);
    
    // Get reciprocal basis vectors
    const b1 = lattice.meepLattice.reciprocal_basis1;
    const b2 = lattice.meepLattice.reciprocal_basis2;
    if (!b1 || !b2) return null;
    
    // Determine lattice type - use detected type if available
    let latticeType: LatticeType;
    
    // First try to use the stored latticeType
    if (lattice.latticeType && Object.values(LatticeType).includes(lattice.latticeType as LatticeType)) {
      latticeType = lattice.latticeType as LatticeType;
    } else {
      // Fallback to detection
      try {
        const detected = detectLatticeType(
          lattice.meepLattice.basis1,
          lattice.meepLattice.basis2
        );
        latticeType = detected.type;
      } catch (error) {
        console.error('Error detecting lattice type:', error);
        latticeType = LatticeType.OBLIQUE;
      }
    }
    
    // Get symmetry points and paths
    const symmetryPoints = getSymmetryPointsForLattice(latticeType);
    const symmetryPaths = getSymmetryPathsForLattice(latticeType);
    
    if (symmetryPoints.length === 0) {
      console.warn(`No symmetry points defined for lattice type: ${latticeType}`);
      return null;
    }
    
    // Calculate positions
    const pointPositions = new Map<string, { x: number; y: number }>();
    symmetryPoints.forEach(point => {
      const pos = calculateHighSymmetryPosition(point, b1, b2);
      pointPositions.set(point.label, {
        x: pos.x * scale,
        y: -pos.y * scale // Flip y for canvas
      });
    });
    
    const elements: React.ReactNode[] = [];
    
    // Scale-sensitive sizing - made smaller
    const basePointRadius = normalizeMode ? 4.5 : Math.max(3, Math.min(6, latticeScale / 25));
    const baseStrokeWidth = normalizeMode ? 1.5 : Math.max(1, Math.min(2.5, latticeScale / 50));
    const baseFontSize = normalizeMode ? 12 : Math.max(8, Math.min(14, latticeScale / 10));
    const basePathWidth = normalizeMode ? 1.5 : Math.max(1, Math.min(2.5, latticeScale / 50));
    
    // Draw paths first (so they appear behind points)
    symmetryPaths.forEach((path, idx) => {
      const fromPos = pointPositions.get(path.from);
      const toPos = pointPositions.get(path.to);
      
      if (fromPos && toPos) {
        elements.push(
          <Line
            key={`path-${idx}`}
            points={[fromPos.x, fromPos.y, toPos.x, toPos.y]}
            stroke="#fbbf24"
            strokeWidth={basePathWidth}
            opacity={0.6}
            dash={[4, 2]}
          />
        );
      }
    });
    
    // Draw points and labels
    symmetryPoints.forEach((point, idx) => {
      const pos = pointPositions.get(point.label);
      if (!pos) return;
      
      // Point circle with scale-sensitive radius
      elements.push(
        <Circle
          key={`point-${idx}`}
          x={pos.x}
          y={pos.y}
          radius={basePointRadius}
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth={baseStrokeWidth}
        />
      );
      
      // Label without background - positioned closer to dot
      const labelOffset = basePointRadius + 4;
      elements.push(
        <Text
          key={`label-${idx}`}
          x={pos.x + labelOffset}
          y={pos.y - labelOffset}
          text={point.label}
          fontSize={baseFontSize}
          fontFamily="system-ui"
          fill="#fbbf24"
          fontStyle="bold"
          shadowColor="#1f2937"
          shadowBlur={2}
          shadowOffsetX={1}
          shadowOffsetY={1}
        />
      );
    });
    
    return <>{elements}</>;
  };

  // Debug log when lattice prop changes
  React.useEffect(() => {
    console.log('🎨 LatticeCanvas received new lattice prop:', {
      documentId: lattice?.documentId,
      latticeType: lattice?.latticeType,
      basis1: lattice?.meepLattice?.basis1,
      basis2: lattice?.meepLattice?.basis2,
    });
  }, [lattice]);
  
  // Debug log when store values change
  React.useEffect(() => {
    console.log('🏪 LatticeCanvas store values changed:', {
      currentBasis1,
      currentBasis2,
      currentLatticeType,
      canvasUpdateTrigger
    });
  }, [currentBasis1, currentBasis2, currentLatticeType, canvasUpdateTrigger]);
  
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center bg-gray-900"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        width={containerSize.width}
        height={containerSize.height}
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        ref={stageRef}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          const evt = e.evt;
          if (evt.button === 2 || evt.button === 0) {
            evt.preventDefault();
            setLastPointer(stageRef.current!.getPointerPosition()!);
            setIsPanning(true);
          }
        }}
        onMouseMove={(e) => {
          if (isPanning && lastPointer) {
            const abs = stageRef.current!.getPointerPosition()!;
            const dx = abs.x - lastPointer.x;
            const dy = abs.y - lastPointer.y;
            setPos({ x: pos.x + dx, y: pos.y + dy });
            setLastPointer(abs);
          }
        }}
        onMouseUp={() => {
          setIsPanning(false);
          setLastPointer(null);
        }}
        onMouseLeave={() => {
          setIsPanning(false);
          setLastPointer(null);
        }}
      >
        <Layer>
          {/* Background */}
          <Rect
            x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill="#181818"
          />
          
          {/* Coordinate system and grid */}
          {drawGrid()}
          
          {/* Unit cell tiling (drawn before Voronoi cells) */}
          {drawUnitTilesLattice()}
          
          {/* Voronoi cell tiling */}
          {drawVoronoiTiling()}
          
          {/* Voronoi cells (drawn before unit cell) */}
          {drawVoronoiCells()}
          
          {/* Unit cell outline and fill */}
          {drawUnitCell()}
          
          {/* Lattice points */}
          {drawLatticePoints()}
          
          {/* Lattice vectors (drawn last to be on top, but only if unit cell is not shown) */}
          {drawLatticeVectors()}
          
          {/* High symmetry points and paths (drawn last to always be on top) */}
          {drawHighSymmetryPoints()}
        </Layer>
      </Stage>
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur rounded-lg p-3 text-xs text-gray-300">
        <div className="space-y-1">
          <div>Scroll: Zoom in/out</div>
          <div>Click + Drag: Pan view</div>
          <div className="text-gray-500">Scale: {scale.toFixed(2)}x</div>
          <div className="text-gray-500">Mode: {spaceMode === 'real' ? 'Real Space' : 'k-Space'}</div>
          {normalizeMode && <div className="text-gray-500">Normalized</div>}
          {voronoiData && showVoronoiCell && (
            <div className="text-gray-500">
              Voronoi: {spaceMode === 'real' ? 'Wigner-Seitz' : `Brillouin (${voronoiData.brillouinZones?.length || 0} zones)`}
            </div>
          )}
          {showHighSymmetryPoints && spaceMode === 'reciprocal' && (
            <div className="text-gray-500">High Symmetry: {lattice.latticeType}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LatticeCanvas;
