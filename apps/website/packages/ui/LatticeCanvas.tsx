"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text, Arrow } from "react-konva";
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
          stroke="#3b82f6"
          strokeWidth={2}
          fill="#3b82f6"
        />
        <Text
          x={v1.x + 10}
          y={v1.y - 10}
          text="a₁"
          fontSize={14}
          fill="#3b82f6"
        />
        
        {/* Basis vector 2 */}
        <Arrow
          points={[0, 0, v2.x, v2.y]}
          stroke="#10b981"
          strokeWidth={2}
          fill="#10b981"
        />
        <Text
          x={v2.x + 10}
          y={v2.y - 10}
          text="a₂"
          fontSize={14}
          fill="#10b981"
        />
        
        {/* Origin */}
        <Circle
          x={0}
          y={0}
          radius={4}
          fill="#fff"
          stroke="#000"
          strokeWidth={1}
        />
      </>
    );
  };

  // Draw lattice points
  const drawLatticePoints = () => {
    if (!lattice?.meepLattice) return null;
    
    const { basis1, basis2, basis_size } = lattice.meepLattice;
    const scale = 100;
    const points: React.ReactNode[] = [];
    
    // Draw a grid of lattice points
    const n = 5; // Number of cells in each direction
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) {
        const x = (i * basis1.x + j * basis2.x) * basis_size.x * scale;
        const y = -(i * basis1.y + j * basis2.y) * basis_size.y * scale;
        
        points.push(
          <Circle
            key={`${i}-${j}`}
            x={x}
            y={y}
            radius={3}
            fill="#6b7280"
            opacity={0.8}
          />
        );
      }
    }
    
    return <>{points}</>;
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center bg-gray-800 w-full h-full overflow-hidden"
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
          if (evt.button === 2) {
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
        onMouseUp={(e) => {
          if (e.evt.button === 2) {
            setIsPanning(false);
            setLastPointer(null);
          }
        }}
      >
        <Layer>
          {/* Grid lines for reference */}
          <Line
            points={[-1000, 0, 1000, 0]}
            stroke="#374151"
            strokeWidth={1}
            opacity={0.5}
          />
          <Line
            points={[0, -1000, 0, 1000]}
            stroke="#374151"
            strokeWidth={1}
            opacity={0.5}
          />
          
          {/* Lattice points */}
          {drawLatticePoints()}
          
          {/* Lattice vectors */}
          {drawLatticeVectors()}
        </Layer>
      </Stage>
    </div>
  );
};

export default LatticeCanvas;
