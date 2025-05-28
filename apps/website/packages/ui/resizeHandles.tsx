import React from "react";
import { Rect, Group, Path, Circle, Line, Arc, Text } from "react-konva";
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
  handleUpdateGeometry: (id: string, updates: Partial<RectEl>) => void;
  setActiveInstructionSet: (key: 'default' | 'rotating' | 'resizing' | 'dragging') => void;
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
  toggleShowResolutionOverlay,
  handleUpdateGeometry,
  setActiveInstructionSet
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
  
  // State to track if we're currently rotating
  const [isRotating, setIsRotating] = React.useState(false);
  
  // State to track if we're currently resizing (not just rotating)
  const [isResizing, setIsResizing] = React.useState(false);
  
  // State to track initial overlay states when resize starts
  const initialOverlayStates = React.useRef<{ grid: boolean; resolution: boolean } | null>(null);
  
  // State to track current overlay states during drag to prevent flickering
  const currentOverlayStates = React.useRef<{ grid: boolean; resolution: boolean } | null>(null);
  
  // State to track which handle is being resized
  const [activeHandle, setActiveHandle] = React.useState<string | null>(null);
  
  // Track the current resize state during drag
  const currentResizeState = React.useRef<Partial<RectEl>>({});
  
  // Calculate rectangle bounds in canvas coordinates (relative to center)
  const halfWidth = (rectangle.width * GRID_PX) / 2;
  const halfHeight = (rectangle.height * GRID_PX) / 2;
  
  // Corner handles (relative to rectangle center)
  const corners = [
    { name: 'nw', x: -halfWidth, y: -halfHeight, cursor: 'nw-resize' },
    { name: 'ne', x: halfWidth, y: -halfHeight, cursor: 'ne-resize' },
    { name: 'sw', x: -halfWidth, y: halfHeight, cursor: 'sw-resize' },
    { name: 'se', x: halfWidth, y: halfHeight, cursor: 'se-resize' },
  ];
  
  // Edge handles (relative to rectangle center)
  const edges = [
    { name: 'n', x: 0, y: -halfHeight, width: rectangle.width * GRID_PX, height: edgeWidth, cursor: 'n-resize' },
    { name: 's', x: 0, y: halfHeight, width: rectangle.width * GRID_PX, height: edgeWidth, cursor: 's-resize' },
    { name: 'w', x: -halfWidth, y: 0, width: edgeWidth, height: rectangle.height * GRID_PX, cursor: 'w-resize' },
    { name: 'e', x: halfWidth, y: 0, width: edgeWidth, height: rectangle.height * GRID_PX, cursor: 'e-resize' },
  ];
  
  // Enhanced snap function that considers shift/ctrl keys
  const snapWithModifiers = React.useCallback((value: number, evt: any) => {
    const shiftPressed = evt.evt.shiftKey;
    const ctrlPressed = evt.evt.ctrlKey || evt.evt.metaKey;
    
    // Force grid or resolution snapping based on keys
    return snapToGrid(value, shiftPressed, ctrlPressed);
  }, [snapToGrid]);
  
  const handleDragStart = (evt: any) => {
    // Set instruction set to resizing
    setActiveInstructionSet('resizing');
    setIsResizing(true);
    
    // Store the initial overlay states when resize starts
    if (!initialOverlayStates.current) {
      initialOverlayStates.current = {
        grid: showGrid,
        resolution: showResolutionOverlay
      };
      // Initialize current states to match initial states
      currentOverlayStates.current = {
        grid: showGrid,
        resolution: showResolutionOverlay
      };
    }
  };
  
  const handleDragMove = (evt: any) => {
    const shiftPressed = evt.evt.shiftKey;
    const ctrlPressed = evt.evt.ctrlKey || evt.evt.metaKey;
    
    if (!currentOverlayStates.current) return;
    
    // Handle grid overlay
    if (shiftPressed && !currentOverlayStates.current.grid) {
      toggleShowGrid();
      currentOverlayStates.current.grid = true;
    } else if (!shiftPressed && currentOverlayStates.current.grid && !initialOverlayStates.current?.grid) {
      toggleShowGrid();
      currentOverlayStates.current.grid = false;
    }
    
    // Handle resolution overlay
    if (ctrlPressed && !currentOverlayStates.current.resolution) {
      toggleShowResolutionOverlay();
      currentOverlayStates.current.resolution = true;
    } else if (!ctrlPressed && currentOverlayStates.current.resolution && !initialOverlayStates.current?.resolution) {
      toggleShowResolutionOverlay();
      currentOverlayStates.current.resolution = false;
    }
  };
  
  const handleDragEnd = (evt: any) => {
    // Restore overlay states to their initial values
    if (initialOverlayStates.current && currentOverlayStates.current) {
      if (currentOverlayStates.current.grid !== initialOverlayStates.current.grid) {
        toggleShowGrid();
      }
      if (currentOverlayStates.current.resolution !== initialOverlayStates.current.resolution) {
        toggleShowResolutionOverlay();
      }
      initialOverlayStates.current = null;
      currentOverlayStates.current = null;
    }
    
    // Reset instruction set to default
    setActiveInstructionSet('default');
    setIsResizing(false);
  };
  
  const handleCornerMouseDown = (cornerName: string) => (e: any) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (!stage) return;
    
    setActiveHandle(cornerName);
    handleDragStart(e);
    
    // Initialize resize state
    currentResizeState.current = {
      pos: rectangle.pos,
      width: rectangle.width,
      height: rectangle.height
    };
    
    const handleMouseMove = (evt: MouseEvent) => {
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;
      
      // Convert pointer position to lattice units
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const stagePos = transform.point(pointerPos);
      
      const x = stagePos.x / GRID_PX;
      const y = stagePos.y / GRID_PX;

      // Snap with modifiers
      const snappedX = snapToGrid(x, evt.shiftKey, evt.ctrlKey || evt.metaKey);
      const snappedY = snapToGrid(y, evt.shiftKey, evt.ctrlKey || evt.metaKey);
      
      // Update overlays based on key state
      handleDragMove({ evt: { shiftKey: evt.shiftKey, ctrlKey: evt.ctrlKey || evt.metaKey } });
      
      // Transform cursor position to rectangle's local coordinate system
      const angle = rectangle.orientation || 0;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Vector from rectangle center to cursor
      const dx = snappedX - rectangle.pos.x;
      const dy = snappedY - rectangle.pos.y;
      
      // Transform to rectangle's local coordinate system
      const localX = dx * cos + dy * sin;
      const localY = -dx * sin + dy * cos;
      
      // Current bounds in local coordinates
      let newLeft = -rectangle.width / 2;
      let newRight = rectangle.width / 2;
      let newTop = -rectangle.height / 2;
      let newBottom = rectangle.height / 2;
      
      const minSize = 0.001;
      
      // Move the appropriate corner to the cursor position
      switch (cornerName) {
        case 'nw':
          newLeft = Math.min(localX, newRight - minSize);
          newTop = Math.min(localY, newBottom - minSize);
          break;
        case 'ne':
          newRight = Math.max(localX, newLeft + minSize);
          newTop = Math.min(localY, newBottom - minSize);
          break;
        case 'sw':
          newLeft = Math.min(localX, newRight - minSize);
          newBottom = Math.max(localY, newTop + minSize);
          break;
        case 'se':
          newRight = Math.max(localX, newLeft + minSize);
          newBottom = Math.max(localY, newTop + minSize);
          break;
      }
      
      // Calculate new dimensions and center
      const newWidth = newRight - newLeft;
      const newHeight = newBottom - newTop;
      
      // Calculate offset of center in local coordinates
      const localCenterX = (newLeft + newRight) / 2;
      const localCenterY = (newTop + newBottom) / 2;
      
      // Transform center offset back to global coordinates
      const globalOffsetX = localCenterX * cos - localCenterY * sin;
      const globalOffsetY = localCenterX * sin + localCenterY * cos;
      
      // New center position
      const newPosX = rectangle.pos.x + globalOffsetX;
      const newPosY = rectangle.pos.y + globalOffsetY;
      
      // Update the rectangle
      const updates = {
        pos: { x: newPosX, y: newPosY },
        width: newWidth,
        height: newHeight
      };
      onResize(updates);
      
      // Store the current state for the mouseup handler
      currentResizeState.current = updates;
    };
    
    const handleMouseUp = (evt: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setActiveHandle(null);
      
      // Pass the final resize state to onResizeEnd
      onResizeEnd(currentResizeState.current);
      
      // Handle overlay cleanup
      handleDragEnd({ evt });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleEdgeMouseDown = (edgeName: string) => (e: any) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (!stage) return;
    
    setActiveHandle(edgeName);
    handleDragStart(e);
    
    // Initialize resize state
    currentResizeState.current = {
      pos: rectangle.pos,
      width: rectangle.width,
      height: rectangle.height
    };
    
    const handleMouseMove = (evt: MouseEvent) => {
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;
      
      // Convert pointer position to lattice units
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const stagePos = transform.point(pointerPos);
      
      const x = stagePos.x / GRID_PX;
      const y = stagePos.y / GRID_PX;

      // Snap with modifiers
      const snappedX = snapToGrid(x, evt.shiftKey, evt.ctrlKey || evt.metaKey);
      const snappedY = snapToGrid(y, evt.shiftKey, evt.ctrlKey || evt.metaKey);
      
      // Update overlays based on key state
      handleDragMove({ evt: { shiftKey: evt.shiftKey, ctrlKey: evt.ctrlKey || evt.metaKey } });
      
      // For edge resizing, we need to project the cursor position onto the edge normal
      const angle = rectangle.orientation || 0;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Vector from rectangle center to cursor
      const dx = snappedX - rectangle.pos.x;
      const dy = snappedY - rectangle.pos.y;
      
      // Transform to rectangle's local coordinate system
      const localX = dx * cos + dy * sin;
      const localY = -dx * sin + dy * cos;
      
      // Calculate new bounds based on which edge is being dragged
      let newLeft = -rectangle.width / 2;
      let newRight = rectangle.width / 2;
      let newTop = -rectangle.height / 2;
      let newBottom = rectangle.height / 2;
      
      const minSize = 0.001;
      
      switch (edgeName) {
        case 'n':
          // North edge moves to cursor's local Y position
          newTop = Math.min(localY, newBottom - minSize);
          break;
        case 's':
          // South edge moves to cursor's local Y position
          newBottom = Math.max(localY, newTop + minSize);
          break;
        case 'w':
          // West edge moves to cursor's local X position
          newLeft = Math.min(localX, newRight - minSize);
          break;
        case 'e':
          // East edge moves to cursor's local X position
          newRight = Math.max(localX, newLeft + minSize);
          break;
      }
      
      // Calculate new dimensions and center
      const newWidth = newRight - newLeft;
      const newHeight = newBottom - newTop;
      
      // Calculate offset of center in local coordinates
      const localCenterX = (newLeft + newRight) / 2;
      const localCenterY = (newTop + newBottom) / 2;
      
      // Transform center offset back to global coordinates
      const globalOffsetX = localCenterX * cos - localCenterY * sin;
      const globalOffsetY = localCenterX * sin + localCenterY * cos;
      
      // New center position
      const newPosX = rectangle.pos.x + globalOffsetX;
      const newPosY = rectangle.pos.y + globalOffsetY;
      
      onResize({
        pos: { x: newPosX, y: newPosY },
        width: newWidth,
        height: newHeight
      });
      
      // Store the current state for the mouseup handler
      currentResizeState.current = {
        pos: { x: newPosX, y: newPosY },
        width: newWidth,
        height: newHeight
      };
    };
    
    const handleMouseUp = (evt: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setActiveHandle(null);
      
      // Pass the final resize state to onResizeEnd
      onResizeEnd(currentResizeState.current);
      
      // Handle overlay cleanup
      handleDragEnd({ evt });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  /* ---------- rotation-handle helpers ------------------------------------ */
  const deg = (rectangle.orientation || 0) * 180 / Math.PI; // radians → deg
  const rad = rectangle.orientation || 0;  // Use orientation directly (it's already in radians)

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
  const [mousePos, setMousePos] = React.useState<{x:number;y:number}|null>(null); // for text positioning

  // Add the missing refs
  const baseVecRef = React.useRef<{x:number;y:number}|null>(null);
  const initRotRef = React.useRef<number>(0);

  // keep the latest orientation during drag
  const latestOrientation = React.useRef(rad);
  
  // Update the ref whenever the rectangle orientation changes
  React.useEffect(() => {
    latestOrientation.current = rectangle.orientation || 0;
  }, [rectangle.orientation]);

  /* ---------- rotation helpers ------------------------------------------- */
  const centreCanvas = React.useMemo(() => ({
    x: rectangle.pos.x * GRID_PX,
    y: rectangle.pos.y * GRID_PX,
  }), [rectangle.pos, GRID_PX]);

  const calcAngleDeg = (vec: {x:number;y:number}) =>
    (Math.atan2(vec.y, vec.x) * 180) / Math.PI + 90; // 0°=upwards

  const dragRotateMove = React.useCallback(
    (evt: MouseEvent, offset: number, stage: any) => {
      if (!stage) return;
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const localPos = transform.point(pointerPos);
      const base = baseVecRef.current;                       // ref

      const vec = { x: localPos.x - centreCanvas.x, y: localPos.y - centreCanvas.y };

      // Normalize length to that of base vector
      if (base) {
        const baseLen = Math.hypot(base.x, base.y);
        const vecLen  = Math.hypot(vec.x,  vec.y);
        if (vecLen > 0) {
          vec.x = (vec.x / vecLen) * baseLen;
          vec.y = (vec.y / vecLen) * baseLen;
        }
      }

      setCurrVec(vec);
      setMousePos(localPos);

      let delta = calcAngleDeg(vec) - offset;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;

      let newRot = initRotRef.current + delta;              // use ref here

      // Apply snapping based on modifier keys
      if (evt.shiftKey) {
        // Snap to 5° increments
        newRot = Math.round(newRot / 5) * 5;
      } else if (evt.ctrlKey || evt.metaKey) {
        // Snap to 1° increments
        newRot = Math.round(newRot);
      }

      const orientationRad = ((newRot * Math.PI) / 180) % (2 * Math.PI);
      const normalized     = orientationRad < 0 ? orientationRad + 2 * Math.PI : orientationRad;

      latestOrientation.current = normalized;
      onResize({ orientation: normalized });
    },
    [centreCanvas, onResize]                                // removed initRot/baseVec deps
  );
  /* --------------------------------------------------------------------- */

  // Custom cursor for rotation
  const rotateIconCursor = React.useMemo(() => {
    // Create a data URL for the rotate cursor with color #262626
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>`;
    const encoded = encodeURIComponent(svg);
    return `url('data:image/svg+xml;utf8,${encoded}') 12 12, auto`;
  }, []);

  // Keyboard event handlers for showing/hiding grids during resize
  React.useEffect(() => {
    if (!isResizing) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentOverlayStates.current || !initialOverlayStates.current) return;
      
      // Handle shift key
      if (e.shiftKey && !currentOverlayStates.current.grid) {
        toggleShowGrid();
        currentOverlayStates.current.grid = true;
      }
      
      // Handle ctrl/cmd key
      if ((e.ctrlKey || e.metaKey) && !currentOverlayStates.current.resolution) {
        toggleShowResolutionOverlay();
        currentOverlayStates.current.resolution = true;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!currentOverlayStates.current || !initialOverlayStates.current) return;
      
      // Handle shift key release
      if (!e.shiftKey && currentOverlayStates.current.grid && !initialOverlayStates.current.grid) {
        toggleShowGrid();
        currentOverlayStates.current.grid = false;
      }
      
      // Handle ctrl/cmd key release
      if (!e.ctrlKey && !e.metaKey && currentOverlayStates.current.resolution && !initialOverlayStates.current.resolution) {
        toggleShowResolutionOverlay();
        currentOverlayStates.current.resolution = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isResizing, toggleShowGrid, toggleShowResolutionOverlay]);
  
  return (
    <Group>
      {/* Main group that rotates with the rectangle */}
      <Group
        x={rectangle.pos.x * GRID_PX}
        y={rectangle.pos.y * GRID_PX}
        rotation={(rectangle.orientation || 0) * 180 / Math.PI}
      >
        {/* Edge handles - hide during rotation */}
        {!isRotating && edges.map((edge) => (
          <Rect
            key={edge.name}
            x={edge.x - edge.width / 2}
            y={edge.y - edge.height / 2}
            width={edge.width}
            height={edge.height}
            fill="transparent"
            onMouseDown={handleEdgeMouseDown(edge.name)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = edge.cursor;
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container && activeHandle !== edge.name) container.style.cursor = 'default';
            }}
          />
        ))}
        
        {/* Corner handles - hide during rotation */}
        {!isRotating && corners.map((corner) => (
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
            onMouseDown={handleCornerMouseDown(corner.name)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = corner.cursor;
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container && activeHandle !== corner.name) container.style.cursor = 'default';
            }}
          />
        ))}
      </Group>
      
      {/* Rotation handle - positioned independently */}
      <Group
        x={iconCanvasX}
        y={iconCanvasY}
        rotation={deg}
        onMouseEnter={(e) => {
          const c = e.target.getStage()?.container();
          if (c) c.style.cursor = rotateIconCursor;
        }}
        onMouseLeave={(e) => {
          const c = e.target.getStage()?.container();
          if (c) c.style.cursor = "default";
        }}
        onMouseDown={(e) => {
          e.cancelBubble = true;
          const stage = e.target.getStage();
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          // Set instruction set to rotating
          setActiveInstructionSet('rotating');

          // Convert stage coordinates to local coordinates
          const transform = stage.getAbsoluteTransform().copy();
          transform.invert();
          const localPointer = transform.point(pointer);

          // base vector & offsets
          const base = { x: localPointer.x - centreCanvas.x, y: localPointer.y - centreCanvas.y };
          setBaseVec(base);
          baseVecRef.current = base; // sync ref
          setCurrVec(base);
          setInitRot(deg);
          initRotRef.current = deg; // sync ref
          setMousePos(localPointer);
          setIsRotating(true); // Mark as rotating
          const offset = calcAngleDeg(base);

          const move = (evt: MouseEvent) => dragRotateMove(evt, offset, stage);
          const up = (evt: MouseEvent) => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
            dragRotateMove(evt, offset, stage); // ensure last move

            // Use handleUpdateGeometry to persist the orientation
            // Make sure we're using the latest orientation value
            const finalOrientation = latestOrientation.current;
            handleUpdateGeometry(rectangle.id, { orientation: finalOrientation });
            
            // Don't call handleDragEnd here as it's for resize operations
            // Just reset the overlay states if needed
            if (tempShowGrid) {
              toggleShowGrid();
              setTempShowGrid(false);
            }
            if (tempShowResolution) {
              toggleShowResolutionOverlay();
              setTempShowResolution(false);
            }
            
            setBaseVec(null); 
            baseVecRef.current = null; // clear ref
            setCurrVec(null); 
            setMousePos(null);
            setIsRotating(false); // No longer rotating
            
            // Reset instruction set to default
            setActiveInstructionSet('default');
            
            // Force cursor reset by setting it directly on the stage container
            const container = stage.container();
            if (container) {
              // Use setTimeout to ensure the cursor reset happens after all event processing
              setTimeout(() => {
                container.style.cursor = "default";
              }, 0);
            }
          };

          // Don't call handleDragStart for rotation - it's for resize operations
          window.addEventListener("mousemove", move);
          window.addEventListener("mouseup", up);
        }}
      >
        {/* Rotation icon - hide during rotation */}
        {!isRotating && (
          <>
            {/* First path: the curved arrow */}
            <Path
              data="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"
              stroke="#ffffff"
              strokeWidth={3}  // Use a fixed value instead of calculated
              fill="transparent"  // Use "transparent" instead of "none"
              lineCap="round"    // Note: different casing
              lineJoin="round"   // Note: different casing
              scaleX={iconSize / 24}
              scaleY={iconSize / 24}
              offsetX={12}
              offsetY={12}
            />
            {/* Second path: the arrow head */}
            <Path
              data="M21 3v5h-5"
              stroke="#ffffff"
              strokeWidth={3}  // Use a fixed value instead of calculated
              fill="transparent"  // Use "transparent" instead of "none"
              lineCap="round"    // Note: different casing
              lineJoin="round"   // Note: different casing
              scaleX={iconSize / 24}
              scaleY={iconSize / 24}
              offsetX={12}
              offsetY={12}
            />
          </>
        )}
      </Group>
      
      {/* helper lines and arc ---------------------------------------------------- */}
      {baseVec && currVec && (
        <>
          {/* Arc between the two lines */}
          {(() => {
            const baseAngle = calcAngleDeg(baseVec) - 90;
            const currAngle = calcAngleDeg(currVec) - 90;
            let angleDiff = currAngle - baseAngle;
            
            // Normalize to -180 to 180
            while (angleDiff > 180) angleDiff -= 360;
            while (angleDiff < -180) angleDiff += 360;
            
            const startAngle = angleDiff < 0 ? currAngle : baseAngle;
            const sweepAngle = Math.abs(angleDiff);
            
            return (
              <Arc
                x={centreCanvas.x}
                y={centreCanvas.y}
                innerRadius={0}
                outerRadius={Math.min(60 / scale, Math.sqrt(baseVec.x * baseVec.x + baseVec.y * baseVec.y) * 0.3)}
                angle={sweepAngle}
                rotation={startAngle}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="#3b82f6"
                strokeWidth={0.5 / scale}
              />
            );
          })()}
          
          {/* Base line (dashed blue) */}
          <Line
            points={[centreCanvas.x, centreCanvas.y, centreCanvas.x + baseVec.x, centreCanvas.y + baseVec.y]}
            stroke="#3b82f6" 
            strokeWidth={1/scale} 
            dash={[4/scale, 4/scale]} 
            listening={false}
          />
          
          {/* Current line (solid black, same length as base) */}
          <Line
            points={[centreCanvas.x, centreCanvas.y, centreCanvas.x + currVec.x, centreCanvas.y + currVec.y]}
            stroke="#000000" 
            strokeWidth={1/scale} 
            listening={false}
          />
          
          {/* Angle text display */}
          {mousePos && currVec && (() => {
              // current & initial orientations are in degrees
              const currentDeg = latestOrientation.current * 180 / Math.PI;
              let delta      = currentDeg - initRot;
              // Normalize delta to -180 to 180 range
              while (delta > 180) delta -= 360;
              while (delta < -180) delta += 360;
              
              // Position text near the cursor with slight offset
              const textOffset = 20 / scale;
              const textX = mousePos.x + textOffset;
              const textY = mousePos.y + textOffset;
              
              // Show absolute orientation and delta
              const absoluteDeg = currentDeg % 360;
              const normalizedAbsolute = absoluteDeg < 0 ? absoluteDeg + 360 : absoluteDeg;
              
              return (
                <Text
                  x={textX}
                  y={textY}
                  text={`${normalizedAbsolute.toFixed(0)}° (${delta > 0 ? '+' : ''}${delta.toFixed(0)}°)`}
                  fontSize={12 / scale}
                  fill="#000000"
                  align="left"
                  verticalAlign="top"
                  listening={false}
                />
              );
          })()}
        </>
      )}
    </Group>
  );
}
