"use client";
import React from "react";
import { useLatticeStore } from "../providers/LatticeStore";
import { Lattice } from "../types/meepProjectTypes";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useLatticeDataLoader } from "../hooks/useLatticeDataLoader";
import { Grid3X3, Grid, Hexagon, Box, GitBranch, Sparkles, Eye, Maximize2, Loader2, Grip, Move3D } from "lucide-react";
import CustomLucideIcon from "./CustomLucideIcon";

const GROUPS = [
  { key: "representation", label: "Representation", color: "#b8b5a1", border: "border-[#b8b5a1]", bg: "bg-[#b8b5a1]/20" },
  { key: "modes", label: "Modes", color: "#a8c5b1", border: "border-[#a8c5b1]", bg: "bg-[#a8c5b1]/20" },
  { key: "voronoi", label: "Voronoi Cells", color: "#b6a6ca", border: "border-[#b6a6ca]", bg: "bg-[#b6a6ca]/20" },
  { key: "symmetries", label: "Symmetries", color: "#c7bca1", border: "border-[#c7bca1]", bg: "bg-[#c7bca1]/20" },
  { key: "overlays", label: "Overlays", color: "#b1cfc1", border: "border-[#b1cfc1]", bg: "bg-[#b1cfc1]/20" },
];

// Define group keys as a union type for type safety
const GROUP_KEYS = [
  "representation",
  "modes",
  "voronoi", 
  "symmetries",
  "overlays"
] as const;
type GroupKey = typeof GROUP_KEYS[number];

type ToolbarState = {
  spaceMode: 'real' | 'reciprocal';
  normalizeMode: boolean;
  showWignerSeitzCell: boolean;
  showBrillouinZone: boolean;
  showPointGroup: boolean;
  showSpaceGroup: boolean;
  showHighSymmetryPoints: boolean;
  showLatticePoints: boolean;
  showUnitCell: boolean;
  showUnitTilesLattice: boolean;
  showGrid: boolean;
  showBaseVectors: boolean;
};

interface Tool {
  label: string;
  icon: React.ReactNode;
  onClick: (handler: any) => void;
  fnKey?: string;
  isActive?: (state: ToolbarState) => boolean;
  fullRow?: boolean;
  linkedTool?: boolean;  // NEW: indicates this tool is linked to another
}

const representationTools: Tool[] = [
  {
    label: "Real Space",
    icon: <CustomLucideIcon src="/icons/r_vector.svg" size={22} />,
    onClick: (setSpaceMode: (mode: 'real' | 'reciprocal') => void) => setSpaceMode('real'),
    isActive: (state) => state.spaceMode === 'real',
    fnKey: "setSpaceModeReal",
  },
  {
    label: "Reciprocal Space",
    icon: <CustomLucideIcon src="/icons/k_vector.svg" size={22} />,
    onClick: (setSpaceMode: (mode: 'real' | 'reciprocal') => void) => setSpaceMode('reciprocal'),
    isActive: (state) => state.spaceMode === 'reciprocal',
    fnKey: "setSpaceModeReciprocal",
  },
];

const modeTools: Tool[] = [
  {
    label: "Normalize Vectors",
    icon: <CustomLucideIcon src="/icons/norm.svg" size={18} />, // back to 18, will be scaled up
    onClick: (toggleNormalizeMode: () => void) => toggleNormalizeMode(),
    isActive: (state) => state.normalizeMode,
    fnKey: "toggleNormalizeMode",
    fullRow: true,
  },
];

const voronoiTools: Tool[] = [
  {
    label: "Wigner-Seitz Cell",
    icon: <CustomLucideIcon src="/icons/hexagon_r.svg" size={22} />,
    onClick: (toggleShowWignerSeitzCell: () => void) => toggleShowWignerSeitzCell(),
    isActive: (state) => state.showWignerSeitzCell,
    fnKey: "toggleShowWignerSeitzCell",
  },
  {
    label: "Brillouin Zone",
    icon: <CustomLucideIcon src="/icons/hexagon_k.svg" size={22} />,
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
    icon: <Grip size={18} />,
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
    label: "Unit Tiles Lattice",
    icon: <CustomLucideIcon src="/icons/hexagon_tiling.svg" size={18} />,
    onClick: (toggleShowUnitTilesLattice: () => void) => toggleShowUnitTilesLattice(),
    isActive: (state) => state.showUnitTilesLattice,
    fnKey: "toggleShowUnitTilesLattice",
    linkedTool: true,
  },
  {
    label: "Grid",
    icon: <Grid3X3 size={18} />,
    onClick: (toggleShowGrid: () => void) => toggleShowGrid(),
    isActive: (state) => state.showGrid,
    fnKey: "toggleShowGrid",
  },
  {
    label: "Base Vectors",
    icon: <Move3D size={18} />,
    onClick: (toggleShowBaseVectors: () => void) => toggleShowBaseVectors(),
    isActive: (state) => state.showBaseVectors,
    fnKey: "toggleShowBaseVectors",
  },
];

const groupToolMap: Record<GroupKey, Tool[]> = {
  representation: representationTools,
  modes: modeTools,
  voronoi: voronoiTools,
  symmetries: symmetryTools,
  overlays: overlayTools,
};

interface LatticeToolbarProps {
  lattice: Lattice;
  ghPages: boolean;
}

const LatticeToolbar: React.FC<LatticeToolbarProps> = ({ lattice, ghPages }) => {
  const spaceMode = useLatticeStore((s) => s.spaceMode);
  const setSpaceMode = useLatticeStore((s) => s.setSpaceMode);
  const normalizeMode = useLatticeStore((s) => s.normalizeMode);
  const toggleNormalizeMode = useLatticeStore((s) => s.toggleNormalizeMode);
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
  const showUnitTilesLattice = useLatticeStore((s) => s.showUnitTilesLattice);
  const toggleShowUnitTilesLattice = useLatticeStore((s) => s.toggleShowUnitTilesLattice);
  const showGrid = useLatticeStore((s) => s.showGrid);
  const toggleShowGrid = useLatticeStore((s) => s.toggleShowGrid);
  const showBaseVectors = useLatticeStore((s) => s.showBaseVectors);
  const toggleShowBaseVectors = useLatticeStore((s) => s.toggleShowBaseVectors);
  
  const isCalculatingVoronoi = useLatticeStore((s) => s.isCalculatingVoronoi);
  
  // Use the lattice data loader
  const { checkAndCalculateVoronoi } = useLatticeDataLoader({ lattice, ghPages });
  
  const { updateLattice } = useMeepProjects({ ghPages });
  
  // Get zone counts from store
  const realSpaceZoneCount = useLatticeStore((s) => s.realSpaceZoneCount);
  const setRealSpaceZoneCount = useLatticeStore((s) => s.setRealSpaceZoneCount);
  const reciprocalSpaceZoneCount = useLatticeStore((s) => s.reciprocalSpaceZoneCount);
  const setReciprocalSpaceZoneCount = useLatticeStore((s) => s.setReciprocalSpaceZoneCount);
  
  // Modified handlers for Voronoi tools with mutual exclusion and space mode switching
  const handleWignerSeitzToggle = async () => {
    const isCurrentlyOff = !showWignerSeitzCell;
    
    // If turning on
    if (isCurrentlyOff) {
      // Switch to real space if not already there
      if (spaceMode !== 'real') {
        setSpaceMode('real');
      }
      // Turn off Brillouin zone if it's on
      if (showBrillouinZone) {
        useLatticeStore.setState({ showBrillouinZone: false });
      }
      // Turn on Wigner-Seitz BEFORE calculating
      useLatticeStore.setState({ showWignerSeitzCell: true });
      // Then calculate if needed
      await checkAndCalculateVoronoi();
    } else {
      // Just turn off
      toggleShowWignerSeitzCell();
    }
  };
  
  const handleBrillouinZoneToggle = async () => {
    const isCurrentlyOff = !showBrillouinZone;
    
    // If turning on
    if (isCurrentlyOff) {
      // Switch to reciprocal space if not already there
      if (spaceMode !== 'reciprocal') {
        setSpaceMode('reciprocal');
      }
      // Turn off Wigner-Seitz if it's on
      if (showWignerSeitzCell) {
        useLatticeStore.setState({ showWignerSeitzCell: false });
      }
      // Turn on Brillouin zone BEFORE calculating
      useLatticeStore.setState({ showBrillouinZone: true });
      // Then calculate if needed
      await checkAndCalculateVoronoi();
    } else {
      // Just turn off
      toggleShowBrillouinZone();
    }
  };
  
  // State for hover effect
  const [hoveredTool, setHoveredTool] = React.useState<string | null>(null);
  
  // Modified handler for unit cell toggle with linked deactivation
  const handleUnitCellToggle = () => {
    // If both are active, deactivate both
    if (showUnitCell && showUnitTilesLattice) {
      useLatticeStore.setState({ 
        showUnitCell: false, 
        showUnitTilesLattice: false 
      });
    } else {
      toggleShowUnitCell();
    }
  };
  
  // Tool handlers for dynamic mapping
  const toolHandlers = {
    setSpaceModeReal: () => setSpaceMode('real'),
    setSpaceModeReciprocal: () => setSpaceMode('reciprocal'),
    toggleNormalizeMode,
    toggleShowWignerSeitzCell: handleWignerSeitzToggle,
    toggleShowBrillouinZone: handleBrillouinZoneToggle,
    toggleShowPointGroup,
    toggleShowSpaceGroup,
    toggleShowHighSymmetryPoints,
    toggleShowLatticePoints,
    toggleShowUnitCell: handleUnitCellToggle,
    toggleShowUnitTilesLattice,
    toggleShowGrid,
    toggleShowBaseVectors,
  };

  const toolbarState: ToolbarState = {
    spaceMode,
    normalizeMode,
    showWignerSeitzCell,
    showBrillouinZone,
    showPointGroup,
    showSpaceGroup,
    showHighSymmetryPoints,
    showLatticePoints,
    showUnitCell,
    showUnitTilesLattice,
    showGrid,
    showBaseVectors,
  };

  return (
    <aside className="h-full w-20 flex flex-col items-center py-2 bg-neutral-700 border-l-white border-l-1 border-r-0">
      {/* Show loading indicator when calculating */}
      {isCalculatingVoronoi && (
        <div className="absolute top-2 right-2 z-50">
          <Loader2 className="animate-spin" size={16} />
        </div>
      )}
      
      {GROUPS.map((group, idx) => (
        <React.Fragment key={group.key}>
          {group.key === "voronoi" ? (
            // Custom rendering for Voronoi group with zone count controls
            <div className="w-full mb-0 flex flex-col items-center py-1 px-1" style={{ minHeight: '84px' }}>
              <div className="text-[10px] font-semibold opacity-60 mb-1 mt-0.5 w-full text-center tracking-wide select-none">
                {group.label}
              </div>
              
              {/* Voronoi cell toggles */}
              <div className="grid grid-cols-2 gap-1 w-full justify-items-center">
                <button
                  title="Wigner-Seitz Cell"
                  className={`flex items-center justify-center w-8 h-8 rounded transition-all
                    ${showWignerSeitzCell
                      ? "bg-[#4a7ec7] hover:bg-[#7aa5d8]"
                      : "hover:bg-neutral-600 active:bg-neutral-600"}
                  `}
                  onClick={handleWignerSeitzToggle}
                  aria-label="Wigner-Seitz Cell"
                >
                  <CustomLucideIcon src="/icons/hexagon_r.svg" size={22} />
                </button>
                <button
                  title="Brillouin Zone"
                  className={`flex items-center justify-center w-8 h-8 rounded transition-all
                    ${showBrillouinZone
                      ? "bg-[#917adb] hover:bg-[#a693e6]"
                      : "hover:bg-neutral-600 active:bg-neutral-600"}
                  `}
                  onClick={handleBrillouinZoneToggle}
                  aria-label="Brillouin Zone"
                >
                  <CustomLucideIcon src="/icons/hexagon_k.svg" size={22} />
                </button>
              </div>
              
              {/* Zone count selector - always reserve space but control visibility */}
              <div 
                className={`flex gap-0.5 mt-1 px-1 transition-all duration-200 ease-in-out ${
                  (showWignerSeitzCell || showBrillouinZone) 
                    ? 'opacity-100' 
                    : 'opacity-0 pointer-events-none'
                }`}
                style={{ height: '20px' }} // Fixed height to prevent layout shift
              >
                {[1, 2, 3, 4, 5].map((count) => {
                  const isActive = showWignerSeitzCell 
                    ? realSpaceZoneCount === count 
                    : reciprocalSpaceZoneCount === count;
                  
                  // Different colors for real space vs reciprocal space
                  const activeColor = showWignerSeitzCell
                    ? "bg-[#4a7ec7] hover:bg-[#7aa5d8]" // Real space: blue
                    : "bg-[#917adb] hover:bg-[#a693e6]"; // Reciprocal space: purple
                  
                  const inactiveColor = "bg-neutral-600/50 hover:bg-neutral-500/70";
                  
                  return (
                    <button
                      key={count}
                      className={`w-3 h-5 text-[10px] rounded transition-all duration-150 text-white
                        ${isActive ? activeColor : inactiveColor}
                      `}
                      onClick={() => {
                        if (showWignerSeitzCell) {
                          setRealSpaceZoneCount(count);
                        } else if (showBrillouinZone) {
                          setReciprocalSpaceZoneCount(count);
                        }
                      }}
                      title={`Show ${count} zone${count > 1 ? 's' : ''}`}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : group.key === "overlays" ? (
            // Custom rendering for overlays group with linked tools
            <div
              className={"w-full mb-0 flex flex-col items-center py-1 px-1"}
              style={{ minHeight: 56 }}
            >
              <div className="text-[10px] font-semibold opacity-60 mb-1 mt-0.5 w-full text-center tracking-wide select-none">
                {group.label}
              </div>
              <div className="grid grid-cols-2 gap-1 w-full justify-items-center min-h-8">
                {/* First row - Lattice Points alone */}
                <button
                  key="Lattice Points"
                  title="Lattice Points"
                  className={`flex items-center justify-center w-8 h-8 rounded transition-all
                    ${showLatticePoints
                      ? "bg-yellow-600/60 hover:bg-yellow-500/80"
                      : "hover:bg-neutral-600 active:bg-neutral-600"}
                  `}
                  onClick={() => toggleShowLatticePoints()}
                  aria-label="Lattice Points"
                >
                  <Grip size={18} />
                </button>
                <div className="w-8 h-8" /> {/* Empty space */}
                
                {/* Second row - Unit Cell and Unit Tiles with link */}
                <div className="col-span-2 grid grid-cols-2 gap-[4] relative">
                  <button
                    key="Unit Cell"
                    title="Unit Cell"
                    className={`flex items-center justify-center w-8 h-8 rounded transition-all relative z-10 justify-self-end -translate-x-px
                      ${showUnitCell
                        ? (showUnitTilesLattice && hoveredTool === "Unit Cell") 
                          ? "bg-yellow-500/80"
                          : "bg-yellow-600/60 hover:bg-yellow-500/80"
                        : (!showUnitCell && !showUnitTilesLattice && hoveredTool === "Unit Tiles Lattice")
                          ? "bg-neutral-500"
                          : "hover:bg-neutral-600 active:bg-neutral-600"}
                    `}
                    onClick={() => handleUnitCellToggle()}
                    aria-label="Unit Cell"
                    onMouseEnter={() => setHoveredTool("Unit Cell")}
                    onMouseLeave={() => setHoveredTool(null)}
                  >
                    <Box size={18} />
                  </button>
                  
                  <button
                    key="Unit Tiles Lattice"
                    title="Unit Tiles Lattice"
                    className={`flex items-center justify-center w-8 h-8 rounded transition-all relative z-10 justify-self-start
                      ${showUnitTilesLattice
                        ? (showUnitCell && hoveredTool === "Unit Cell")
                          ? "bg-yellow-500/80"
                          : "bg-yellow-600/60 hover:bg-yellow-500/80"
                        : (!showUnitCell && !showUnitTilesLattice && hoveredTool === "Unit Tiles Lattice")
                          ? "bg-neutral-500"
                          : "hover:bg-neutral-600 active:bg-neutral-600"}
                    `}
                    onClick={() => toggleShowUnitTilesLattice()}
                    aria-label="Unit Tiles Lattice"
                    onMouseEnter={() => setHoveredTool("Unit Tiles Lattice")}
                    onMouseLeave={() => setHoveredTool(null)}
                  >
                    <CustomLucideIcon src="/icons/box_tiling.svg" size={22} />
                  </button>
                  
                  {/* Link line - positioned absolutely with higher z-index */}
                  <div className="absolute w-3 h-[2px] bg-neutral-400/70 left-1/2 -translate-x-3/5 top-1/2 -translate-y-1/2 z-20" />
                </div>
                
                {/* Third row - Grid and Base Vectors */}
                <button
                  key="Grid"
                  title="Grid"
                  className={`flex items-center justify-center w-8 h-8 rounded transition-all
                    ${showGrid
                      ? "bg-yellow-600/60 hover:bg-yellow-500/80"
                      : "hover:bg-neutral-600 active:bg-neutral-600"}
                  `}
                  onClick={() => toggleShowGrid()}
                  aria-label="Grid"
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  key="Base Vectors"
                  title="Base Vectors"
                  className={`flex items-center justify-center w-8 h-8 rounded transition-all
                    ${showBaseVectors
                      ? "bg-yellow-600/60 hover:bg-yellow-500/80"
                      : "hover:bg-neutral-600 active:bg-neutral-600"}
                  `}
                  onClick={() => toggleShowBaseVectors()}
                  aria-label="Base Vectors"
                >
                  <Move3D size={18} />
                </button>
              </div>
            </div>
          ) : (
            // Default rendering for other groups
            <div
              className={"w-full mb-0 flex flex-col items-center py-1 px-1"}
              style={{ minHeight: 56 }}
            >
              <div className="text-[10px] font-semibold opacity-60 mb-1 mt-0.5 w-full text-center tracking-wide select-none">
                {group.label}
              </div>
              <div className="grid grid-cols-2 gap-1 w-full justify-items-center min-h-8">
                {groupToolMap[group.key as GroupKey].map((tool) => {
                  // scale icon when the button spans both columns
                  let iconNode = tool.icon;
                  
                  if (tool.fullRow && React.isValidElement(tool.icon)) {
                    // Check if it's a CustomLucideIcon by looking at the type
                    if (tool.icon.type === CustomLucideIcon) {
                      iconNode = React.cloneElement(tool.icon as React.ReactElement<any>, {
                        size: 40,
                      });
                    } else {
                      // For regular Lucide icons
                      iconNode = React.cloneElement(tool.icon as React.ReactElement<any>, {
                        size: 40,
                      });
                    }
                  }

                  // Determine active color based on tool
                  let activeColor = "bg-yellow-600/60 hover:bg-yellow-500/80"; // default
                  
                  if (group.key === "representation") {
                    if (tool.label === "Real Space") {
                      activeColor = "bg-[#4a7ec7] hover:bg-[#7aa5d8]";
                    } else if (tool.label === "Reciprocal Space") {
                      activeColor = "bg-[#917adb] hover:bg-[#a693e6]";
                    }
                  }

                  return (
                    <button
                      key={tool.label}
                      title={tool.label}
                      className={`flex items-center justify-center h-8 rounded transition-all
                        ${tool.fullRow ? "col-span-2 w-full" : "w-8"}
                        ${tool.isActive && tool.isActive(toolbarState)
                          ? activeColor
                          : "hover:bg-neutral-600 active:bg-neutral-600"}
                      `}
                      onClick={() => {
                        if (tool.onClick && tool.fnKey) {
                          tool.onClick(toolHandlers[tool.fnKey as keyof typeof toolHandlers]);
                        }
                      }}
                      aria-label={tool.label}
                    >
                      {iconNode}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {idx < GROUPS.length - 1 && (
            <hr className="w-10 border-t border-neutral-700 my-1 mx-auto opacity-60" />
          )}
        </React.Fragment>
      ))}
    </aside>
  );
};

export default LatticeToolbar;
