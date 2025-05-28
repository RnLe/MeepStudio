import React from "react";
import { Rect, Group, Path, Circle, Line } from "react-konva";
import { Rectangle as RectEl } from "../types/canvasElementTypes";

interface ResizeHandlesProps {
  rectangle: RectEl;
  GRID_PX: number;
  onResize: (updates: Partial<RectEl>) => void;
  onResizeEnd: (updates: Partial<RectEl>) => void;
  snapToGrid: (value: number, forceGrid?: boolean, forceResolution?: boolean) => number;
  scale: number;
  gridSnapping: boolean;
  resolutionSnapping: boolean;
  showGrid: boolean;
  showResolutionOverlay: boolean;
  toggleShowGrid: () => void;
  toggleShowResolutionOverlay: () => void;
}

export function ResizeHandles({ 
  rectangle, 
  GRID_PX, 
  onResize, 
  onResizeEnd,
  snapToGrid,
  scale,
  gridSnapping,
  resolutionSnapping,
  showGrid,
  showResolutionOverlay,
  toggleShowGrid,
  toggleShowResolutionOverlay
}: ResizeHandlesProps) {
  const handleSize = 9 / scale; // Reduced by half from 18
  const edgeWidth = 6 / scale;
  const strokeWidth = 0.5 / scale;
  const cornerRadius = 1 / scale;
  
  // State to track if we temporarily enabled overlays
  const [tempShowGrid, setTempShowGrid] = React.useState(false);
  const [tempShowResolution, setTempShowResolution] = React.useState(false);
  
  // State to track rotation offset
  const [rotationOffset, setRotationOffset] = React.useState<number | null>(null);
  
  // Calculate rectangle bounds in canvas coordinates
  const left = (rectangle.pos.x - rectangle.width / 2) * GRID_PX;
  const right = (rectangle.pos.x + rectangle.width / 2) * GRID_PX;
  const top = (rectangle.pos.y - rectangle.height / 2) * GRID_PX;
  const bottom = (rectangle.pos.y + rectangle.height / 2) * GRID_PX;
  
  // Corner handles
  const corners = [
    { name: 'nw', x: left, y: top, cursor: 'nw-resize' },
    { name: 'ne', x: right, y: top, cursor: 'ne-resize' },
    { name: 'sw', x: left, y: bottom, cursor: 'sw-resize' },
    { name: 'se', x: right, y: bottom, cursor: 'se-resize' },
  ];
  
  // Edge handles
  const edges = [
    { name: 'n', x: (left + right) / 2, y: top, width: right - left, height: edgeWidth, cursor: 'n-resize' },
    { name: 's', x: (left + right) / 2, y: bottom, width: right - left, height: edgeWidth, cursor: 's-resize' },
    { name: 'w', x: left, y: (top + bottom) / 2, width: edgeWidth, height: bottom - top, cursor: 'w-resize' },
    { name: 'e', x: right, y: (top + bottom) / 2, width: edgeWidth, height: bottom - top, cursor: 'e-resize' },
  ];
  
  // Enhanced snap function that considers shift/ctrl keys
  const snapWithModifiers = React.useCallback((value: number, evt: any) => {
    const shiftPressed = evt.evt.shiftKey;
    const ctrlPressed = evt.evt.ctrlKey || evt.evt.metaKey;
    
    // Force grid or resolution snapping based on keys
    return snapToGrid(value, shiftPressed, ctrlPressed);
  }, [snapToGrid]);
  
  const handleDragStart = (evt: any) => {
    const shiftPressed = evt.evt.shiftKey;
    const ctrlPressed = evt.evt.ctrlKey || evt.evt.metaKey;
    
    // Show grid overlay if shift is pressed and grid is hidden
    if (shiftPressed && !showGrid) {
      toggleShowGrid();
      setTempShowGrid(true);
    }
    
    // Show resolution overlay if ctrl is pressed and resolution is hidden
    if (ctrlPressed && !showResolutionOverlay) {
      toggleShowResolutionOverlay();
      setTempShowResolution(true);
    }
  };
  
  const handleDragMove = (evt: any) => {
    const shiftPressed = evt.evt.shiftKey;
    const ctrlPressed = evt.evt.ctrlKey || evt.evt.metaKey;
    
    // Update overlays based on current key state
    if (shiftPressed && !showGrid && !tempShowGrid) {
      toggleShowGrid();
      setTempShowGrid(true);
    } else if (!shiftPressed && tempShowGrid) {
      toggleShowGrid();
      setTempShowGrid(false);
    }
    
    if (ctrlPressed && !showResolutionOverlay && !tempShowResolution) {
      toggleShowResolutionOverlay();
      setTempShowResolution(true);
    } else if (!ctrlPressed && tempShowResolution) {
      toggleShowResolutionOverlay();
      setTempShowResolution(false);
    }
  };
  
  const handleDragEnd = (evt: any) => {
    // Restore overlay states
    if (tempShowGrid) {
      toggleShowGrid();
      setTempShowGrid(false);
    }
    if (tempShowResolution) {
      toggleShowResolutionOverlay();
      setTempShowResolution(false);
    }
    
    // Call the original onResizeEnd
    onResizeEnd({
      pos: rectangle.pos,
      width: rectangle.width,
      height: rectangle.height
    });
  };
  
  const handleCornerDrag = (cornerName: string) => (e: any) => {
    handleDragMove(e);

    // ----- use handle centre instead of top-left -----
    const node = e.target;
    const centreX = node.x() + node.width()  / 2;
    const centreY = node.y() + node.height() / 2;

    // Convert to lattice units
    const x = centreX / GRID_PX;
    const y = centreY / GRID_PX;

    // Snap with modifiers
    const snappedX = snapWithModifiers(x, e);
    const snappedY = snapWithModifiers(y, e);
    
    // Calculate new dimensions based on which corner is being dragged
    let newLeft = (rectangle.pos.x - rectangle.width / 2);
    let newRight = (rectangle.pos.x + rectangle.width / 2);
    let newTop = (rectangle.pos.y - rectangle.height / 2);
    let newBottom = (rectangle.pos.y + rectangle.height / 2);
    
    switch (cornerName) {
      case 'nw':
        newLeft = snappedX;
        newTop = snappedY;
        break;
      case 'ne':
        newRight = snappedX;
        newTop = snappedY;
        break;
      case 'sw':
        newLeft = snappedX;
        newBottom = snappedY;
        break;
      case 'se':
        newRight = snappedX;
        newBottom = snappedY;
        break;
    }
    
    // Ensure minimum size
    if (newRight - newLeft < 0.1) return;
    if (newBottom - newTop < 0.1) return;
    
    const newWidth = newRight - newLeft;
    const newHeight = newBottom - newTop;
    const newPosX = (newLeft + newRight) / 2;
    const newPosY = (newTop + newBottom) / 2;
    
    // Update the rectangle
    onResize({
      pos: { x: newPosX, y: newPosY },
      width: newWidth,
      height: newHeight
    });

    // ----- move handle so its *top-left* matches the snapped centre -----
    node.x(snappedX * GRID_PX - node.width()  / 2);
    node.y(snappedY * GRID_PX - node.height() / 2);
  };
  
  const handleEdgeDrag = (edgeName: string) => (e: any) => {
    handleDragMove(e);

    const node = e.target;
    const centreX = node.x() + node.width()  / 2;
    const centreY = node.y() + node.height() / 2;

    // Convert to lattice units
    const x = centreX / GRID_PX;
    const y = centreY / GRID_PX;

    // Snap with modifiers
    const snappedX = snapWithModifiers(x, e);
    const snappedY = snapWithModifiers(y, e);
    
    let newLeft = rectangle.pos.x - rectangle.width  / 2;
    let newRight = rectangle.pos.x + rectangle.width / 2;
    let newTop  = rectangle.pos.y - rectangle.height / 2;
    let newBottom = rectangle.pos.y + rectangle.height / 2;

    switch (edgeName) {
      case 'n':
        newTop = snappedY;
        break;
      case 's':
        newBottom = snappedY;
        break;
      case 'w':
        newLeft = snappedX;
        break;
      case 'e':
        newRight = snappedX;
        break;
    }

    // Ensure minimum size
    if (newRight - newLeft < 0.1 || newBottom - newTop < 0.1) return;

    const newWidth  = newRight - newLeft;
    const newHeight = newBottom - newTop;
    const newPosX   = (newLeft + newRight) / 2;
    const newPosY   = (newTop  + newBottom) / 2;

    onResize({
      pos: { x: newPosX, y: newPosY },
      width: newWidth,
      height: newHeight
    });

    // ----- keep the dragged handle anchored to snapped position -----
    node.x(snappedX * GRID_PX - node.width()  / 2);
    node.y(snappedY * GRID_PX - node.height() / 2);
  };
  
  /* ---------- rotation-handle helpers ------------------------------------ */
  const deg = rectangle.rotation ?? 0;
  const rad = (deg * Math.PI) / 180;

  // constant screen-pixel offset converted to stage units
  const pixelOffset = 14;               // 14 real pixels away from rect
  const offLogical  = pixelOffset / scale;   // convert through current zoom

  // half extents of rectangle in *stage* pixels
  const halfW = (rectangle.width  * GRID_PX) / 2;
  const halfH = (rectangle.height * GRID_PX) / 2;

  // relative handle centre before rotation (stage units)
  const relX = -halfW - offLogical;
  const relY = -halfH - offLogical;

  // absolute handle centre (stage units)
  const iconCanvasX = rectangle.pos.x * GRID_PX + (relX * Math.cos(rad) - relY * Math.sin(rad));
  const iconCanvasY = rectangle.pos.y * GRID_PX + (relX * Math.sin(rad) + relY * Math.cos(rad));

  // keep icon size constant on screen
  const iconSize = 18 / scale;

  // helper-guides -----------------------------------------------------------
  const [baseVec, setBaseVec] = React.useState<{x:number;y:number}|null>(null);
  const [currVec, setCurrVec] = React.useState<{x:number;y:number}|null>(null);
  const [initRot, setInitRot] = React.useState<number>(0);   // rectangle rot @ mousedown

  /* ---------- rotation helpers ------------------------------------------- */
  const centreCanvas = React.useMemo(() => ({
    x: rectangle.pos.x * GRID_PX,
    y: rectangle.pos.y * GRID_PX,
  }), [rectangle.pos, GRID_PX]);

  const calcAngleDeg = (vec: {x:number;y:number}) =>
    (Math.atan2(vec.y, vec.x) * 180) / Math.PI + 90; // 0°=upwards

  const dragRotateMove = React.useCallback((evt: MouseEvent, offset: number, stage: any) => {
    if (!stage) return;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Convert stage coordinates to local coordinates
    // The stage has scale and position transformations
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const localPos = transform.point(pointerPos);

    const vec = { x: localPos.x - centreCanvas.x, y: localPos.y - centreCanvas.y };
    setCurrVec(vec);                                 // update helper line

    let delta = calcAngleDeg(vec) - offset;          // angle difference
    let newRot = initRot + delta;

    // Snap to 15° with SHIFT
    if (evt.shiftKey) newRot = Math.round(newRot / 15) * 15;

    const norm = ((newRot % 360) + 360) % 360;
    onResize({ rotation: norm });
  }, [centreCanvas, initRot, onResize]);
  /* ----------------------------------------------------------------------- */

  return (
    <Group>
      {/* Edge handles */}
      {edges.map((edge) => (
        <Rect
          key={edge.name}
          x={edge.x - edge.width / 2}
          y={edge.y - edge.height / 2}
          width={edge.width}
          height={edge.height}
          fill="transparent"
          draggable
          onDragStart={handleDragStart}
          onDragMove={handleEdgeDrag(edge.name)}
          onDragEnd={handleDragEnd}
          dragBoundFunc={(pos: any) => {
            // Constrain edge handles to move only along their axis
            if (edge.name === 'n' || edge.name === 's') {
              return { x: edge.x - edge.width / 2, y: pos.y };
            } else {
              return { x: pos.x, y: edge.y - edge.height / 2 };
            }
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = edge.cursor;
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'default';
          }}
        />
      ))}
      
      {/* Corner handles */}
      {corners.map((corner) => (
        <Rect
          key={corner.name}
          x={corner.x - handleSize / 2}
          y={corner.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="#ffffff"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          cornerRadius={cornerRadius}
          draggable
          onDragStart={handleDragStart}
          onDragMove={handleCornerDrag(corner.name)}
          onDragEnd={handleDragEnd}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = corner.cursor;
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'default';
          }}
        />
      ))}
      
      {/* Rotation handle */}
      <Group
        x={iconCanvasX}
        y={iconCanvasY}
        rotation={deg}
        onMouseDown={(e) => {
          e.cancelBubble = true;
          const stage = e.target.getStage();
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          // Convert stage coordinates to local coordinates
          const transform = stage.getAbsoluteTransform().copy();
          transform.invert();
          const localPointer = transform.point(pointer);

          // base vector & offsets
          const base = { x: localPointer.x - centreCanvas.x, y: localPointer.y - centreCanvas.y };
          setBaseVec(base);
          setCurrVec(base);
          setInitRot(rectangle.rotation ?? 0);
          const offset = calcAngleDeg(base);

          const move = (evt: MouseEvent) => dragRotateMove(evt, offset, stage);
          const up   = (evt: MouseEvent) => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
            dragRotateMove(evt, offset, stage);     // final update
            onResizeEnd({ rotation: rectangle.rotation });
            handleDragEnd({ evt });                // overlay cleanup
            setBaseVec(null); setCurrVec(null);
          };

          handleDragStart({ evt: e.evt });         // overlay display
          window.addEventListener("mousemove", move);
          window.addEventListener("mouseup", up);
        }}
        onMouseEnter={(e) => {
          const c = e.target.getStage()?.container();
          if (c) c.style.cursor = "crosshair";
        }}
        onMouseLeave={(e) => {
          const c = e.target.getStage()?.container();
          if (c) c.style.cursor = "default";
        }}
      >
        {/* Background circle */}
        <Circle
          x={0}
          y={0}
          radius={iconSize / 2}
          fill="white"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
        />
        {/* Lucide corner-up-right icon */}
        <Path
          data={`
            M ${iconSize * 0.15} ${iconSize * 0.15}
            L ${iconSize * 0.15} ${-iconSize * 0.15}
            L ${-iconSize * 0.15} ${-iconSize * 0.15}
            M ${iconSize * 0.15} ${-iconSize * 0.15}
            L ${-iconSize * 0.05} ${-iconSize * 0.25}
            M ${iconSize * 0.15} ${-iconSize * 0.15}
            L ${iconSize * 0.25} ${-iconSize * 0.05}
          `}
          stroke="#3b82f6"
          strokeWidth={strokeWidth * 3}
          strokeLineCap="round"
          strokeLineJoin="round"
          fill="none"
        />
      </Group>

      {/* helper lines ---------------------------------------------------- */}
      {baseVec && (
        <>
          <Line
            points={[centreCanvas.x, centreCanvas.y, centreCanvas.x + baseVec.x, centreCanvas.y + baseVec.y]}
            stroke="#3b82f6" strokeWidth={1/scale} dash={[4/scale, 4/scale]} listening={false}
          />
          {currVec && (
            <Line
              points={[centreCanvas.x, centreCanvas.y, centreCanvas.x + currVec.x, centreCanvas.y + currVec.y]}
              stroke="#ef4444" strokeWidth={1/scale} listening={false}
            />
          )}
        </>
      )}
    </Group>
  );
}
