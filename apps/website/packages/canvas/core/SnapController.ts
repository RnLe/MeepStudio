import { useCanvasStore } from '../../providers/CanvasStore';

export class SnapController {
  private GRID_PX: number;

  constructor(GRID_PX: number) {
    this.GRID_PX = GRID_PX;
  }

  snapPosition(
    pos: { x: number; y: number },
    forceGrid: boolean,
    forceResolution: boolean,
    resolution?: number
  ): { x: number; y: number } {
    const store = useCanvasStore.getState();
    const { gridSnapping, resolutionSnapping } = store;
    
    return {
      x: this.snapValue(pos.x, forceGrid, forceResolution, gridSnapping, resolutionSnapping, resolution),
      y: this.snapValue(pos.y, forceGrid, forceResolution, gridSnapping, resolutionSnapping, resolution)
    };
  }

  private snapValue(
    value: number,
    forceGrid: boolean,
    forceResolution: boolean,
    gridSnapping: boolean,
    resolutionSnapping: boolean,
    resolution?: number
  ): number {
    // Force resolution snapping (Ctrl)
    if (forceResolution && resolution && resolution > 1) {
      const cellSize = 1 / resolution;
      return Math.round(value / cellSize) * cellSize;
    }
    
    // Force grid snapping (Shift)
    if (forceGrid) {
      return Math.round(value);
    }
    
    // Normal snapping based on settings
    if (resolutionSnapping && resolution && resolution > 1) {
      const cellSize = 1 / resolution;
      return Math.round(value / cellSize) * cellSize;
    }
    
    if (gridSnapping) {
      return Math.round(value);
    }
    
    return value;
  }
}
