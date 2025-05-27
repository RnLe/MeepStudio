"use client";

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Stage, Layer, Line, Circle, Text, Arrow, Rect, Group } from "react-konva";
import { Lattice } from "../types/meepProjectTypes";
import { useLatticeStore } from "../providers/LatticeStore";
import { useSpring, animated, config } from "@react-spring/konva";
import { getWasmModule } from "../utils/wasmLoader";

interface Props {
  lattice: Lattice;
  ghPages: boolean;
}

const LatticeCanvas: React.FC<Props> = ({ lattice, ghPages }) => {
  // --- Container Size and Resize Handling ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  // Get space mode from store
  const spaceMode = useLatticeStore((s) => s.spaceMode);
  const showLatticePoints = useLatticeStore((s) => s.showLatticePoints);
  const showUnitCell = useLatticeStore((s) => s.showUnitCell);
  const showUnitTilesLattice = useLatticeStore((s) => s.showUnitTilesLattice);
  const showGrid = useLatticeStore((s) => s.showGrid);
  const latticeScale = useLatticeStore((s) => s.latticeScale);
  const gridDensity = useLatticeStore((s) => s.gridDensity);
  const normalizeMode = useLatticeStore((s) => s.normalizeMode);
  const showBaseVectors = useLatticeStore((s) => s.showBaseVectors);
  
  // Get lattice point cache from store
  const latticePointCache = useLatticeStore((s) => s.latticePointCache);
  const setLatticePointCache = useLatticeStore((s) => s.setLatticePointCache);
  
  // Get Voronoi data from store (merged)
  const showVoronoiCell = useLatticeStore((s) => s.showVoronoiCell);
  const voronoiData = useLatticeStore((s) => s.voronoiData);
  const showVoronoiTiling = useLatticeStore((s) => s.showVoronoiTiling);
  
  // Get zone counts from store
  const realSpaceZoneCount = useLatticeStore((s) => s.realSpaceZoneCount);
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

  // Calculate normalization factor
  const getNormalizationFactor = useCallback(() => {
    if (!lattice?.meepLattice || !normalizeMode) return 1;
    
    const isRealSpace = spaceMode === 'real';
    let maxLength = 0;
    
    if (isRealSpace) {
      const v1 = lattice.meepLattice.basis1;
      const v2 = lattice.meepLattice.basis2;
      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y) * lattice.meepLattice.basis_size.x;
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y) * lattice.meepLattice.basis_size.y;
      maxLength = Math.max(len1, len2);
    } else {
      if (lattice.meepLattice.reciprocal_basis1 && lattice.meepLattice.reciprocal_basis2) {
        const v1 = lattice.meepLattice.reciprocal_basis1;
        const v2 = lattice.meepLattice.reciprocal_basis2;
        const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        maxLength = Math.max(len1, len2);
      }
    }
    
    return maxLength > 0 ? 1 / maxLength : 1;
  }, [lattice, spaceMode, normalizeMode]);

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

  // Animated vectors with spring
  const getVectorData = useCallback(() => {
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
  }, [lattice, spaceMode, latticeScale, normalizeMode, normalizationFactor]);

  const vectors = getVectorData();
  
  // Spring animations for vectors
  const vectorSpring = useSpring({
    v1x: vectors.v1.x,
    v1y: vectors.v1.y,
    v2x: vectors.v2.x,
    v2y: vectors.v2.y,
    config: config.gentle,
    onChange: () => {
      // Force re-render when spring values change to animate the arrows
      setPos(pos => ({ ...pos }));
    }
  });

  // --- Lattice visualization helpers ---
  const AnimatedArrow = animated(Arrow);
  const AnimatedText = animated(Text);
  const AnimatedLine = animated(Line);
  const AnimatedCircle = animated(Circle);

  const drawLatticeVectors = () => {
    /* draw arrows whenever showBaseVectors is true, even when the unit cell
       is visible, so they appear on top of the unit-cell outline */
    if (!lattice?.meepLattice || !showBaseVectors) return null;
    
    const isRealSpace = spaceMode === 'real';
    
    // Colors based on mode
    const v1Color = isRealSpace ? "#10b981" : "#60a5fa";
    const v2Color = isRealSpace ? "#f59e0b" : "#a78bfa";
    const v1Label = isRealSpace ? "a₁" : "b₁";
    const v2Label = isRealSpace ? "a₂" : "b₂";

    // Get current spring values for the arrows
    const v1x = vectorSpring.v1x.get();
    const v1y = vectorSpring.v1y.get();
    const v2x = vectorSpring.v2x.get();
    const v2y = vectorSpring.v2y.get();

    return (
      <>
        {/* Basis vector 1 */}
        <Arrow
          points={[0, 0, v1x, v1y]}
          stroke={v1Color}
          strokeWidth={3}
          fill={v1Color}
          pointerLength={10}
          pointerWidth={10}
        />
        <Text
          x={v1x + 15}
          y={v1y - 15}
          text={v1Label}
          fontSize={16}
          fontFamily="system-ui"
          fill={v1Color}
          fontStyle="bold"
        />
        
        {/* Basis vector 2 */}
        <Arrow
          points={[0, 0, v2x, v2y]}
          stroke={v2Color}
          strokeWidth={3}
          fill={v2Color}
          pointerLength={10}
          pointerWidth={10}
        />
        <Text
          x={v2x + 15}
          y={v2y - 15}
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

  // Load lattice points using WASM
  useEffect(() => {
    if (!lattice?.meepLattice || !showLatticePoints) return;
    
    const loadPoints = async () => {
      const startTime = performance.now();
      const wasm = await getWasmModule();
      
      const isRealSpace = spaceMode === 'real';
      const scale = latticeScale * (normalizeMode ? normalizationFactor : 1);
      
      // Get appropriate basis vectors
      const basis = isRealSpace ? {
        b1: {
          x: lattice.meepLattice.basis1.x * lattice.meepLattice.basis_size.x,
          y: lattice.meepLattice.basis1.y * lattice.meepLattice.basis_size.y
        },
        b2: {
          x: lattice.meepLattice.basis2.x * lattice.meepLattice.basis_size.x,
          y: lattice.meepLattice.basis2.y * lattice.meepLattice.basis_size.y
        }
      } : {
        b1: lattice.meepLattice.reciprocal_basis1 || { x: 0, y: 0 },
        b2: lattice.meepLattice.reciprocal_basis2 || { x: 0, y: 0 }
      };
      
      // Create cache key
      const cacheKey = `${basis.b1.x}-${basis.b1.y}-${basis.b2.x}-${basis.b2.y}-${gridDensity}`;
      
      // Check if we already have this in cache
      if (latticePointCache?.cacheKey === cacheKey) {
        return;
      }
      
      // Call Rust function to calculate square lattice points
      const result = wasm.calculate_square_lattice_points(
        basis.b1.x,
        basis.b1.y,
        basis.b2.x,
        basis.b2.y,
        gridDensity * 2 // target_count (will create roughly gridDensity x gridDensity points)
      );
      
      const endTime = performance.now();
      
      setLatticePointCache({
        points: result.points,
        maxDistance: result.max_distance,
        cacheKey,
        stats: {
          timeTaken: endTime - startTime,
          pointCount: result.points.length,
          maxDistance: result.max_distance
        }
      });
    };
    
    loadPoints();
  }, [lattice, spaceMode, showLatticePoints, gridDensity, latticeScale, normalizeMode, normalizationFactor, setLatticePointCache, latticePointCache?.cacheKey]);

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
      
      // Calculate opacity based on distance
      const distance = point.distance * scale;
      const opacity = Math.max(0.2, 1 - (distance / (maxDistance * 1.5)));
      
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
    
    // Get current spring values
    const v1x = vectorSpring.v1x.get();
    const v1y = vectorSpring.v1y.get();
    const v2x = vectorSpring.v2x.get();
    const v2y = vectorSpring.v2y.get();
    
    // Vector colors for the dashed lines
    const v1Color = isRealSpace ? "#10b981" : "#60a5fa";
    const v2Color = isRealSpace ? "#f59e0b" : "#a78bfa";
    const v1Label = isRealSpace ? "a₁" : "b₁";
    const v2Label = isRealSpace ? "a₂" : "b₂";
    
    return (
      <>
        {/* Unit cell fill (drawn first so it's behind everything) - only show if unit tiles are NOT active */}
        {!showUnitTilesLattice && (
          <Line
            points={[
              0, 0,
              v1x, v1y,
              v1x + v2x, v1y + v2y,
              v2x, v2y,
              0, 0
            ]}
            fill={fillColor}
            closed
            strokeWidth={0}
          />
        )}
        
        {/* No dashed basis lines / labels when base vectors are hidden */}
        
        {/* Unit cell outline - only show if unit tiles are NOT active */}
        {!showUnitTilesLattice && (
          <Line
            points={[
              0, 0,
              v1x, v1y,
              v1x + v2x, v1y + v2y,
              v2x, v2y,
              0, 0
            ]}
            stroke={strokeColor}
            strokeWidth={2}
            dash={[5, 5]}
            opacity={0.5}
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
    
    // Get current spring values for the unit cell shape
    const v1x = vectorSpring.v1x.get();
    const v1y = vectorSpring.v1y.get();
    const v2x = vectorSpring.v2x.get();
    const v2y = vectorSpring.v2y.get();
    
    const tiles: React.ReactNode[] = [];
    
    // Draw a unit cell at each lattice point
    latticePointCache.points.forEach((point: { x: number; y: number; i: number; j: number; distance: number }, idx: number) => {
      const px = point.x * scale;
      const py = -point.y * scale; // Flip y for canvas coordinate system
      
      // Calculate opacity based on distance (similar to lattice points)
      const distance = point.distance * scale;
      const maxDistance = latticePointCache.maxDistance * scale;
      const opacity = Math.max(0.1, 0.8 - (distance / (maxDistance * 1.5)));
      
      tiles.push(
        <Line
          key={`tile-${point.i}-${point.j}-${idx}`}
          points={[
            px, py,
            px + v1x, py + v1y,
            px + v1x + v2x, py + v1y + v2y,
            px + v2x, py + v2y,
            px, py
          ]}
          stroke={strokeColor}
          strokeWidth={1}
          fill={fillColor}
          closed
          opacity={opacity}
          // dash={[3, 3]} // Removed - now using solid lines
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
    
    // Draw a voronoi cell at each lattice point
    latticePointCache.points.forEach((point: { x: number; y: number; i: number; j: number; distance: number }, idx: number) => {
      const px = point.x * scale;
      const py = -point.y * scale; // Flip y for canvas coordinate system
      
      // Calculate opacity based on distance (similar to unit cell tiling)
      const distance = point.distance * scale;
      const maxDistance = latticePointCache.maxDistance * scale;
      const opacity = Math.max(0.1, 0.8 - (distance / (maxDistance * 1.5)));
      
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-900 relative"
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
        </div>
      </div>
    </div>
  );
};

export default LatticeCanvas;
