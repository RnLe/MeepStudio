// --- Geometry-centre helpers -------------------------------------------------
import { Cylinder, Rectangle, Triangle } from "../types/canvasElementTypes";

export type Geometry = Cylinder | Rectangle | Triangle | { kind: string; pos: { x: number; y: number } };

export function calculateGeometryCenter(geom: any): { x: number; y: number } {
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
  return geom.center || calculateGeometryCenter(geom);
}
