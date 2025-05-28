// --- Geometry-centre helpers -------------------------------------------------
import { Cylinder, Rectangle, Triangle } from "../types/canvasElementTypes";

export type Geometry = Cylinder | Rectangle | Triangle | { kind: string; pos: { x: number; y: number } };

export function getGeometryCenter(g: Geometry): { x: number; y: number } {
  switch (g.kind) {
    case "rectangle": {
      // rectangles already store their centre as pos
      return { x: g.pos.x, y: g.pos.y };
    }
    case "cylinder": {
      // cylinders are stored by centre + radius
      return { x: g.pos.x, y: g.pos.y };
    }
    case "triangle": {
      // triangles are stored by anchor (pos) + relative vertices
      return { x: g.pos.x, y: g.pos.y };
    }
    default:
      // fallback – assume we have pos
      return { x: g.pos.x, y: g.pos.y };
  }
}
