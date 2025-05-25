"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text, Arrow, Rect, Group } from "react-konva";
import { Lattice } from "../types/meepProjectTypes";

interface Props {
  lattice: Lattice;
  ghPages: boolean;
}

const LatticeCanvas: React.FC<Props> = ({ lattice, ghPages }) => {
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

  // --- Lattice visualization helpers ---
  const drawLatticeVectors = () => {
    if (!lattice?.meepLattice) return null;
    
    const { basis1, basis2, basis_size } = lattice.meepLattice;
    const scale = 100; // Display scale factor
    
    // Scale the vectors by basis_size
    const v1 = {
      x: basis1.x * basis_size.x * scale,
      y: -basis1.y * basis_size.y * scale // Flip Y for canvas coordinates
    };
    const v2 = {
      x: basis2.x * basis_size.x * scale,
      y: -basis2.y * basis_size.y * scale
    };

    return (
      <>
        {/* Basis vector 1 */}
        <Arrow
          points={[0, 0, v1.x, v1.y]}
          stroke="#10b981"
          strokeWidth={3}
          fill="#10b981"
          pointerLength={10}
          pointerWidth={10}
        />
        <Text
          x={v1.x + 15}
          y={v1.y - 15}
          text="a₁"
          fontSize={16}
          fontFamily="system-ui"
          fill="#10b981"
          fontStyle="bold"
        />
        
        {/* Basis vector 2 */}
        <Arrow
          points={[0, 0, v2.x, v2.y]}
          stroke="#f59e0b"
          strokeWidth={3}
          fill="#f59e0b"
          pointerLength={10}
          pointerWidth={10}
        />
        <Text
          x={v2.x + 15}
          y={v2.y - 15}
          text="a₂"
          fontSize={16}
          fontFamily="system-ui"
          fill="#f59e0b"
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

  // Draw lattice points with better styling
  const drawLatticePoints = () => {
    if (!lattice?.meepLattice) return null;
    
    const { basis1, basis2, basis_size } = lattice.meepLattice;
    const scale = 100;
    const points: React.ReactNode[] = [];
    
    // Draw a grid of lattice points
    const n = 8; // Number of cells in each direction
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) {
        const x = (i * basis1.x + j * basis2.x) * basis_size.x * scale;
        const y = -(i * basis1.y + j * basis2.y) * basis_size.y * scale;
        
        // Fade points further from origin
        const distance = Math.sqrt(x * x + y * y);
        const maxDistance = n * scale * 1.5;
        const opacity = Math.max(0.2, 1 - (distance / maxDistance));
        
        points.push(
          <Circle
            key={`${i}-${j}`}
            x={x}
            y={y}
            radius={4}
            fill="#60a5fa"
            opacity={opacity}
            strokeWidth={1}
            stroke="#1e40af"
          />
        );
      }
    }
    
    return <>{points}</>;
  };

  // Draw unit cell outline
  const drawUnitCell = () => {
    if (!lattice?.meepLattice) return null;
    
    const { basis1, basis2, basis_size } = lattice.meepLattice;
    const scale = 100;
    
    const v1 = {
      x: basis1.x * basis_size.x * scale,
      y: -basis1.y * basis_size.y * scale
    };
    const v2 = {
      x: basis2.x * basis_size.x * scale,
      y: -basis2.y * basis_size.y * scale
    };
    
    return (
      <Line
        points={[
          0, 0,
          v1.x, v1.y,
          v1.x + v2.x, v1.y + v2.y,
          v2.x, v2.y,
          0, 0
        ]}
        stroke="#94a3b8"
        strokeWidth={2}
        dash={[5, 5]}
        opacity={0.5}
      />
    );
  };

  // Draw coordinate system
  const drawCoordinateSystem = () => {
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

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center bg-gray-900 w-full h-full overflow-hidden"
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
            fill="#111827"
          />
          
          {/* Coordinate system and grid */}
          {drawCoordinateSystem()}
          
          {/* Unit cell outline */}
          {drawUnitCell()}
          
          {/* Lattice points */}
          {drawLatticePoints()}
          
          {/* Lattice vectors (drawn last to be on top) */}
          {drawLatticeVectors()}
        </Layer>
      </Stage>
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur rounded-lg p-3 text-xs text-gray-300">
        <div className="space-y-1">
          <div>Scroll: Zoom in/out</div>
          <div>Click + Drag: Pan view</div>
          <div className="text-gray-500">Scale: {scale.toFixed(2)}x</div>
        </div>
      </div>
    </div>
  );
};

export default LatticeCanvas;
