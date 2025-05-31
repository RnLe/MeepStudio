"use client";
import React from "react";
import { useCanvasStore } from "../providers/CanvasStore";
import { Cylinder, Rectangle, Triangle } from "../types/canvasElementTypes";
import { nanoid } from "nanoid";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { MeepProject } from "../types/meepProjectTypes";
import { Circle, Square, Triangle as LucideTriangle, Grid2X2, Grid, Info, BadgeInfo, Zap, Radio, Waves, Beaker, Shield, MoreHorizontal } from "lucide-react";
import CustomLucideIcon from "./CustomLucideIcon";
import { calculateGeometryCenter } from "../utils/geometryCalculations";
import { getSourceDefaults } from "../constants/sourceDefaults";
import { getBoundaryDefaults } from "../constants/boundaryDefaults";
import { MaterialCatalog } from "../constants/meepMaterialPresets";
import MaterialLibraryModal from "./MaterialLibraryModal";

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
  showCanvasInfo: boolean;
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
  {
    label: "Show Canvas Info",
    icon: <Info size={18} className="" />,
    onClick: (toggleShowCanvasInfo: () => void) => toggleShowCanvasInfo(),
    isActive: (state: { showCanvasInfo: boolean }) => state.showCanvasInfo,
    fnKey: "toggleShowCanvasInfo",
  },
];

const sourceTools: Tool[] = [
  {
    label: "Continuous Source",
    icon: <CustomLucideIcon src="/icons/wave_icon.svg" size={32} />,
    onClick: (fn: () => void) => fn(),
    fnKey: "newContinuousSource",
  },
  {
    label: "Gaussian Source",
    icon: <CustomLucideIcon src="/icons/gauss_wave_package.svg" size={32} />,
    onClick: (fn: () => void) => fn(),
    fnKey: "newGaussianSource",
  },
  {
    label: "Eigenmode Source",
    icon: <CustomLucideIcon src="/icons/quantum_harmonic_oscillator.svg" size={32} />,
    onClick: (fn: () => void) => fn(),
    fnKey: "newEigenModeSource",
  },
];

const boundaryTools: Tool[] = [
  {
    label: "PML Boundary",
    icon: <Shield size={18} />,
    onClick: (fn: () => void) => fn(),
    fnKey: "newPMLBoundary",
  },
];

// Helper function to determine if a color is light
function isLightColor(color: string): boolean {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

// Material icon component
const MaterialIcon: React.FC<{ materialKey: string }> = ({ materialKey }) => {
  const material = MaterialCatalog[materialKey as keyof typeof MaterialCatalog];
  if (!material) return null;
  
  return (
    <div 
      className="w-full h-full rounded flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: material.color || "#888" }}
    >
      <span 
        className="font-semibold select-none z-10 text-xs"
        style={{ 
          color: material.color && isLightColor(material.color) ? "#000" : "#fff",
          textShadow: material.color && isLightColor(material.color) 
            ? "0 0 4px rgba(0,0,0,0.2)" 
            : "0 0 4px rgba(255,255,255,0.2)"
        }}
      >
        {material.abbreviation}
      </span>
    </div>
  );
};

// Default material presets - synchronized with MaterialLibraryModal
const DEFAULT_MATERIAL_FAVORITES = [
  "Air",
  "Silicon",
  "Silica",
  "Gold",
  "GalliumArsenide",
  "SiliconNitride"
];

// Default material presets - can be customized later
const DEFAULT_MATERIAL_PRESETS = [
  { name: "Air", key: "Air" },
  { name: "Silicon", key: "Silicon" },
  { name: "Silica", key: "Silica" },
  { name: "Gold", key: "Gold" },
  { name: "GaAs", key: "GalliumArsenide" },
  { name: "Si₃N₄", key: "SiliconNitride" },
];

const groupToolMap: Record<GroupKey, Tool[]> = {
  snapping: snappingTools,
  geometries: geometryTools,
  materials: [], // Will be handled separately
  sources: sourceTools,
  boundaries: boundaryTools,
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
  const addSource = useCanvasStore((s) => s.addSource);
  const addBoundary = useCanvasStore((s) => s.addBoundary);
  const showGrid = useCanvasStore((s) => s.showGrid);
  const toggleShowGrid = useCanvasStore((s) => s.toggleShowGrid);
  const showResolutionOverlay = useCanvasStore((s) => s.showResolutionOverlay);
  const toggleShowResolutionOverlay = useCanvasStore((s) => s.toggleShowResolutionOverlay);
  const showCanvasInfo = useCanvasStore((s) => s.showCanvasInfo);
  const toggleShowCanvasInfo = useCanvasStore((s) => s.toggleShowCanvasInfo);
  const { updateProject } = useMeepProjects({ ghPages });
  const projectId = project.documentId;
  const geometries = project.scene?.geometries || [];
  const sources = project.scene?.sources || [];
  const boundaries = project.scene?.boundaries || [];
  const selectedGeometryIds = useCanvasStore((s) => s.selectedGeometryIds);
  const updateGeometry = useCanvasStore((s) => s.updateGeometry);
  const [showMaterialModal, setShowMaterialModal] = React.useState(false);
  
  // Material favorites state - sorted alphabetically
  const [materialFavorites, setMaterialFavorites] = React.useState<string[]>(
    DEFAULT_MATERIAL_FAVORITES.sort((a, b) => a.localeCompare(b))
  );
  
  // Convert favorites to preset format for toolbar display
  const materialPresets = React.useMemo(() => {
    return materialFavorites.slice(0, 6).map(key => ({
      name: MaterialCatalog[key as keyof typeof MaterialCatalog]?.abbreviation || key,
      key
    }));
  }, [materialFavorites]);
  
  const newCylinder = () => {
    const pos = { x: 1, y: 1 };
    const newGeom = {
      kind: "cylinder",
      id: nanoid(),
      pos,
      radius: 1,
      center: calculateGeometryCenter({ pos }), // Calculate center
    } as Cylinder & { center: { x: number; y: number } };
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
    const pos = { x: 1, y: 1 };
    const newGeom = {
      kind: "rectangle",
      id: nanoid(),
      pos,
      width: 2,
      height: 2,
      center: calculateGeometryCenter({ pos }), // Calculate center
    } as Rectangle & { center: { x: number; y: number } };
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
    const pos = { x: 0, y: 0 };
    const newGeom = {
      kind: "triangle",
      id: nanoid(),
      pos,
      vertices: [
        { x: 0, y: 0 }, // anchor
        { x: 1, y: 0 }, // right
        { x: 0, y: 1 }, // up
      ],
      center: calculateGeometryCenter({ pos }), // Calculate center
    } as Triangle & { center: { x: number; y: number } };
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
  const newContinuousSource = () => {
    const pos = { x: 3, y: 3 };
    const defaults = getSourceDefaults('continuous');
    const newSource = {
      ...defaults,
      kind: "continuousSource",
      id: nanoid(),
      pos,
    };
    addSource(newSource);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          sources: [...sources, newSource],
        },
      },
    });
  };
  const newGaussianSource = () => {
    const pos = { x: 3, y: 3 };
    const defaults = getSourceDefaults('gaussian');
    const newSource = {
      ...defaults,
      kind: "gaussianSource",
      id: nanoid(),
      pos,
    };
    addSource(newSource);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          sources: [...sources, newSource],
        },
      },
    });
  };
  const newEigenModeSource = () => {
    const pos = { x: 3, y: 3 };
    const defaults = getSourceDefaults('eigenmode');
    const newSource = {
      ...defaults,
      kind: "eigenModeSource",
      id: nanoid(),
      pos,
      eig_resolution: 2 * (project.scene?.resolution || 10),
    };
    addSource(newSource);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          sources: [...sources, newSource],
        },
      },
    });
  };
  const newPMLBoundary = () => {
    // Check if PML boundary already exists
    const existingPML = boundaries.find((b: any) => b.kind === "pmlBoundary");
    if (existingPML) {
      // Select the existing PML instead of creating a new one
      useCanvasStore.getState().selectGeometry(existingPML.id);
      return;
    }
    
    const defaults = getBoundaryDefaults('pml');
    const newBoundary = {
      ...defaults,
      id: nanoid(),
    };
    addBoundary(newBoundary);
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          boundaries: [...boundaries, newBoundary],
        },
      },
    });
  };

  // Apply material to selected geometries
  const applyMaterial = (materialKey: string) => {
    if (selectedGeometryIds.length === 0) return;
    
    // Update each selected geometry with the material
    selectedGeometryIds.forEach(id => {
      updateGeometry(id, { material: materialKey });
    });
    
    // Update project
    const updatedGeometries = geometries.map(g => 
      selectedGeometryIds.includes(g.id) 
        ? { ...g, material: materialKey }
        : g
    );
    
    updateProject({
      documentId: projectId,
      project: {
        scene: {
          ...project.scene,
          geometries: updatedGeometries,
        },
      },
    });
  };

  // Toggle favorite handler with alphabetical sorting
  const handleToggleFavorite = (materialKey: string) => {
    setMaterialFavorites(prev => {
      let newFavorites: string[];
      if (prev.includes(materialKey)) {
        newFavorites = prev.filter(k => k !== materialKey);
      } else if (prev.length < 6) {
        newFavorites = [...prev, materialKey];
      } else {
        return prev;
      }
      // Sort alphabetically
      return newFavorites.sort((a, b) => a.localeCompare(b));
    });
  };

  // Tool handlers for dynamic mapping
  const toolHandlers = {
    newCylinder,
    newRect,
    newTriangle,
    newContinuousSource,
    newGaussianSource,
    newEigenModeSource,
    newPMLBoundary,
    toggleShowGrid,
    toggleShowResolutionOverlay,
    toggleShowCanvasInfo,
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
    <>
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
              {group.key === "materials" ? (
                <div className="flex flex-col gap-0.5 w-full px-1">
                  {materialPresets.map((preset) => (
                    <button
                      key={preset.key}
                      title={`Apply ${preset.name} material`}
                      className={`flex items-center justify-center w-full h-5 rounded transition-all
                        ${selectedGeometryIds.length > 0 
                          ? "hover:bg-neutral-600 active:bg-neutral-500" 
                          : "opacity-50 cursor-not-allowed"}
                      `}
                      onClick={() => applyMaterial(preset.key)}
                      disabled={selectedGeometryIds.length === 0}
                      aria-label={`Apply ${preset.name} material`}
                    >
                      <MaterialIcon materialKey={preset.key} />
                    </button>
                  ))}
                  <button
                    className="w-full h-5 flex items-center justify-center text-xs rounded bg-neutral-600 hover:bg-neutral-500 transition-all mt-0.5"
                    onClick={() => setShowMaterialModal(true)}
                  >
                    <MoreHorizontal size={12} className="mr-1" />
                    More
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1 w-full justify-items-center min-h-8">
                  {groupToolMap[group.key as GroupKey].map((tool, i) => {
                    // Determine active color based on tool
                    let activeColor = "bg-yellow-600/60 hover:bg-yellow-500/80"; // default
                    
                    // Use blue color for canvas info tool
                    if (tool.label === "Show Canvas Info") {
                      activeColor = "bg-[#4a7ec7] hover:bg-[#7aa5d8]";
                    }
                    
                    return (
                      <button
                        key={tool.label}
                        title={tool.label}
                        className={`flex items-center justify-center w-8 h-8 rounded transition-all
                          ${tool.isActive && tool.isActive({ gridSnapping, resolutionSnapping, showGrid, showResolutionOverlay, showCanvasInfo })
                            ? activeColor
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
                    );
                  })}
                </div>
              )}
            </div>
            {idx < GROUPS.length - 1 && (
              <hr className="w-10 border-t border-neutral-700 my-1 mx-auto opacity-60" />
            )}
          </React.Fragment>
        ))}
      </aside>
      <MaterialLibraryModal 
        isOpen={showMaterialModal} 
        onClose={() => setShowMaterialModal(false)}
        onSelectMaterial={applyMaterial}
        favorites={materialFavorites}
        onToggleFavorite={handleToggleFavorite}
      />
    </>
  );
};

export default CanvasToolbar;
