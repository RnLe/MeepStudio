import React from 'react';
import { Circle, Line, Rect, Shape } from 'react-konva';
import { CanvasLatticeElement } from '../../types/meepLatticeTypes';
import { useCanvasStore } from '../../stores/canvas';
import { useMaterialColorStore } from '../../providers/MaterialColorStore';
import { MaterialCatalog } from '../../constants/meepMaterialPresets';

interface LatticeRendererProps {
  lattice: { id: string; pos: { x: number; y: number } };
  isSelected: boolean;
  scale: number;
  GRID_PX: number;
}

export const LatticeRenderer: React.FC<LatticeRendererProps> = ({
  lattice,
  isSelected,
  scale,
  GRID_PX,
}) => {
  // Get the full lattice data from the store
  const lattices = useCanvasStore((s) => s.lattices);
  const fullLattice = lattices.find(l => l.id === lattice.id) as CanvasLatticeElement | undefined;
  
  if (!fullLattice) return null;
  
  const { geometries, showXRayMode, getElementColorVisibility, getElementXRayTransparency } = useCanvasStore(s => ({
    geometries: s.geometries,
    showXRayMode: s.showXRayMode,
    getElementColorVisibility: s.getElementColorVisibility,
    getElementXRayTransparency: s.getElementXRayTransparency,
  }));
  
  const { getMaterialColor } = useMaterialColorStore();
  
  // Get tied geometry
  const tiedGeometry = fullLattice.tiedGeometryId 
    ? geometries.find(g => g.id === fullLattice.tiedGeometryId)
    : null;

  // Build lattice points
  let points: { x: number; y: number }[] = [];
  
  if (fullLattice.fillMode === 'centerFill' && fullLattice.calculatedPoints) {
    // Use WASM-calculated points
    points = fullLattice.calculatedPoints.map((p: any) => ({
      x: p.x,
      y: p.y
    }));
  } else {
    // Use manual multiplier-based points
    const mult = fullLattice.multiplier ?? 3;
    for (let i = -mult; i <= mult; i++) {
      for (let j = -mult; j <= mult; j++) {
        points.push({
          x: i * fullLattice.basis1.x + j * fullLattice.basis2.x,
          y: i * fullLattice.basis1.y + j * fullLattice.basis2.y,
        });
      }
    }
  }

  // Helper to get material color
  const getMaterialColorForGeometry = React.useCallback((geom: any): string => {
    const showGeometryColors = getElementColorVisibility('geometries');
    const geometryTransparency = getElementXRayTransparency('geometries');
    
    if (!showGeometryColors) {
      return showXRayMode ? `rgba(64, 64, 64, ${geometryTransparency})` : "rgba(64, 64, 64, 1)";
    }
    
    const materialKey = geom.material;
    if (!materialKey) {
      return showXRayMode ? `rgba(128, 128, 128, ${geometryTransparency})` : "rgba(128, 128, 128, 1)";
    }
    
    const customColor = getMaterialColor(materialKey);
    const color = customColor || MaterialCatalog[materialKey as keyof typeof MaterialCatalog]?.color;
    
    if (color) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const opacity = showXRayMode ? geometryTransparency : 1;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return showXRayMode ? `rgba(128, 128, 128, ${geometryTransparency})` : "rgba(128, 128, 128, 1)";
  }, [showXRayMode, getElementColorVisibility, getElementXRayTransparency, getMaterialColor]);

  return (
    <>
      {/* Basis vectors when selected */}
      {isSelected && (
        <>
          <Line
            points={[0, 0, fullLattice.basis1.x * GRID_PX, fullLattice.basis1.y * GRID_PX]}
            stroke="#3b82f6"
            strokeWidth={2}
          />
          <Line
            points={[0, 0, fullLattice.basis2.x * GRID_PX, fullLattice.basis2.y * GRID_PX]}
            stroke="#10b981"
            strokeWidth={2}
          />
        </>
      )}

      {/* Lattice points/copies */}
      {points.map((p, idx) => {
        if (fullLattice.showMode === "geometry" && tiedGeometry) {
          const fill = getMaterialColorForGeometry(tiedGeometry);
          const opacity = showXRayMode ? getElementXRayTransparency("geometries") : 1;

          if (tiedGeometry.kind === "cylinder") {
            return (
              <Circle
                key={idx}
                x={p.x * GRID_PX}
                y={p.y * GRID_PX}
                radius={tiedGeometry.radius * GRID_PX}
                fill={fill}
                opacity={opacity}
              />
            );
          }
          if (tiedGeometry.kind === "rectangle") {
            return (
              <Rect
                key={idx}
                x={p.x * GRID_PX}
                y={p.y * GRID_PX}
                width={tiedGeometry.width * GRID_PX}
                height={tiedGeometry.height * GRID_PX}
                offsetX={(tiedGeometry.width * GRID_PX) / 2}
                offsetY={(tiedGeometry.height * GRID_PX) / 2}
                rotation={(tiedGeometry.orientation || 0) * 180 / Math.PI}
                fill={fill}
                opacity={opacity}
              />
            );
          }
          if (tiedGeometry.kind === "triangle") {
            return (
              <Shape
                key={idx}
                x={p.x * GRID_PX}
                y={p.y * GRID_PX}
                rotation={(tiedGeometry.orientation || 0) * 180 / Math.PI}
                fill={fill}
                opacity={opacity}
                sceneFunc={(ctx, shape) => {
                  ctx.beginPath();
                  tiedGeometry.vertices.forEach((v: any, i: number) => {
                    const X = v.x * GRID_PX;
                    const Y = v.y * GRID_PX;
                    i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
                  });
                  ctx.closePath();
                  ctx.fillStrokeShape(shape);
                }}
              />
            );
          }
        }

        // Default lattice point
        return (
          <Circle
            key={idx}
            x={p.x * GRID_PX}
            y={p.y * GRID_PX}
            radius={4 / scale}
            fill={isSelected ? "#3b82f6" : "#666"}
            opacity={showXRayMode ? getElementXRayTransparency("geometries") : 0.8}
          />
        );
      })}

      {/* Origin marker */}
      <Circle
        x={0}
        y={0}
        radius={6 / scale}
        fill={isSelected ? "#f59e0b" : "#888"}
        stroke={isSelected ? "#f59e0b" : "#666"}
        strokeWidth={1 / scale}
      />
    </>
  );
};
