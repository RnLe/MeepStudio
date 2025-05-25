"use client";
import React from "react";
import { useCanvasStore } from "../providers/CanvasStore";
import { Cylinder, Rectangle, Triangle } from "../types/canvasElementTypes";
import { nanoid } from "nanoid";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { MeepProject } from "../types/meepProjectTypes";
import { Circle, Square, Triangle as LucideTriangle, Grid2X2, Grid } from "lucide-react";
import CustomLucideIcon from "./CustomLucideIcon";

const GROUPS = [
  { key: "snapping", label: "Snapping", color: "#b8b5a1", border: "border-[#b8b5a1]", bg: "bg-[#b8b5a1]/20" },
  { key: "geometries", label: "Geometries", color: "#b6a6ca", border: "border-[#b6a6ca]", bg: "bg-[#b6a6ca]/20" },
  { key: "materials", label: "Materials", color: "#c7bca1", border: "border-[#c7bca1]", bg: "bg-[#c7bca1]/20" },
  { key: "sources", label: "Sources", color: "#b1cfc1", border: "border-[#b1cfc1]", bg: "bg-[#b1cfc1]/20" },
  { key: "boundaries", label: "Boundaries", color: "#c9b1bd", border: "border-[#c9b1bd]", bg: "bg-[#c9b1bd]/20" },
  { key: "regions", label: "Regions", color: "#b1b8c9", border: "border-[#b1b8c9]", bg: "bg-[#b1b8c9]/20" },
  { key: "overlays", label: "Overlays", color: "#c9b1b1", border: "border-[#c9b1b1]", bg: "bg-[#c9b1b1]/20" },
];

// Define group keys as a union type for type safety
const GROUP_KEYS = [
  "snapping",
  "geometries",
  "materials",
  "sources",
  "boundaries",
  "regions",
  "overlays"
] as const;
type GroupKey = typeof GROUP_KEYS[number];

type ToolbarState = {
  gridSnapping: boolean;
  resolutionSnapping: boolean;
  showGrid: boolean;
  showResolutionOverlay: boolean;
};

interface Tool {
  label: string;
  icon: React.ReactNode;
  onClick: (handler: any) => void;
  fnKey?: string;
  isActive?: (state: ToolbarState) => boolean;
}

const snappingTools: Tool[] = [
  {
    label: "Snap to Grid",
    icon: (
      <CustomLucideIcon src="/icons/grid-snapping.svg" size={18} />
    ),
    onClick: (handlers: { toggleGridSnapping: () => void; setResolutionSnapping: (val: boolean) => void; gridSnapping: boolean }) => {
      if (!handlers.gridSnapping) handlers.setResolutionSnapping(false);
      handlers.toggleGridSnapping();
    },
    isActive: (state) => state.gridSnapping,
    fnKey: "toggleGridSnapping",
  },
  {
    label: "Snap to Resolution Grid",
    icon: <CustomLucideIcon src="/icons/resolutionGrid-snapping.svg" size={18} className="" />,
    onClick: (handlers: { toggleResolutionSnapping: () => void; setGridSnapping: (val: boolean) => void; resolutionSnapping: boolean }) => {
      if (!handlers.resolutionSnapping) handlers.setGridSnapping(false);
      handlers.toggleResolutionSnapping();
    },
    isActive: (state) => state.resolutionSnapping,
    fnKey: "toggleResolutionSnapping",
  },
];

const geometryTools = [
  {
    label: "Add Circle",
    icon: <Circle size={18} />,
    onClick: (fn: () => void) => fn(),
    fnKey: "newCylinder",
  },
  {
    label: "Add Rectangle",
    icon: <Square size={18} />,
    onClick: (fn: () => void) => fn(),
    fnKey: "newRect",
  },
  {
    label: "Add Triangle",
    icon: <LucideTriangle size={18} />,
    onClick: (fn: () => void) => fn(),
    fnKey: "newTriangle",
  },
];

const overlayTools = [
  {
    label: "Show Grid",
    icon: <Grid2X2 size={18} className="" />,
    onClick: (toggleShowGrid: () => void) => toggleShowGrid(),
    isActive: (state: { showGrid: boolean }) => state.showGrid,
    fnKey: "toggleShowGrid",
  },
  {
    label: "Show Resolution",
    icon: <Grid size={18} className="" />,
    onClick: (toggleShowResolutionOverlay: () => void) => toggleShowResolutionOverlay(),
    isActive: (state: { showResolutionOverlay: boolean }) => state.showResolutionOverlay,
    fnKey: "toggleShowResolutionOverlay",
  },
];

const groupToolMap: Record<GroupKey, Tool[]> = {
  snapping: snappingTools,
  geometries: geometryTools,
  materials: [],
  sources: [],
  boundaries: [],
  regions: [],
  overlays: overlayTools,
};

interface CanvasToolbarProps {
  project: MeepProject;
  ghPages: boolean;
  dimension?: number;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ project, dimension, ghPages }) => {
  const gridSnapping = useCanvasStore((s) => s.gridSnapping);
  const toggleGridSnapping = useCanvasStore((s) => s.toggleGridSnapping);
  const setGridSnapping = (val: boolean) => useCanvasStore.setState({ gridSnapping: val });
  const resolutionSnapping = useCanvasStore((s) => s.resolutionSnapping);
  const toggleResolutionSnapping = useCanvasStore((s) => s.toggleResolutionSnapping);
  const setResolutionSnapping = (val: boolean) => useCanvasStore.setState({ resolutionSnapping: val });
  const addGeometry = useCanvasStore((s) => s.addGeometry);
  const showGrid = useCanvasStore((s) => s.showGrid);
  const toggleShowGrid = useCanvasStore((s) => s.toggleShowGrid);
  const showResolutionOverlay = useCanvasStore((s) => s.showResolutionOverlay);
  const toggleShowResolutionOverlay = useCanvasStore((s) => s.toggleShowResolutionOverlay);
  const { updateProject } = useMeepProjects({ ghPages });  const projectId = project.documentId;
  const geometries = project.scene?.geometries || [];
  const newCylinder = () => {
    const newGeom = {
      kind: "cylinder",
      id: nanoid(),
      pos: { x: 1, y: 1 },
      radius: 1,
    } as Cylinder;
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          geometries: [...geometries, newGeom],
        },
      },
    });
  };
  const newRect = () => {
    const newGeom = {
      kind: "rectangle",
      id: nanoid(),
      pos: { x: 1, y: 1 },
      width: 2,
      height: 2,
    } as Rectangle;
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          geometries: [...geometries, newGeom],
        },
      },
    });
  };
  const newTriangle = () => {
    const newGeom = {
      kind: "triangle",
      id: nanoid(),
      pos: { x: 0, y: 0 },
      vertices: [
        { x: 0, y: 0 }, // anchor
        { x: 1, y: 0 }, // right
        { x: 0, y: 1 }, // up
      ],
    } as Triangle;
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          geometries: [...geometries, newGeom],
        },
      },
    });
  };

  // Tool handlers for dynamic mapping
  const toolHandlers = {
    newCylinder,
    newRect,
    newTriangle,
    toggleShowGrid,
    toggleShowResolutionOverlay,
    toggleGridSnapping,
    toggleResolutionSnapping,
    setGridSnapping,
    setResolutionSnapping,
    gridSnapping,
    resolutionSnapping,
  };

  // --- Virtual drag: onMouseDown starts drag, onMouseUp anywhere ends it ---
  // (Canvas will listen for mouseup to finish the drag)
  return (
    <aside className="h-full w-20 flex flex-col items-center py-2 bg-neutral-700 border-l-white border-l-1 border-r-0">
      {GROUPS.map((group, idx) => (
        <React.Fragment key={group.key}>
          <div
            className={"w-full mb-0 flex flex-col items-center py-1 px-1"}
            style={{ minHeight: 56 }}
          >
            <div className="text-[10px] font-semibold opacity-60 mb-1 mt-0.5 w-full text-center tracking-wide select-none">
              {group.label}
            </div>
            <div className="grid grid-cols-2 gap-1 w-full justify-items-center min-h-8">
              {groupToolMap[group.key as GroupKey].map((tool, i) => (
                <button
                  key={tool.label}
                  title={tool.label}
                  className={`flex items-center justify-center w-8 h-8 rounded transition-all
                    ${tool.isActive && tool.isActive({ gridSnapping, resolutionSnapping, showGrid, showResolutionOverlay })
                      ? "bg-yellow-600/60 hover:bg-yellow-500/80"
                      : "hover:bg-neutral-600 active:bg-neutral-600"}
                  `}
                  onClick={() => {
                    if (tool.fnKey === "toggleGridSnapping") {
                      tool.onClick({ toggleGridSnapping, setResolutionSnapping, gridSnapping });
                    } else if (tool.fnKey === "toggleResolutionSnapping") {
                      tool.onClick({ toggleResolutionSnapping, setGridSnapping, resolutionSnapping });
                    } else if (tool.onClick && tool.fnKey) {
                      tool.onClick(toolHandlers[tool.fnKey as keyof typeof toolHandlers]);
                    } else if (tool.onClick) {
                      tool.onClick(toggleGridSnapping);
                    }
                  }}
                  aria-label={tool.label}
                >
                  {tool.icon}
                </button>
              ))}
            </div>
          </div>
          {idx < GROUPS.length - 1 && (
            <hr className="w-10 border-t border-neutral-700 my-1 mx-auto opacity-60" />
          )}
        </React.Fragment>
      ))}
    </aside>
  );
};

export default CanvasToolbar;
