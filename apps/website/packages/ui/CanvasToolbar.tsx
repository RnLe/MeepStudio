"use client";
import React from "react";
import { useCanvasStore } from "../providers/CanvasStore";
import { Cylinder, Rectangle, Triangle } from "../types/canvasElementTypes";
import { nanoid } from "nanoid";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { MeepProject } from "../types/meepProjectTypes";
import { Circle, Square, Triangle as LucideTriangle, Grid } from "lucide-react";

const GROUPS = [
  { key: "layout", label: "Layout", color: "#b8b5a1", border: "border-[#b8b5a1]", bg: "bg-[#b8b5a1]/20" },
  { key: "geometries", label: "Geometries", color: "#b6a6ca", border: "border-[#b6a6ca]", bg: "bg-[#b6a6ca]/20" },
  { key: "materials", label: "Materials", color: "#c7bca1", border: "border-[#c7bca1]", bg: "bg-[#c7bca1]/20" },
  { key: "sources", label: "Sources", color: "#b1cfc1", border: "border-[#b1cfc1]", bg: "bg-[#b1cfc1]/20" },
  { key: "boundaries", label: "Boundaries", color: "#c9b1bd", border: "border-[#c9b1bd]", bg: "bg-[#c9b1bd]/20" },
  { key: "regions", label: "Regions", color: "#b1b8c9", border: "border-[#b1b8c9]", bg: "bg-[#b1b8c9]/20" },
];

// Define group keys as a union type for type safety
const GROUP_KEYS = [
  "layout",
  "geometries",
  "materials",
  "sources",
  "boundaries",
  "regions",
] as const;
type GroupKey = typeof GROUP_KEYS[number];

interface Tool {
  label: string;
  icon: React.ReactNode;
  onClick: (handler: any) => void;
  fnKey?: string;
  isActive?: (snapToGrid: boolean) => boolean;
}

const layoutTools = [
  {
    label: "Snap to Grid",
    icon: <Grid size={18} />,
    onClick: (toggleSnap: () => void) => toggleSnap(),
    isActive: (snapToGrid: boolean) => snapToGrid,
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

const groupToolMap: Record<GroupKey, Tool[]> = {
  layout: layoutTools,
  geometries: geometryTools,
  materials: [],
  sources: [],
  boundaries: [],
  regions: [],
};

interface CanvasToolbarProps {
  project: MeepProject;
  ghPages: boolean;
  dimension?: number;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ project, dimension, ghPages }) => {
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  const addGeometry = useCanvasStore((s) => s.addGeometry);
  const { updateProject } = useMeepProjects({ ghPages });
  const projectId = project.documentId;
  const geometries = project.geometries || [];

  const newCylinder = () => {
    const newGeom = {
      kind: "cylinder",
      id: nanoid(),
      pos: { x: 5, y: 5 },
      radius: 1,
    } as Cylinder;
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: {
        geometries: [...geometries, newGeom],
      },
    });
  };

  const newRect = () => {
    const newGeom = {
      kind: "rectangle",
      id: nanoid(),
      pos: { x: 10, y: 8 },
      width: 2,
      height: 3,
    } as Rectangle;
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: {
        geometries: [...geometries, newGeom],
      },
    });
  };

  const newTriangle = () => {
    const newGeom = {
      kind: "triangle",
      id: nanoid(),
      pos: { x: 8, y: 8 },
      vertices: [
        { x: 7, y: 7 },
        { x: 9, y: 7 },
        { x: 8, y: 10 },
      ],
    } as Triangle;
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: {
        geometries: [...geometries, newGeom],
      },
    });
  };

  // Tool handlers for dynamic mapping
  const toolHandlers = {
    newCylinder,
    newRect,
    newTriangle,
  };

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
                  className={`flex items-center justify-center w-8 h-8 hover:bg-neutral-700 active:bg-neutral-600 rounded transition-all ${
                    tool.isActive && tool.isActive(snapToGrid) ? "bg-yellow-600/80" : ""
                  }`}
                  onClick={() => {
                    if (tool.onClick && tool.fnKey) {
                      tool.onClick(toolHandlers[tool.fnKey as keyof typeof toolHandlers]);
                    } else if (tool.onClick) {
                      tool.onClick(toggleSnap);
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
