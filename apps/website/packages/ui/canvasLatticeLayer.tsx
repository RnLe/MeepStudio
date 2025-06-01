import React from "react";
import { Group, Circle, Rect, Line, RegularPolygon, Shape } from "react-konva";
import { MeepProject } from "../types/meepProjectTypes";
import { useCanvasStore } from "../providers/CanvasStore";
import { MaterialCatalog } from "../constants/meepMaterialPresets";
import { useMaterialColorStore } from "../providers/MaterialColorStore";
import { getSelectionBorderColor } from "../utils/colorUtils";           // +++ for colour helper

interface Props {
  lattices: any[];
  geometries: any[];
  selectedIds: string[];
  selectElement: (id: string | null, opts?: { shift?: boolean }) => void;
  GRID_PX: number;
  project: MeepProject;
  scale: number;
  showXRayMode: boolean;
  showColors: boolean;
  // Add new props for dragging
  gridSnapping: boolean;
  resolutionSnapping: boolean;
  snapCanvasPosToGrid: (pos: { x: number; y: number }) => { x: number; y: number };
  multiDragAnchor?: {
    id: string;
    anchor: { x: number; y: number };
    initialPositions: Record<string, { x: number; y: number }>;
  } | null;
  setMultiDragAnchor?: (anchor: any) => void;
  updateLattice: (id: string, partial: Partial<any>) => void;
  handleUpdateLattice: (id: string, partial: Partial<any>) => void;
  /**
   * Setter coming from ProjectCanvas (`useState<'default' | 'dragging' | 'rotating' | 'resizing'>`)
   * Accept the full React.Dispatch signature to avoid type-mismatch.
   */
  setActiveInstructionSet?: React.Dispatch<
    React.SetStateAction<"default" | "dragging" | "rotating" | "resizing">
  >;
  showGrid: boolean;
  showResolutionOverlay: boolean;
  toggleShowGrid: () => void;
  toggleShowResolutionOverlay: () => void;
}

export function LatticeLayer({
  lattices, 
  geometries,
  selectedIds, 
  selectElement, 
  GRID_PX, 
  project,
  scale,
  showXRayMode,
  showColors,
  gridSnapping,
  resolutionSnapping,
  snapCanvasPosToGrid,
  multiDragAnchor,
  setMultiDragAnchor,
  updateLattice,
  handleUpdateLattice,
  setActiveInstructionSet,
  showGrid,
  showResolutionOverlay,
  toggleShowGrid,
  toggleShowResolutionOverlay,
}: Props) {
  const {
    getElementColorVisibility,
    getElementXRayTransparency,
    xRayTransparencyRevision,
    colorSettingsRevision,
  } = useCanvasStore((s) => ({
    getElementColorVisibility: s.getElementColorVisibility,
    getElementXRayTransparency: s.getElementXRayTransparency,
    xRayTransparencyRevision: s.xRayTransparencyRevision,
    colorSettingsRevision: s.colorSettingsRevision,
  }));
  const { getMaterialColor } = useMaterialColorStore();

  // Get geometry color visibility
  const showGeometryColors = getElementColorVisibility("geometries");

  /* ---------- getMaterialColorForGeometry helper (mimicking geometry layer) ---------- */
  const getMaterialColorForGeometry = React.useCallback(
    (geom: any): string => {
      const alpha = showXRayMode
        ? getElementXRayTransparency("geometries")
        : 1;

      // Colors disabled -> dark gray
      if (!showGeometryColors) return `rgba(64,64,64,${alpha})`;

      const matKey = geom.material;
      if (!matKey) return `rgba(128,128,128,${alpha})`;

      // Get custom color or catalog color
      const custom = getMaterialColor(matKey);
      const raw = custom || MaterialCatalog[matKey as keyof typeof MaterialCatalog]?.color;
      
      if (raw) {
        const h = raw.replace("#", "");
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
      }
      
      return `rgba(128,128,128,${alpha})`;
    },
    [
      showXRayMode,
      showGeometryColors,
      getElementColorVisibility,
      getElementXRayTransparency,
      getMaterialColor,
    ]
  );

  // Dragging state
  const [draggedLatticeId, setDraggedLatticeId] = React.useState<string | null>(null);
  
  /* ---------- snap helpers (ported from GeometryLayer) ---------- */
  const snapToGrid = React.useCallback(
    (value: number, forceGrid?: boolean, forceResolution?: boolean) => {
      if (forceResolution && project?.scene?.resolution && project.scene.resolution > 1) {
        const res = project.scene.resolution;
        const cell = 1 / res;
        return Math.round(value / cell) * cell;
      } else if (forceGrid) {
        return Math.round(value);
      } else if (resolutionSnapping && project?.scene?.resolution && project.scene.resolution > 1) {
        const res = project.scene.resolution;
        const cell = 1 / res;
        return Math.round(value / cell) * cell;
      } else if (gridSnapping) {
        return Math.round(value);
      }
      return value;
    },
    [gridSnapping, resolutionSnapping, project?.scene?.resolution]
  );
  const snapWithModifiers = React.useCallback(
    (v: number, shift: boolean, ctrl: boolean) => snapToGrid(v, shift, ctrl),
    [snapToGrid]
  );

  /* ---------- overlay helpers ---------- */
  const initialOverlayStates = React.useRef<{ grid: boolean; resolution: boolean } | null>(null);
  const currentOverlayStates  = React.useRef<{ grid: boolean; resolution: boolean } | null>(null);
  const handleDragOverlays = React.useCallback(
    (shift: boolean, ctrl: boolean) => {
      if (!currentOverlayStates.current || !initialOverlayStates.current) return;
      // Grid overlay
      if (shift && !currentOverlayStates.current.grid) {
        toggleShowGrid();
        currentOverlayStates.current.grid = true;
      } else if (
        !shift &&
        currentOverlayStates.current.grid &&
        !initialOverlayStates.current.grid
      ) {
        toggleShowGrid();
        currentOverlayStates.current.grid = false;
      }
      // Resolution overlay
      if (ctrl && !currentOverlayStates.current.resolution) {
        toggleShowResolutionOverlay();
        currentOverlayStates.current.resolution = true;
      } else if (
        !ctrl &&
        currentOverlayStates.current.resolution &&
        !initialOverlayStates.current.resolution
      ) {
        toggleShowResolutionOverlay();
        currentOverlayStates.current.resolution = false;
      }
    },
    [toggleShowGrid, toggleShowResolutionOverlay]
  );
  const restoreOverlayStates = React.useCallback(() => {
    if (initialOverlayStates.current && currentOverlayStates.current) {
      if (initialOverlayStates.current.grid !== currentOverlayStates.current.grid) toggleShowGrid();
      if (initialOverlayStates.current.resolution !== currentOverlayStates.current.resolution)
        toggleShowResolutionOverlay();
      initialOverlayStates.current = null;
      currentOverlayStates.current  = null;
    }
  }, [toggleShowGrid, toggleShowResolutionOverlay]);

  // Track global dragging state
  const [isDraggingLattice, setIsDraggingLattice] = React.useState(false);

  /* ---------- key listeners while dragging ---------- */
  React.useEffect(() => {
    if (!isDraggingLattice) return;
    const kd = (e: KeyboardEvent) =>
      handleDragOverlays(e.shiftKey, e.ctrlKey || e.metaKey);
    const ku = kd;
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [isDraggingLattice, handleDragOverlays]);

  return (
    <>
      {lattices.map((lattice) => {
        const isSelected   = selectedIds.includes(lattice.id);
        const tiedGeometry = lattice.tiedGeometryId
          ? geometries.find(g => g.id === lattice.tiedGeometryId)
          : null;

        /* --- build lattice-point array --- */
        let points: { x: number; y: number }[] = [];
        
        // Check if we have WASM-calculated points for centerFill mode
        if (lattice.fillMode === 'centerFill' && lattice.calculatedPoints) {
          // Use WASM-calculated points (already in local coordinates)
          points = lattice.calculatedPoints.map((p: any) => ({
            x: p.x,
            y: p.y
          }));
        } else {
          // Use manual multiplier-based points
          const mult = lattice.multiplier ?? 3;
          for (let i = -mult; i <= mult; i++) {
            for (let j = -mult; j <= mult; j++) {
              points.push({
                x: i * lattice.basis1.x + j * lattice.basis2.x,
                y: i * lattice.basis1.y + j * lattice.basis2.y,
              });
            }
          }
        }

        return (
          /* position group at lattice origin (canvas px) */
          <Group
            key={lattice.id}
            x={lattice.pos.x * GRID_PX}
            y={lattice.pos.y * GRID_PX}
            draggable
            // ---------- DRAG ----------
            onDragStart={(e) => {
              e.cancelBubble = true;
              setActiveInstructionSet?.("dragging");
              setIsDraggingLattice(true);

              // store overlay states
              if (!initialOverlayStates.current) {
                initialOverlayStates.current = {
                  grid: showGrid,
                  resolution: showResolutionOverlay,
                };
                currentOverlayStates.current = {
                  grid: showGrid,
                  resolution: showResolutionOverlay,
                };
              }

              // Handle multi-select drag
              if (selectedIds.length > 1 && selectedIds.includes(lattice.id)) {
                const initialPositions: Record<string, { x: number; y: number }> = {};
                selectedIds.forEach(id => {
                  const elem = lattices.find(l => l.id === id);
                  if (elem) {
                    initialPositions[id] = { x: elem.pos.x, y: elem.pos.y };
                  }
                });
                setMultiDragAnchor?.({
                  id: lattice.id,
                  anchor: { x: lattice.pos.x, y: lattice.pos.y },
                  initialPositions
                });
              }
            }}
            onDragMove={(e) => {
              const node = e.target as any;
              const shift = e.evt.shiftKey;
              const ctrl  = e.evt.ctrlKey || e.evt.metaKey;

              handleDragOverlays(shift, ctrl);

              /* stage-scale is already handled by Konva – only convert px→lattice */
              const lx = node.x() / GRID_PX;
              const ly = node.y() / GRID_PX;

              const snappedX = snapWithModifiers(lx, shift, ctrl);
              const snappedY = snapWithModifiers(ly, shift, ctrl);

              node.position({ x: snappedX * GRID_PX, y: snappedY * GRID_PX });
              updateLattice(lattice.id, { pos: { x: snappedX, y: snappedY } });
              
              // Handle multi-drag
              if (multiDragAnchor && multiDragAnchor.id === lattice.id && selectedIds.length > 1) {
                const dX = snappedX - multiDragAnchor.anchor.x;
                const dY = snappedY - multiDragAnchor.anchor.y;
                
                selectedIds.forEach(id => {
                  if (id !== lattice.id) {
                    const initial = multiDragAnchor.initialPositions[id];
                    if (initial) {
                      const newPos = {
                        x: initial.x + dX,
                        y: initial.y + dY
                      };
                      updateLattice(id, { pos: newPos });
                    }
                  }
                });
              }
            }}
            onDragEnd={(e) => {
              setActiveInstructionSet?.("default");
              setIsDraggingLattice(false);

              const shift = e.evt.shiftKey;
              const ctrl  = e.evt.ctrlKey || e.evt.metaKey;

              // final snapped position
              const pos = e.target.position();
              const finalX = snapWithModifiers(pos.x / GRID_PX, shift, ctrl);
              const finalY = snapWithModifiers(pos.y / GRID_PX, shift, ctrl);

              handleUpdateLattice(lattice.id, { pos: { x: finalX, y: finalY } });

              // Handle multi-drag commit
              if (multiDragAnchor && selectedIds.length > 1) {
                const dX = finalX - multiDragAnchor.anchor.x;
                const dY = finalY - multiDragAnchor.anchor.y;

                selectedIds.forEach(id => {
                  if (id !== lattice.id) {
                    const initial = multiDragAnchor.initialPositions[id];
                    if (initial) {
                      const newPos = {
                        x: initial.x + dX,
                        y: initial.y + dY
                      };
                      handleUpdateLattice(id, { pos: newPos });
                    }
                  }
                });
              }

              restoreOverlayStates();
            }}
            onClick={(e) => {
              e.cancelBubble = true;
              selectElement(lattice.id, { shift: e.evt.shiftKey });
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              selectElement(lattice.id);
            }}
          >
            {/* basis vectors when selected */}
            {isSelected && (
              <>
                <Line
                  points={[0, 0, lattice.basis1.x * GRID_PX, lattice.basis1.y * GRID_PX]}
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  points={[0, 0, lattice.basis2.x * GRID_PX, lattice.basis2.y * GRID_PX]}
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </>
            )}

            {/* copies / points */}
            {points.map((p, idx) => {
              if (lattice.showMode === "geometry" && tiedGeometry) {
                const fill = getMaterialColorForGeometry(tiedGeometry);
                const opacity = showXRayMode
                  ? getElementXRayTransparency("geometries")
                  : 1;

                // draw relative to group origin
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

              /* lattice point */
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

            {/* origin marker */}
            <Circle
              x={0}
              y={0}
              radius={6 / scale}
              fill={isSelected ? "#f59e0b" : "#888"}
              stroke={isSelected ? "#f59e0b" : "#666"}
              strokeWidth={1 / scale}
            />
          </Group>
        );
      })}
    </>
  );
}
