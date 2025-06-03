import { KonvaEventObject } from 'konva/lib/Node';
import { CanvasElement } from '../../types/canvasElementTypes';
import { SnapController } from './SnapController';
import { useCanvasStore } from '../../providers/CanvasStore';

interface DragControllerConfig {
  element: CanvasElement;
  selectedIds: string[];
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onCommit: (id: string, updates: Partial<CanvasElement>) => void;
  GRID_PX: number;
  onSetActiveInstructionSet?: (set: string) => void;
}

export class DragController {
  private config: DragControllerConfig;
  private snapController: SnapController;
  private multiDragAnchor: any = null;
  private overlayManager: OverlayManager;

  constructor(config: DragControllerConfig) {
    this.config = config;
    this.snapController = new SnapController(config.GRID_PX);
    this.overlayManager = new OverlayManager();
  }

  handleDragStart = (e: KonvaEventObject<DragEvent>) => {
    const { element, selectedIds } = this.config;
    const isMultiDrag = selectedIds.length > 1 && selectedIds.includes(element.id);
    
    // Update instruction set
    this.config.onSetActiveInstructionSet?.('dragging');
    
    // Initialize overlay management
    this.overlayManager.captureInitialState();
    
    if (isMultiDrag) {
      this.initializeMultiDrag(e);
    }
  };

  handleDragMove = (e: KonvaEventObject<DragEvent>, resolution?: number) => {
    const shift = e.evt.shiftKey;
    const ctrl = e.evt.ctrlKey || e.evt.metaKey;
    
    // Update overlays based on modifiers
    this.overlayManager.updateOverlays(shift, ctrl);
    
    // Get snapped position
    const pos = e.target.position();
    const snapped = this.snapController.snapPosition(
      { x: pos.x / this.config.GRID_PX, y: pos.y / this.config.GRID_PX },
      shift,
      ctrl,
      resolution
    );
    
    // Update position
    e.target.position({ 
      x: snapped.x * this.config.GRID_PX, 
      y: snapped.y * this.config.GRID_PX 
    });
    
    if (this.multiDragAnchor) {
      this.handleMultiDragMove(snapped);
    } else {
      this.config.onUpdate(this.config.element.id, { pos: snapped });
    }
  };

  handleDragEnd = (e: KonvaEventObject<DragEvent>, resolution?: number) => {
    const shift = e.evt.shiftKey;
    const ctrl = e.evt.ctrlKey || e.evt.metaKey;
    
    // Final position
    const pos = e.target.position();
    const snapped = this.snapController.snapPosition(
      { x: pos.x / this.config.GRID_PX, y: pos.y / this.config.GRID_PX },
      shift,
      ctrl,
      resolution
    );
    
    // Commit changes
    if (this.multiDragAnchor) {
      this.commitMultiDrag(snapped);
    } else {
      this.config.onCommit(this.config.element.id, { pos: snapped });
    }
    
    // Restore overlays and instruction set
    this.overlayManager.restoreOverlays();
    this.config.onSetActiveInstructionSet?.('default');
    
    // Cleanup
    this.multiDragAnchor = null;
  };

  private initializeMultiDrag(e: KonvaEventObject<DragEvent>) {
    const { getAllElements } = useCanvasStore.getState();
    const allElements = getAllElements();
    
    this.multiDragAnchor = {
      id: this.config.element.id,
      anchor: e.target.position(),
      initialPositions: this.config.selectedIds.reduce((acc, id) => {
        const elem = allElements.find(e => e.id === id);
        if (elem) acc[id] = { ...elem.pos };
        return acc;
      }, {} as Record<string, { x: number; y: number }>)
    };
  }

  private handleMultiDragMove(anchorPos: { x: number; y: number }) {
    const delta = {
      x: anchorPos.x - this.multiDragAnchor.anchor.x / this.config.GRID_PX,
      y: anchorPos.y - this.multiDragAnchor.anchor.y / this.config.GRID_PX
    };
    
    this.config.selectedIds.forEach(id => {
      const initial = this.multiDragAnchor.initialPositions[id];
      if (initial) {
        const newPos = {
          x: initial.x + delta.x,
          y: initial.y + delta.y
        };
        this.config.onUpdate(id, { pos: newPos });
      }
    });
  }

  private commitMultiDrag(anchorPos: { x: number; y: number }) {
    const delta = {
      x: anchorPos.x - this.multiDragAnchor.anchor.x / this.config.GRID_PX,
      y: anchorPos.y - this.multiDragAnchor.anchor.y / this.config.GRID_PX
    };
    
    this.config.selectedIds.forEach(id => {
      const initial = this.multiDragAnchor.initialPositions[id];
      if (initial) {
        const newPos = {
          x: initial.x + delta.x,
          y: initial.y + delta.y
        };
        this.config.onCommit(id, { pos: newPos });
      }
    });
  }
}

// Overlay management helper
class OverlayManager {
  private initial: { grid: boolean; resolution: boolean } | null = null;
  private current: { grid: boolean; resolution: boolean } | null = null;

  captureInitialState() {
    const { showGrid, showResolutionOverlay } = useCanvasStore.getState();
    this.initial = { grid: showGrid, resolution: showResolutionOverlay };
    this.current = { ...this.initial };
  }

  updateOverlays(shift: boolean, ctrl: boolean) {
    if (!this.initial || !this.current) return;
    
    const { toggleShowGrid, toggleShowResolutionOverlay } = useCanvasStore.getState();
    
    // Grid overlay
    if (shift && !this.current.grid) {
      toggleShowGrid();
      this.current.grid = true;
    } else if (!shift && this.current.grid && !this.initial.grid) {
      toggleShowGrid();
      this.current.grid = false;
    }
    
    // Resolution overlay
    if (ctrl && !this.current.resolution) {
      toggleShowResolutionOverlay();
      this.current.resolution = true;
    } else if (!ctrl && this.current.resolution && !this.initial.resolution) {
      toggleShowResolutionOverlay();
      this.current.resolution = false;
    }
  }

  restoreOverlays() {
    if (!this.initial || !this.current) return;
    
    const { toggleShowGrid, toggleShowResolutionOverlay } = useCanvasStore.getState();
    
    if (this.current.grid !== this.initial.grid) {
      toggleShowGrid();
    }
    if (this.current.resolution !== this.initial.resolution) {
      toggleShowResolutionOverlay();
    }
    
    this.initial = null;
    this.current = null;
  }
}
