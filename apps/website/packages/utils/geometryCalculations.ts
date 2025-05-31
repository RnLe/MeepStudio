// --- Geometry-centre helpers -------------------------------------------------
import { Cylinder, Rectangle, Triangle } from "../types/canvasElementTypes";

export type Geometry = Cylinder | Rectangle | Triangle | { kind: string; pos: { x: number; y: number } };

export function calculateGeometryCenter(geom: any): { x: number; y: number } {
  // Guard against null/undefined
  if (!geom) {
    return { x: 0, y: 0 };
  }
  
  // For geometries with pos property, use it directly
  if (geom.pos) {
    return { x: geom.pos.x, y: geom.pos.y };
  }
  
  // Fallback for geometries without pos (legacy support)
  if (geom.x !== undefined && geom.y !== undefined) {
    return { x: geom.x, y: geom.y };
  }
  
  // Default center
  return { x: 0, y: 0 };
}

// Update the existing getGeometryCenter to use calculateGeometryCenter
export function getGeometryCenter(geom: any): { x: number; y: number } {
  // Guard against null/undefined
  if (!geom) {
    return { x: 0, y: 0 };
  }
  
  // 1. if a valid centre is already stored – use it
  if (geom.center && typeof geom.center.x === "number" && typeof geom.center.y === "number") {
    return geom.center;
  }

  // 2. lattices (and many other element types) can safely use their `pos`
  if (geom.pos && typeof geom.pos.x === "number" && typeof geom.pos.y === "number") {
    return geom.pos;
  }

  // 3. fall back to geometry-specific calculation (cylinders, rectangles, …)
  return calculateGeometryCenter(geom);
}
