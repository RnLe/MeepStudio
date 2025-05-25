"use client";
import React from "react";
import { useLatticeStore } from "../providers/LatticeStore";
import { Lattice } from "../types/meepProjectTypes";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { Grid2X2, Grid, Hexagon, Box, GitBranch, Sparkles, Eye, Axis3D } from "lucide-react";
import CustomLucideIcon from "./CustomLucideIcon";

const GROUPS = [
  { key: "representation", label: "Representation", color: "#b8b5a1", border: "border-[#b8b5a1]", bg: "bg-[#b8b5a1]/20" },
  { key: "voronoi", label: "Voronoi Cells", color: "#b6a6ca", border: "border-[#b6a6ca]", bg: "bg-[#b6a6ca]/20" },
  { key: "symmetries", label: "Symmetries", color: "#c7bca1", border: "border-[#c7bca1]", bg: "bg-[#c7bca1]/20" },
  { key: "overlays", label: "Overlays", color: "#b1cfc1", border: "border-[#b1cfc1]", bg: "bg-[#b1cfc1]/20" },
];

// Define group keys as a union type for type safety
const GROUP_KEYS = [
  "representation",
  "voronoi", 
  "symmetries",
  "overlays"
] as const;
type GroupKey = typeof GROUP_KEYS[number];

type ToolbarState = {
  showRealSpace: boolean;
  showReciprocalSpace: boolean;
  showWignerSeitzCell: boolean;
  showBrillouinZone: boolean;
  showPointGroup: boolean;
  showSpaceGroup: boolean;
  showHighSymmetryPoints: boolean;
  showLatticePoints: boolean;
  showUnitCell: boolean;
  showAxes: boolean;
};

interface Tool {
  label: string;
  icon: React.ReactNode;
  onClick: (handler: any) => void;
  fnKey?: string;
  isActive?: (state: ToolbarState) => boolean;
}

const representationTools: Tool[] = [
  {
    label: "Real Space",
    icon: <Grid2X2 size={18} />,
    onClick: (toggleShowRealSpace: () => void) => toggleShowRealSpace(),
    isActive: (state) => state.showRealSpace,
    fnKey: "toggleShowRealSpace",
  },
  {
    label: "Reciprocal Space",
    icon: <Grid size={18} />,
    onClick: (toggleShowReciprocalSpace: () => void) => toggleShowReciprocalSpace(),
    isActive: (state) => state.showReciprocalSpace,
    fnKey: "toggleShowReciprocalSpace",
  },
];

const voronoiTools: Tool[] = [
  {
    label: "Wigner-Seitz Cell",
    icon: <Hexagon size={18} />,
    onClick: (toggleShowWignerSeitzCell: () => void) => toggleShowWignerSeitzCell(),
    isActive: (state) => state.showWignerSeitzCell,
    fnKey: "toggleShowWignerSeitzCell",
  },
  {
    label: "Brillouin Zone",
    icon: <Box size={18} />,
    onClick: (toggleShowBrillouinZone: () => void) => toggleShowBrillouinZone(),
    isActive: (state) => state.showBrillouinZone,
    fnKey: "toggleShowBrillouinZone",
  },
];

const symmetryTools: Tool[] = [
  {
    label: "Point Group",
    icon: <GitBranch size={18} />,
    onClick: (toggleShowPointGroup: () => void) => toggleShowPointGroup(),
    isActive: (state) => state.showPointGroup,
    fnKey: "toggleShowPointGroup",
  },
  {
    label: "Space Group",
    icon: <Sparkles size={18} />,
    onClick: (toggleShowSpaceGroup: () => void) => toggleShowSpaceGroup(),
    isActive: (state) => state.showSpaceGroup,
    fnKey: "toggleShowSpaceGroup",
  },
  {
    label: "High Symmetry Points",
    icon: <Eye size={18} />,
    onClick: (toggleShowHighSymmetryPoints: () => void) => toggleShowHighSymmetryPoints(),
    isActive: (state) => state.showHighSymmetryPoints,
    fnKey: "toggleShowHighSymmetryPoints",
  },
];

const overlayTools: Tool[] = [
  {
    label: "Lattice Points",
    icon: <Grid2X2 size={18} />,
    onClick: (toggleShowLatticePoints: () => void) => toggleShowLatticePoints(),
    isActive: (state) => state.showLatticePoints,
    fnKey: "toggleShowLatticePoints",
  },
  {
    label: "Unit Cell",
    icon: <Box size={18} />,
    onClick: (toggleShowUnitCell: () => void) => toggleShowUnitCell(),
    isActive: (state) => state.showUnitCell,
    fnKey: "toggleShowUnitCell",
  },
  {
    label: "Axes",
    icon: <Axis3D size={18} />,
    onClick: (toggleShowAxes: () => void) => toggleShowAxes(),
    isActive: (state) => state.showAxes,
    fnKey: "toggleShowAxes",
  },
];

const groupToolMap: Record<GroupKey, Tool[]> = {
  representation: representationTools,
  voronoi: voronoiTools,
  symmetries: symmetryTools,
  overlays: overlayTools,
};

interface LatticeToolbarProps {
  lattice: Lattice;
  ghPages: boolean;
}

const LatticeToolbar: React.FC<LatticeToolbarProps> = ({ lattice, ghPages }) => {
  const showRealSpace = useLatticeStore((s) => s.showRealSpace);
  const toggleShowRealSpace = useLatticeStore((s) => s.toggleShowRealSpace);
  const showReciprocalSpace = useLatticeStore((s) => s.showReciprocalSpace);
  const toggleShowReciprocalSpace = useLatticeStore((s) => s.toggleShowReciprocalSpace);
  const showWignerSeitzCell = useLatticeStore((s) => s.showWignerSeitzCell);
  const toggleShowWignerSeitzCell = useLatticeStore((s) => s.toggleShowWignerSeitzCell);
  const showBrillouinZone = useLatticeStore((s) => s.showBrillouinZone);
  const toggleShowBrillouinZone = useLatticeStore((s) => s.toggleShowBrillouinZone);
  const showPointGroup = useLatticeStore((s) => s.showPointGroup);
  const toggleShowPointGroup = useLatticeStore((s) => s.toggleShowPointGroup);
  const showSpaceGroup = useLatticeStore((s) => s.showSpaceGroup);
  const toggleShowSpaceGroup = useLatticeStore((s) => s.toggleShowSpaceGroup);
  const showHighSymmetryPoints = useLatticeStore((s) => s.showHighSymmetryPoints);
  const toggleShowHighSymmetryPoints = useLatticeStore((s) => s.toggleShowHighSymmetryPoints);
  const showLatticePoints = useLatticeStore((s) => s.showLatticePoints);
  const toggleShowLatticePoints = useLatticeStore((s) => s.toggleShowLatticePoints);
  const showUnitCell = useLatticeStore((s) => s.showUnitCell);
  const toggleShowUnitCell = useLatticeStore((s) => s.toggleShowUnitCell);
  const showAxes = useLatticeStore((s) => s.showAxes);
  const toggleShowAxes = useLatticeStore((s) => s.toggleShowAxes);
  
  const { updateLattice } = useMeepProjects({ ghPages });
  
  // Tool handlers for dynamic mapping
  const toolHandlers = {
    toggleShowRealSpace,
    toggleShowReciprocalSpace,
    toggleShowWignerSeitzCell,
    toggleShowBrillouinZone,
    toggleShowPointGroup,
    toggleShowSpaceGroup,
    toggleShowHighSymmetryPoints,
    toggleShowLatticePoints,
    toggleShowUnitCell,
    toggleShowAxes,
  };

  const toolbarState: ToolbarState = {
    showRealSpace,
    showReciprocalSpace,
    showWignerSeitzCell,
    showBrillouinZone,
    showPointGroup,
    showSpaceGroup,
    showHighSymmetryPoints,
    showLatticePoints,
    showUnitCell,
    showAxes,
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
                  className={`flex items-center justify-center w-8 h-8 rounded transition-all
                    ${tool.isActive && tool.isActive(toolbarState)
                      ? "bg-yellow-600/60 hover:bg-yellow-500/80"
                      : "hover:bg-neutral-600 active:bg-neutral-600"}
                  `}
                  onClick={() => {
                    if (tool.onClick && tool.fnKey) {
                      tool.onClick(toolHandlers[tool.fnKey as keyof typeof toolHandlers]);
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

export default LatticeToolbar;
