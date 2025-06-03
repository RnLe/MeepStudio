import React from "react";
import { Rect, Group, Path, Circle, Line, Arc, Text } from "react-konva";
import { Rectangle as RectEl } from "../../types/canvasElementTypes";

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
  const handleSize = 9 / scale;
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
    { name: 'n', x: 0, y: -halfHeight, cursor: 'ns-resize', isVertical: false },
    { name: 's', x: 0, y: halfHeight, cursor: 'ns-resize', isVertical: false },
    { name: 'w', x: -halfWidth, y: 0, cursor: 'ew-resize', isVertical: true },
    { name: 'e', x: halfWidth, y: 0, cursor: 'ew-resize', isVertical: true },
  ];

  // Rotation handle position (relative to rectangle center)
  const offPx = 14;
  const offLg = offPx / scale;
  const relRotHandle = {
    x: -halfWidth - offLg,
    y: -halfHeight - offLg,
  };

  // Custom cursor for rotation handle
  const rotateIconCursor = React.useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 2v4" />
      <path d="m22 12-4-2v4z" fill="black" />
    </svg>`;
    const encoded = btoa(svg);
    return `url('data:image/svg+xml;base64,${encoded}') 12 12, auto`;
  }, []);

  // Helper to handle overlay toggling during resize
  const handleResizeOverlays = React.useCallback((shiftPressed: boolean, ctrlPressed: boolean) => {
    if (!currentOverlayStates.current || !initialOverlayStates.current) return;
    
    if (shiftPressed && !currentOverlayStates.current.grid) {
      toggleShowGrid();
      currentOverlayStates.current.grid = true;
    } else if (!shiftPressed && currentOverlayStates.current.grid && !initialOverlayStates.current.grid) {
      toggleShowGrid();
      currentOverlayStates.current.grid = false;
    }
    
    if (ctrlPressed && !currentOverlayStates.current.resolution) {
      toggleShowResolutionOverlay();
      currentOverlayStates.current.resolution = true;
    } else if (!ctrlPressed && currentOverlayStates.current.resolution && !initialOverlayStates.current.resolution) {
      toggleShowResolutionOverlay();
      currentOverlayStates.current.resolution = false;
    }
  }, [toggleShowGrid, toggleShowResolutionOverlay]);

  // Helper to restore overlay states after resize
  const restoreOverlayStates = React.useCallback(() => {
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
  }, [toggleShowGrid, toggleShowResolutionOverlay]);

  // Fixed resize handler factory
  const createResizeHandler = (handleName: string) => {
    return {
      onMouseDown: (e: any) => {
        e.cancelBubble = true;
        setActiveHandle(handleName);
        setIsResizing(true);
        setActiveInstructionSet('resizing');
        
        if (!initialOverlayStates.current) {
          initialOverlayStates.current = {
            grid: showGrid,
            resolution: showResolutionOverlay
          };
          currentOverlayStates.current = {
            grid: showGrid,
            resolution: showResolutionOverlay
          };
        }
        
        // Store initial rectangle state
        currentResizeState.current = {
          width: rectangle.width,
          height: rectangle.height,
          pos: { ...rectangle.pos }
        };
        
        const stage = e.target.getStage();
        if (!stage) return;
        
        // Get the initial mouse position in stage coordinates
        const initialPointerPos = stage.getPointerPosition();
        if (!initialPointerPos) return;
        
        // Convert to local coordinates
        const transform = stage.getAbsoluteTransform().copy().invert();
        const initialLocalPos = transform.point(initialPointerPos);
        
        // Store initial handle position in grid units
        const rectCenterStage = {
          x: rectangle.pos.x * GRID_PX,
          y: rectangle.pos.y * GRID_PX
        };
        
        const handleMouseMove = (ev: MouseEvent) => {
          const pointerPos = stage.getPointerPosition();
          if (!pointerPos) return;
          
          const shiftPressed = ev.shiftKey;
          const ctrlPressed = ev.ctrlKey || ev.metaKey;
          
          handleResizeOverlays(shiftPressed, ctrlPressed);
          
          // Convert pointer position to local coordinates
          const localPos = transform.point(pointerPos);
          
          // Calculate mouse movement delta
          const deltaX = (localPos.x - initialLocalPos.x) / GRID_PX;
          const deltaY = (localPos.y - initialLocalPos.y) / GRID_PX;
          
          // Calculate new dimensions and position based on handle
          let newWidth = rectangle.width;
          let newHeight = rectangle.height;
          let newPosX = rectangle.pos.x;
          let newPosY = rectangle.pos.y;
          
          switch (handleName) {
            case 'nw':
              // North-west: move left and top edges
              newWidth = rectangle.width - deltaX;
              newHeight = rectangle.height - deltaY;
              newPosX = rectangle.pos.x + deltaX / 2;
              newPosY = rectangle.pos.y + deltaY / 2;
              break;
            case 'ne':
              // North-east: move right and top edges
              newWidth = rectangle.width + deltaX;
              newHeight = rectangle.height - deltaY;
              newPosX = rectangle.pos.x + deltaX / 2;
              newPosY = rectangle.pos.y + deltaY / 2;
              break;
            case 'sw':
              // South-west: move left and bottom edges
              newWidth = rectangle.width - deltaX;
              newHeight = rectangle.height + deltaY;
              newPosX = rectangle.pos.x + deltaX / 2;
              newPosY = rectangle.pos.y + deltaY / 2;
              break;
            case 'se':
              // South-east: move right and bottom edges
              newWidth = rectangle.width + deltaX;
              newHeight = rectangle.height + deltaY;
              newPosX = rectangle.pos.x + deltaX / 2;
              newPosY = rectangle.pos.y + deltaY / 2;
              break;
            case 'n':
              // North: only move top edge
              newHeight = rectangle.height - deltaY;
              newPosY = rectangle.pos.y + deltaY / 2;
              break;
            case 's':
              // South: only move bottom edge
              newHeight = rectangle.height + deltaY;
              newPosY = rectangle.pos.y + deltaY / 2;
              break;
            case 'w':
              // West: only move left edge
              newWidth = rectangle.width - deltaX;
              newPosX = rectangle.pos.x + deltaX / 2;
              break;
            case 'e':
              // East: only move right edge
              newWidth = rectangle.width + deltaX;
              newPosX = rectangle.pos.x + deltaX / 2;
              break;
          }
          
          // Apply minimum size constraints
          newWidth = Math.max(0.1, newWidth);
          newHeight = Math.max(0.1, newHeight);
          
          // Apply snapping
          newWidth = snapToGrid(newWidth, shiftPressed, ctrlPressed);
          newHeight = snapToGrid(newHeight, shiftPressed, ctrlPressed);
          newPosX = snapToGrid(newPosX, shiftPressed, ctrlPressed);
          newPosY = snapToGrid(newPosY, shiftPressed, ctrlPressed);
          
          // Update state with both size and position
          currentResizeState.current = { 
            width: newWidth, 
            height: newHeight,
            pos: { x: newPosX, y: newPosY }
          };
          onResize({ width: newWidth, height: newHeight, pos: { x: newPosX, y: newPosY } });
        };
        
        const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          
          if (currentResizeState.current.width !== undefined && currentResizeState.current.height !== undefined) {
            onResizeEnd({
              width: currentResizeState.current.width,
              height: currentResizeState.current.height,
              pos: currentResizeState.current.pos
            });
          }
          
          restoreOverlayStates();
          setActiveHandle(null);
          setIsResizing(false);
          setActiveInstructionSet('default');
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
    };
  };

  // Fixed rotation handler
  const handleRotation = {
    onMouseDown: (e: any) => {
      e.cancelBubble = true;
      setIsRotating(true);
      setActiveInstructionSet('rotating');
      
      const stage = e.target.getStage();
      if (!stage) return;
      
      // Get rectangle center in stage coordinates
      const rectCenter = {
        x: rectangle.pos.x * GRID_PX,
        y: rectangle.pos.y * GRID_PX
      };
      
      const getAngle = (pointerPos: any) => {
        // Convert to local coordinates
        const transform = stage.getAbsoluteTransform().copy().invert();
        const localPos = transform.point(pointerPos);
        
        // Calculate angle from center to pointer
        const dx = localPos.x - rectCenter.x;
        const dy = localPos.y - rectCenter.y;
        return Math.atan2(dy, dx);
      };
      
      const initialPointerPos = stage.getPointerPosition();
      if (!initialPointerPos) return;
      
      // Calculate the angle from rectangle center to the rotation handle
      const handleAngleOffset = Math.atan2(-halfHeight - offLg, -halfWidth - offLg);
      
      // Get the initial pointer angle and adjust for the handle position
      const startPointerAngle = getAngle(initialPointerPos);
      const startRotation = rectangle.orientation || 0;
      
      // The offset is the difference between where the mouse clicked and the actual rotation
      setRotationOffset(startPointerAngle - startRotation - handleAngleOffset);
      
      // Store the current rotation for the drag operation
      let currentRotation = startRotation;
      
      const handleMouseMove = (ev: MouseEvent) => {
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;
        
        const currentPointerAngle = getAngle(pointerPos);
        
        // Calculate new rotation: current pointer angle - initial offset - handle offset
        let newRotation = currentPointerAngle - (rotationOffset || 0) - handleAngleOffset;
        
        // Normalize angle to [-π, π]
        while (newRotation > Math.PI) newRotation -= 2 * Math.PI;
        while (newRotation < -Math.PI) newRotation += 2 * Math.PI;
        
        // Snap angles
        if (ev.shiftKey) {
          const snapAngle = 5 * Math.PI / 180; // 5 degrees
          newRotation = Math.round(newRotation / snapAngle) * snapAngle;
        } else if (ev.ctrlKey || ev.metaKey) {
          const snapAngle = Math.PI / 180; // 1 degree
          newRotation = Math.round(newRotation / snapAngle) * snapAngle;
        }
        
        currentRotation = newRotation;
        onResize({ orientation: newRotation });
      };
      
      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        // Save the rotation using onResizeEnd to ensure it's persisted
        onResizeEnd({ orientation: currentRotation });
        
        setIsRotating(false);
        setRotationOffset(null);
        setActiveInstructionSet('default');
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  // Keyboard listeners for overlay toggling
  React.useEffect(() => {
    if (!isResizing) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      handleResizeOverlays(e.shiftKey, e.ctrlKey || e.metaKey);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      handleResizeOverlays(e.shiftKey, e.ctrlKey || e.metaKey);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isResizing, handleResizeOverlays]);

  return (
    <Group>
      {/* Corner handles */}
      {corners.map((corner) => (
        <Rect
          key={corner.name}
          x={corner.x - handleSize / 2}
          y={corner.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="white"
          stroke="#006FEE"
          strokeWidth={strokeWidth}
          cornerRadius={cornerRadius}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = corner.cursor;
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'default';
          }}
          {...createResizeHandler(corner.name)}
        />
      ))}
      
      {/* Edge handles */}
      {edges.map((edge) => (
        <Rect
          key={edge.name}
          x={edge.x - (edge.isVertical ? edgeWidth / 2 : handleSize / 2)}
          y={edge.y - (edge.isVertical ? handleSize / 2 : edgeWidth / 2)}
          width={edge.isVertical ? edgeWidth : handleSize}
          height={edge.isVertical ? handleSize : edgeWidth}
          fill="white"
          stroke="#006FEE"
          strokeWidth={strokeWidth}
          cornerRadius={cornerRadius}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = edge.cursor;
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'default';
          }}
          {...createResizeHandler(edge.name)}
        />
      ))}
      
      {/* Rotation handle */}
      <Group
        x={relRotHandle.x}
        y={relRotHandle.y}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = rotateIconCursor;
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
        {...handleRotation}
      >
        <Circle
          radius={8 / scale}
          fill="#006FEE"
          stroke="white"
          strokeWidth={1 / scale}
        />
        <Path
          data="M -3 -1 A 3 3 0 1 1 1 -3"
          stroke="white"
          strokeWidth={1.2 / scale}
          lineCap="round"
          scaleX={1 / scale}
          scaleY={1 / scale}
        />
        <Path
          data="M 1 -3 L -0.5 -3 L 1 -3 L 1 -1.5"
          stroke="white"
          strokeWidth={1.2 / scale}
          lineCap="round"
          lineJoin="round"
          scaleX={1 / scale}
          scaleY={1 / scale}
        />
      </Group>
      
      {/* Rotation helper arc */}
      {isRotating && (
        <>
          <Arc
            x={0}
            y={0}
            innerRadius={Math.max(halfWidth, halfHeight) + 20 / scale}
            outerRadius={Math.max(halfWidth, halfHeight) + 20 / scale}
            angle={360}
            stroke="#006FEE"
            strokeWidth={0.5 / scale}
            dash={[5 / scale, 5 / scale]}
            opacity={0.5}
          />
          <Text
            x={0}
            y={-(Math.max(halfWidth, halfHeight) + 40 / scale)}
            text={`${Math.round((rectangle.orientation || 0) * 180 / Math.PI)}°`}
            fontSize={12 / scale}
            fill="#006FEE"
            align="center"
            offsetX={0}
          />
        </>
      )}
    </Group>
  );
}
