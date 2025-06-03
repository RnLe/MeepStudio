import { CanvasElement } from '../../types/canvasElementTypes';
import { useCanvasStore } from '../../providers/CanvasStore';

export class SelectionController {
  static handleSelection(
    element: CanvasElement,
    evt: any,
    onSelect: (id: string | null, opts?: { shift?: boolean }) => void
  ) {
    const shift = evt.evt.shiftKey || evt.evt.ctrlKey || evt.evt.metaKey;
    
    // Don't select if element is locked
    if (element.locked) return;
    
    onSelect(element.id, { shift });
  }

  static isSelected(element: CanvasElement, selectedIds: string[]): boolean {
    return selectedIds.includes(element.id);
  }

  static handleBoxSelection(
    selBox: { x: number; y: number; width: number; height: number },
    elements: CanvasElement[],
    GRID_PX: number
  ): string[] {
    const box = {
      x: selBox.x / GRID_PX,
      y: selBox.y / GRID_PX,
      width: selBox.width / GRID_PX,
      height: selBox.height / GRID_PX,
    };

    return elements.filter(elem => {
      if (elem.invisible) return false;
      
      switch (elem.type) {
        case 'rectangle':
          return this.rectIntersectsBox(elem, box);
        case 'cylinder':
          return this.circleIntersectsBox(elem, box);
        case 'triangle':
          return this.triangleIntersectsBox(elem, box);
        case 'continuousSource':
        case 'gaussianSource':
        case 'eigenModeSource':
        case 'gaussianBeamSource':
          return this.pointInBox(elem.pos, box);
        case 'lattice':
          return this.pointInBox(elem.pos, box);
        case 'pmlBoundary':
          // Boundaries are handled differently - they don't have a position
          return false;
        default:
          return false;
      }
    }).map(elem => elem.id);
  }

  private static rectIntersectsBox(
    rect: any,
    box: { x: number; y: number; width: number; height: number }
  ): boolean {
    const rx = rect.pos.x - rect.width / 2;
    const ry = rect.pos.y - rect.height / 2;
    return (
      rx < box.x + box.width &&
      rx + rect.width > box.x &&
      ry < box.y + box.height &&
      ry + rect.height > box.y
    );
  }

  private static circleIntersectsBox(
    circle: any,
    box: { x: number; y: number; width: number; height: number }
  ): boolean {
    const closestX = Math.max(box.x, Math.min(circle.pos.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(circle.pos.y, box.y + box.height));
    const dx = circle.pos.x - closestX;
    const dy = circle.pos.y - closestY;
    return (dx * dx + dy * dy) <= circle.radius * circle.radius;
  }

  private static triangleIntersectsBox(
    triangle: any,
    box: { x: number; y: number; width: number; height: number }
  ): boolean {
    // Convert relative vertices to absolute
    const absVerts = triangle.vertices.map((v: any) => ({
      x: triangle.pos.x + v.x,
      y: triangle.pos.y + v.y
    }));

    // Check if any vertex is in the box
    for (const v of absVerts) {
      if (this.pointInBox(v, box)) return true;
    }

    // Check if box corners are in triangle
    const boxCorners = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x + box.width, y: box.y + box.height },
      { x: box.x, y: box.y + box.height }
    ];

    for (const corner of boxCorners) {
      if (this.pointInTriangle(corner, absVerts[0], absVerts[1], absVerts[2])) {
        return true;
      }
    }

    // Check edge intersections
    return this.triangleEdgesIntersectBox(absVerts, box);
  }

  private static pointInBox(
    point: { x: number; y: number },
    box: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      point.x >= box.x &&
      point.x <= box.x + box.width &&
      point.y >= box.y &&
      point.y <= box.y + box.height
    );
  }

  private static pointInTriangle(
    p: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ): boolean {
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

  private static triangleEdgesIntersectBox(
    verts: { x: number; y: number }[],
    box: { x: number; y: number; width: number; height: number }
  ): boolean {
    // Implementation of edge intersection check
    // Simplified for brevity - would check if triangle edges cross box edges
    return false;
  }
}
