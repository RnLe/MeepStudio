import React, { useState, useMemo, useCallback, useEffect } from "react";
import { X, Square, RectangleHorizontal, Hexagon, Diamond, Shapes, Plus, Link2 } from "lucide-react";
import { Vector2d } from "konva/lib/types";
import CustomLucideIcon from "./CustomLucideIcon";
import { useCanvasStore } from "../providers/CanvasStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { MeepProject } from "../types/meepProjectTypes";
import { nanoid } from "nanoid";
import { useLatticeStore } from "packages/providers/LatticeStore";

interface LatticeData {
  basis1: Vector2d;
  basis2: Vector2d;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: MeepProject;
  onLatticeCreated?: () => void;
}

// Lattice type definitions matching LatticeBuilder
type LatticeType = 'square' | 'rectangular' | 'hexagonal' | 'rhombic' | 'oblique' | 'custom';

interface LatticePreset {
  key: LatticeType;
  title: string;
  Icon: React.FC<{ size?: number; className?: string }>;
  defaultParams: {
    a: number;
    b: number;
    alpha: number; // angle in degrees
  };
}

const latticePresets: LatticePreset[] = [
  { 
    key: "square", 
    title: "Square", 
    Icon: Square,
    defaultParams: { a: 1, b: 1, alpha: 90 }
  },
  { 
    key: "rectangular", 
    title: "Rectangular", 
    Icon: RectangleHorizontal,
    defaultParams: { a: 1, b: 0.5, alpha: 90 }
  },
  { 
    key: "hexagonal", 
    title: "Hexagonal", 
    Icon: Hexagon,
    defaultParams: { a: 1, b: 1, alpha: 120 }
  },
  { 
    key: "rhombic", 
    title: "Rhombic", 
    Icon: Diamond,
    defaultParams: { a: 1, b: 1, alpha: 60 }
  },
  { 
    key: "oblique", 
    title: "Oblique", 
    Icon: Shapes,
    defaultParams: { a: 1, b: 0.8, alpha: 75 }
  },
];

export function LatticeBuilderModal({ isOpen, onClose, project, onLatticeCreated }: Props) {
  const [selectedType, setSelectedType] = useState<LatticeType>("square");
  const [parameters, setParameters] = useState({
    a: 1,
    b: 1,
    alpha: 90, // angle between vectors in degrees
  });
  const [title, setTitle] = useState("New Lattice");
  const [isCreating, setIsCreating] = useState(false);
  const [mode, setMode] = useState<"create" | "existing">("create");
  const [selectedExistingLatticeId, setSelectedExistingLatticeId] = useState<string | null>(null);

  const addLattice   = useCanvasStore((s) => s.addLattice);   // keep for canvas drawing
  const setLattices  = useCanvasStore((s) => s.setLattices);  // <-- new explicit sync
  const { createLattice: createFullLattice, updateProject, linkLatticeToProject, lattices } = useMeepProjects({ ghPages: true });
  const { setCurrentBasisVectors, setCurrentLatticeType, triggerCanvasUpdate } = useLatticeStore();

  // Get lattices that are not already linked to this project
  const availableLattices = useMemo(() => {
    const projectLatticeIds = (project.scene?.lattices || [])
      .map((l: any) => l.latticeDocumentId)
      .filter(Boolean);
    
    return lattices.filter(lattice => !projectLatticeIds.includes(lattice.documentId));
  }, [lattices, project.scene?.lattices]);

  // Get selected existing lattice details
  const selectedExistingLattice = useMemo(() => {
    if (!selectedExistingLatticeId) return null;
    return lattices.find(l => l.documentId === selectedExistingLatticeId);
  }, [selectedExistingLatticeId, lattices]);

  // Calculate basis vectors from parameters
  const { basis1, basis2 } = useMemo(() => {
    if (mode === "existing" && selectedExistingLattice) {
      return {
        basis1: { 
          x: selectedExistingLattice.meepLattice.basis1.x, 
          y: selectedExistingLattice.meepLattice.basis1.y 
        },
        basis2: { 
          x: selectedExistingLattice.meepLattice.basis2.x, 
          y: selectedExistingLattice.meepLattice.basis2.y 
        }
      };
    }

    const alphaRad = (parameters.alpha * Math.PI) / 180;
    
    return {
      basis1: { 
        x: parameters.a, 
        y: 0 
      },
      basis2: { 
        x: parameters.b * Math.cos(alphaRad), 
        y: parameters.b * Math.sin(alphaRad) 
      }
    };
  }, [parameters, mode, selectedExistingLattice]);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: LatticePreset) => {
    setSelectedType(preset.key);
    setParameters(preset.defaultParams);
  }, []);

  // Handle parameter changes
  const handleParameterChange = useCallback((param: 'a' | 'b' | 'alpha', value: number) => {
    setParameters(prev => ({ ...prev, [param]: value }));
  }, []);

  // Handle link existing lattice
  const handleLinkExisting = async () => {
    if (!project?.scene || !selectedExistingLatticeId || !selectedExistingLattice) {
      console.error("Missing required data for linking");
      return;
    }

    setIsCreating(true);
    try {
      // Create canvas lattice element
      const canvasLattice = {
        id: nanoid(),
        kind: "lattice" as const,
        pos: { 
          x: (project.scene.rectWidth || 10) / 2, 
          y: (project.scene.rectHeight || 10) / 2 
        },
        basis1: { 
          x: selectedExistingLattice.meepLattice.basis1.x, 
          y: selectedExistingLattice.meepLattice.basis1.y 
        },
        basis2: { 
          x: selectedExistingLattice.meepLattice.basis2.x, 
          y: selectedExistingLattice.meepLattice.basis2.y 
        },
        multiplier: 3,
        showMode: "points" as const,
        latticeDocumentId: selectedExistingLatticeId,
        orientation: 0,
      };

      // Update project with new lattice
      const updatedLattices = [...(project.scene.lattices || []), canvasLattice];
      await updateProject({
        documentId: project.documentId,
        project: {
          scene: {
            ...project.scene,
            lattices: updatedLattices,
          },
        },
      });

      // ⚡ immediate UI refresh
      setLattices(updatedLattices);   // <<–– was commented out

      // Link lattice to project
      linkLatticeToProject(selectedExistingLatticeId, project.documentId);

      // Remove the explicit setLattices call - updateProject handles this now
      // setLattices(updatedLattices);

      // Update Lattice Store if needed
      setCurrentBasisVectors(
        { x: selectedExistingLattice.meepLattice.basis1.x, y: selectedExistingLattice.meepLattice.basis1.y },
        { x: selectedExistingLattice.meepLattice.basis2.x, y: selectedExistingLattice.meepLattice.basis2.y }
      );
      setCurrentLatticeType(selectedExistingLattice.latticeType);
      triggerCanvasUpdate();

      onLatticeCreated?.();
      onClose();
    } catch (error) {
      console.error("Failed to link lattice:", error);
      alert("Failed to link lattice. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle create
  const handleCreate = async () => {
    // Add safety check for project
    if (!project?.scene) {
      console.error("Project or project.scene is undefined");
      return;
    }
    
    setIsCreating(true);
    try {
      // Calculate basis vectors based on lattice type
      let basis1 = { x: 1, y: 0, z: 0 };
      let basis2 = { x: 0, y: 1, z: 0 };

      switch (selectedType) {
        case "square":
          basis1 = { x: parameters.a, y: 0, z: 0 };
          basis2 = { x: 0, y: parameters.a, z: 0 };
          break;
        case "rectangular":
          basis1 = { x: parameters.a, y: 0, z: 0 };
          basis2 = { x: 0, y: parameters.b, z: 0 };
          break;
        case "hexagonal":
          basis1 = { x: parameters.a, y: 0, z: 0 };
          basis2 = { 
            x: parameters.a * Math.cos(Math.PI / 3), 
            y: parameters.a * Math.sin(Math.PI / 3), 
            z: 0 
          };
          break;
      }

      // Create the full lattice in the store
      const fullLattice = await createFullLattice({
        title,
        latticeType: selectedType,
        parameters,
        meepLattice: {
          basis1,
          basis2,
          basis3: { x: 0, y: 0, z: 1 },
          basis_size: { x: 1, y: 1, z: 1 },
        },
      });

      // Create canvas lattice element with safe defaults
      const canvasLattice = {
        id: nanoid(),
        kind: "lattice" as const,
        pos: { 
          x: (project.scene.rectWidth || 10) / 2, 
          y: (project.scene.rectHeight || 10) / 2 
        },
        basis1: { x: basis1.x, y: basis1.y },
        basis2: { x: basis2.x, y: basis2.y },
        multiplier: 3,
        showMode: "points" as const,
        latticeDocumentId: fullLattice.documentId,
        orientation: 0,
      };

      // Update project with new lattice
      const updatedLattices = [...(project.scene.lattices || []), canvasLattice];
      await updateProject({
        documentId: project.documentId,
        project: {
          scene: {
            ...project.scene,
            lattices: updatedLattices,
          },
        },
      });

      // ⚡ immediate UI refresh
      setLattices(updatedLattices);   // <<–– was commented out

      linkLatticeToProject(fullLattice.documentId, project.documentId);

      // Remove the explicit setLattices call - updateProject handles this now
      // setLattices(updatedLattices);

      // Update Lattice Store
      setCurrentBasisVectors(
        { x: basis1.x, y: basis1.y },
        { x: basis2.x, y: basis2.y }
      );
      setCurrentLatticeType(selectedType);
      triggerCanvasUpdate();

      // After successfully creating the lattice
      onLatticeCreated?.();
      onClose();
    } catch (error) {
      console.error("Failed to create lattice:", error);
      alert("Failed to create lattice. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  // Canvas dimensions for preview
  const canvasSize = 200;
  const scale = 40; // pixels per unit
  const center = { x: canvasSize / 2, y: canvasSize / 2 };

  // Generate lattice points for preview
  const latticePoints: { x: number; y: number }[] = [];
  const range = 2; // Show -2 to 2 in each direction
  
  for (let i = -range; i <= range; i++) {
    for (let j = -range; j <= range; j++) {
      const x = center.x + (i * basis1.x + j * basis2.x) * scale;
      const y = center.y - (i * basis1.y + j * basis2.y) * scale; // Flip y for canvas
      
      // Only include points within canvas bounds
      if (x >= 0 && x <= canvasSize && y >= 0 && y <= canvasSize) {
        latticePoints.push({ x, y });
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 rounded-lg p-6 w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Add Lattice to Scene</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Left sidebar - existing lattices */}
          <div className="w-[200px] flex flex-col">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode("create")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  mode === "create"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Plus size={16} />
                Create New
              </button>
              <button
                onClick={() => setMode("existing")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  mode === "existing"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Link2 size={16} />
                Use Existing
              </button>
            </div>

            {mode === "existing" && (
              <div className="flex-1 overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Available Lattices</h3>
                {availableLattices.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center p-4">
                    No available lattices. Create a new one instead.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableLattices.map((lattice) => {
                      const IconComponent = latticePresets.find(p => p.key === lattice.latticeType)?.Icon || Shapes;
                      return (
                        <button
                          key={lattice.documentId}
                          onClick={() => setSelectedExistingLatticeId(lattice.documentId)}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            selectedExistingLatticeId === lattice.documentId
                              ? "bg-blue-600/20 border border-blue-500"
                              : "bg-gray-700/50 border border-transparent hover:bg-gray-700"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <IconComponent size={20} className="text-gray-400 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-white truncate">
                                {lattice.title}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">
                                {lattice.latticeType}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                a={(lattice.parameters?.a ?? 1).toFixed(2)}, b={(lattice.parameters?.b ?? 1).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Middle section - controls or details */}
          <div className="flex-1 space-y-6 overflow-y-auto">
            {mode === "create" ? (
              <>
                {/* Lattice type selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Lattice Type</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {latticePresets.map((preset) => (
                      <button
                        key={preset.key}
                        onClick={() => handlePresetSelect(preset)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                          selectedType === preset.key 
                            ? "bg-blue-600/20 border border-blue-500" 
                            : "bg-gray-700/50 border border-transparent hover:bg-gray-700"
                        }`}
                      >
                        <preset.Icon size={24} className="text-white mb-1" />
                        <span className="text-xs text-gray-300">{preset.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Lattice Name
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Enter lattice name..."
                  />
                </div>

                {/* Parameters */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Parameters</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Length a</span>
                        <span className="text-xs text-gray-500">{parameters.a.toFixed(2)}</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={parameters.a}
                        onChange={(e) => handleParameterChange('a', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Length b</span>
                        <span className="text-xs text-gray-500">{parameters.b.toFixed(2)}</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={parameters.b}
                        onChange={(e) => handleParameterChange('b', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Angle α (degrees)</span>
                        <span className="text-xs text-gray-500">{parameters.alpha.toFixed(0)}°</span>
                      </label>
                      <input
                        type="range"
                        min="30"
                        max="150"
                        step="5"
                        value={parameters.alpha}
                        onChange={(e) => handleParameterChange('alpha', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Existing lattice details
              selectedExistingLattice && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Selected Lattice</h3>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-white mb-2">{selectedExistingLattice.title}</h4>
                      {selectedExistingLattice.description && (
                        <p className="text-sm text-gray-400 mb-3">{selectedExistingLattice.description}</p>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white">{selectedExistingLattice.latticeType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Parameters:</span>
                          <span className="text-white">
                            a={(selectedExistingLattice.parameters?.a ?? 1).toFixed(2)}, 
                            b={(selectedExistingLattice.parameters?.b ?? 1).toFixed(2)}, 
                            α={(selectedExistingLattice.parameters?.alpha ?? 90).toFixed(0)}°
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Vector display */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Basis Vectors</h3>
              <div className="bg-gray-900 rounded p-3 space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <CustomLucideIcon src="/icons/a1_vector.svg" size={20} className="text-blue-400" />
                  <span className="text-gray-400">a₁ = ({basis1.x.toFixed(2)}, {basis1.y.toFixed(2)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <CustomLucideIcon src="/icons/a2_vector.svg" size={20} className="text-green-400" />
                  <span className="text-gray-400">a₂ = ({basis2.x.toFixed(2)}, {basis2.y.toFixed(2)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - preview */}
          <div className="w-[250px]">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Preview</h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <svg width={canvasSize} height={canvasSize} className="w-full h-full">
                {/* Grid lines for reference */}
                <line x1={0} y1={center.y} x2={canvasSize} y2={center.y} stroke="#374151" strokeWidth="1" />
                <line x1={center.x} y1={0} x2={center.x} y2={canvasSize} stroke="#374151" strokeWidth="1" />
                
                {/* Basis vectors */}
                <line
                  x1={center.x}
                  y1={center.y}
                  x2={center.x + basis1.x * scale}
                  y2={center.y - basis1.y * scale}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-blue)"
                />
                <line
                  x1={center.x}
                  y1={center.y}
                  x2={center.x + basis2.x * scale}
                  y2={center.y - basis2.y * scale}
                  stroke="#10b981"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-green)"
                />
                
                {/* Lattice points */}
                {latticePoints.map((point, idx) => (
                  <circle
                    key={idx}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="#6b7280"
                    opacity="0.8"
                  />
                ))}
                
                {/* Center point */}
                <circle cx={center.x} cy={center.y} r="4" fill="#f59e0b" />
                
                {/* Arrow markers */}
                <defs>
                  <marker
                    id="arrowhead-blue"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                  </marker>
                  <marker
                    id="arrowhead-green"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                  </marker>
                </defs>
              </svg>
            </div>
            
            {/* Unit cell indication */}
            <div className="mt-3 text-xs text-gray-500 text-center">
              Unit cell area: {Math.abs(basis1.x * basis2.y - basis1.y * basis2.x).toFixed(3)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          {mode === "create" ? (
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Lattice"}
            </button>
          ) : (
            <button
              onClick={handleLinkExisting}
              disabled={isCreating || !selectedExistingLatticeId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
            >
              {isCreating ? "Linking..." : "Link Lattice"}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #3b82f6;
          cursor: pointer;
          border-radius: 50%;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #3b82f6;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  );
}
