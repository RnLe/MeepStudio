import React from "react";
import { Lattice } from "../types/meepProjectTypes";
import { useMeepProjects } from "../hooks/useMeepProjects";
import LatticeVectorDisplay from "./LatticeVectorDisplay";
import { MathVector, LabeledVector } from "./MathVector";
import { useLatticeStore } from "../providers/LatticeStore";
import CustomLucideIcon from "./CustomLucideIcon";
import { TransformationTooltip, TooltipWrapper } from "./TransformationTooltip";
import { Code2, Layers, Download, LucideIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEditorStateStore } from "../providers/EditorStateStore";

interface Props {
  lattice: Lattice;
  ghPages: boolean;
  onCancel?: () => void;
}

const RightLatticePanel: React.FC<Props> = ({ lattice, ghPages, onCancel }) => {
  const { updateLattice } = useMeepProjects({ ghPages });
  const qc = useQueryClient();
  
  const { 
    isEditingLattice: editing,
    setIsEditingLattice: setEditing
  } = useEditorStateStore();
  
  // Use local state instead of store
  const [localSpaceMode, setLocalSpaceMode] = React.useState<'real' | 'reciprocal'>('real');
  
  // Add state for flash effect
  const [isFlashing, setIsFlashing] = React.useState(false);
  
  // Add edit values state
  const [editValues, setEditValues] = React.useState({
    title: lattice?.title || ""
  });
  
  // Update edit values when lattice changes
  React.useEffect(() => {
    setEditValues({
      title: lattice?.title || ""
    });
  }, [lattice]);
  
  // Handle cancel
  const handleCancel = () => {
    setEditing(false);
    setEditValues({
      title: lattice?.title || ""
    });
    onCancel?.();
  };
  
  // Handle save
  const handleSave = async () => {
    setEditing(false);
    if (lattice) {
      const updated = {
        ...lattice,
        title: editValues.title
      };
      await updateLattice({
        documentId: lattice.documentId,
        lattice: updated
      });
      qc.invalidateQueries({ queryKey: ["meepProjects"] });
    }
  };
  
  // Listen for save event from sidebar
  React.useEffect(() => {
    const handleSaveEvent = () => {
      if (editing) {
        handleSave();
      }
    };
    
    window.addEventListener('rightSidebarSave', handleSaveEvent);
    return () => window.removeEventListener('rightSidebarSave', handleSaveEvent);
  }, [editing, editValues, lattice]);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };
  
  // Get lattice point cache for statistics
  const latticePointCache = useLatticeStore((s) => s.latticePointCache);
  
  // Get zone counts from store
  const realSpaceZoneCount = useLatticeStore((s) => s.realSpaceZoneCount);
  const setRealSpaceZoneCount = useLatticeStore((s) => s.setRealSpaceZoneCount);
  const reciprocalSpaceZoneCount = useLatticeStore((s) => s.reciprocalSpaceZoneCount);
  const setReciprocalSpaceZoneCount = useLatticeStore((s) => s.setReciprocalSpaceZoneCount);
  
  const realSpaceMode = localSpaceMode === 'real';
  
  const displaySettings = lattice.displaySettings || {
    showWignerSeitz: false,
    showBrillouinZone: false,
    showHighSymmetryPoints: false,
    showReciprocal: false,
  };
  
  const handleToggle = async (setting: keyof typeof displaySettings) => {
    await updateLattice({
      documentId: lattice.documentId,
      lattice: {
        ...lattice,
        displaySettings: {
          ...displaySettings,
          [setting]: !displaySettings[setting]
        }
      }
    });
  };
  
  // Handle space mode change with flash effect
  const handleSpaceModeChange = (mode: 'real' | 'reciprocal') => {
    if (mode !== localSpaceMode) {
      setLocalSpaceMode(mode);
      setIsFlashing(true);
      // Remove flash class after animation completes
      setTimeout(() => setIsFlashing(false), 100);
    }
  };
  
  // Calculate real space parameters
  const calculateRealSpaceParams = () => {
    if (!lattice.meepLattice) {
      return { a: 0, b: 0, alpha: 0 };  // Changed gamma to alpha
    }
    
    const a1 = lattice.meepLattice.basis1;
    const a2 = lattice.meepLattice.basis2;
    
    // Calculate lengths
    const a = Math.sqrt(a1.x * a1.x + a1.y * a1.y);
    const b = Math.sqrt(a2.x * a2.x + a2.y * a2.y);
    
    // Calculate angle between a1 and a2
    const dot = a1.x * a2.x + a1.y * a2.y;
    const cosAlpha = dot / (a * b);  // Changed from cosGamma
    const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha))) * 180 / Math.PI;  // Changed from gamma
    
    return { a, b, alpha };  // Changed gamma to alpha
  };
  
  // Calculate reciprocal space parameters
  const calculateReciprocalParams = () => {
    if (!lattice.meepLattice?.reciprocal_basis1 || !lattice.meepLattice?.reciprocal_basis2) {
      return { c: 0, d: 0, beta: 0 };  // Changed alpha to beta
    }
    
    const b1 = lattice.meepLattice.reciprocal_basis1;
    const b2 = lattice.meepLattice.reciprocal_basis2;
    
    // Calculate lengths
    const c = Math.sqrt(b1.x * b1.x + b1.y * b1.y);
    const d = Math.sqrt(b2.x * b2.x + b2.y * b2.y);
    
    // Calculate angle between b1 and b2
    const dot = b1.x * b2.x + b1.y * b2.y;
    const cosBeta = dot / (c * d);  // Changed from cosAlpha
    const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta))) * 180 / Math.PI;  // Changed from alpha
    
    return { c, d, beta };  // Changed alpha to beta
  };
  
  const realSpaceParams = calculateRealSpaceParams();
  const reciprocalParams = calculateReciprocalParams();
  
  // Use calculated values if not provided
  const displayParams = {
    a: lattice.parameters.a ?? realSpaceParams.a,
    b: lattice.parameters.b ?? realSpaceParams.b,
    alpha: lattice.parameters.alpha ?? realSpaceParams.alpha  // Changed gamma to alpha
  };
  
  // Get transformation matrices from store
  const transformationMatrices = useLatticeStore((s) => s.transformationMatrices);
  
  // Calculate transformation matrices
  const getTransformationMatrices = () => {
    if (transformationMatrices) {
      console.log('Using transformation matrices from store:', transformationMatrices);
      // Ensure matrices are properly formatted as 3D arrays
      const formatMatrix = (m: any): number[][] => {
        if (!m || !Array.isArray(m)) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        // If it's a 2x2 matrix, expand to 3x3
        if (m.length === 2 && m[0].length === 2) {
          return [
            [m[0][0], m[0][1], 0],
            [m[1][0], m[1][1], 0],
            [0, 0, 1]
          ];
        }
        return m;
      };
      
      return {
        MA: formatMatrix(transformationMatrices.MA),
        MB: formatMatrix(transformationMatrices.MB),
        TAB: formatMatrix(transformationMatrices.realToReciprocal),
        TBA: formatMatrix(transformationMatrices.reciprocalToReal)
      };
    }
    
    console.log('No transformation matrices found, using identity');
    // Fallback to identity matrices if not calculated yet
    const identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    return { MA: identity, MB: identity, TAB: identity, TBA: identity };
  };
  
  const { MA, MB, TAB, TBA } = getTransformationMatrices();
  
  // Define action buttons
  const actionButtons = [
    {
      label: "Code Editor",
      icon: Code2,
      onClick: () => {
        // TODO: Implement code editor functionality
      }
    },
    {
      label: "Add to Scene",
      icon: Layers,
      onClick: () => {
        // TODO: Implement add to scene functionality
      }
    },
    {
      label: "Export",
      icon: Download,
      onClick: () => {
        // TODO: Implement export functionality
      }
    }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Title and description */}
      <div className="p-4 pb-0">
        {editing ? (
          <input
            className="not-prose text-xl font-semibold text-white text-center rounded px-1 py-0.5 focus:bg-neutral-600 bg-neutral-700 transition-colors outline-none w-full"
            name="title"
            value={editValues.title}
            minLength={1}
            maxLength={128}
            required
            onChange={handleChange}
          />
        ) : (
          <h2 className="text-xl font-semibold text-white text-center">{lattice.title}</h2>
        )}
        {lattice.description && (
          <p className="text-sm text-gray-400 text-center mt-1">{lattice.description}</p>
        )}
      </div>
      
      {/* Space toggle buttons */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex w-full gap-1">
          <button
            onClick={() => handleSpaceModeChange('real')}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
              realSpaceMode 
                ? "bg-neutral-600 text-white" 
                : "bg-neutral-700/30 text-gray-400 hover:bg-neutral-700/50"
            }`}
          >
            Real Space
          </button>
          <button
            onClick={() => handleSpaceModeChange('reciprocal')}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
              !realSpaceMode 
                ? "bg-neutral-600 text-white" 
                : "bg-neutral-700/30 text-gray-400 hover:bg-neutral-700/50"
            }`}
          >
            k-Space
          </button>
        </div>
      </div>
      
      {/* Vector Display */}
      <div className="px-4">
        <LatticeVectorDisplay 
          latticeType={lattice.latticeType || 'square'}
          customVectors={realSpaceMode && lattice.meepLattice ? {
            basis1: lattice.meepLattice.basis1,
            basis2: lattice.meepLattice.basis2
          } : (!realSpaceMode && lattice.meepLattice?.reciprocal_basis1 && lattice.meepLattice?.reciprocal_basis2 ? {
            basis1: lattice.meepLattice.reciprocal_basis1,
            basis2: lattice.meepLattice.reciprocal_basis2
          } : undefined)}
          customAngle={!realSpaceMode ? reciprocalParams.beta : undefined}
          realSpaceMode={realSpaceMode}
        />
      </div>
      
      {/* Calculation Statistics */}
      {latticePointCache?.stats && (
        <div className="px-4 pb-2">
          <div className="bg-neutral-700/30 rounded px-3 py-1">
            <span className="text-gray-400 text-xs">Stats:</span>{" "}
            <span className="text-gray-200 font-mono text-xs">
              {latticePointCache.stats.timeTaken.toFixed(1)} ms •{" "}
              {latticePointCache.stats.pointCount} pts • 
              max {latticePointCache.stats.maxDistance.toFixed(2)}
            </span>
          </div>
        </div>
      )}
      
      {/* Parameters and Vectors in 3-column layout */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {/* Left column - Parameters (3 rows) */}
          <div>
            <h3 className="text-xs font-medium text-gray-300 mb-2">Parameters</h3>
            <div className="grid grid-rows-3 gap-1.5" style={{ minHeight: '90px' }}>
              {realSpaceMode ? (
                <>
                  <div 
                    className="flex items-center justify-between rounded px-2 py-1"
                    style={{
                      backgroundColor: isFlashing ? 'rgba(96, 96, 96, 0.8)' : '#333333',
                      transition: isFlashing ? 'none' : 'background-color 0.4s ease-out'
                    }}
                  >
                    <span className="text-xs text-gray-400">a</span>
                    <span className="text-xs text-gray-200 font-mono">{displayParams.a.toFixed(3)}</span>
                  </div>
                  <div 
                    className="flex items-center justify-between rounded px-2 py-1"
                    style={{
                      backgroundColor: isFlashing ? 'rgba(96, 96, 96, 0.8)' : '#333333',
                      transition: isFlashing ? 'none' : 'background-color 0.4s ease-out'
                    }}
                  >
                    <span className="text-xs text-gray-400">b</span>
                    <span className="text-xs text-gray-200 font-mono">{displayParams.b.toFixed(3)}</span>
                  </div>
                  <div 
                    className="flex items-center justify-between rounded px-2 py-1"
                    style={{
                      backgroundColor: isFlashing ? 'rgba(96, 96, 96, 0.8)' : '#333333',
                      transition: isFlashing ? 'none' : 'background-color 0.4s ease-out'
                    }}
                  >
                    <span className="text-xs text-gray-400">α</span>
                    <span className="text-xs text-gray-200 font-mono">{displayParams.alpha.toFixed(1)}°</span>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    className="flex items-center justify-between rounded px-2 py-1"
                    style={{
                      backgroundColor: isFlashing ? 'rgba(96, 96, 96, 0.8)' : '#333333',
                      transition: isFlashing ? 'none' : 'background-color 0.4s ease-out'
                    }}
                  >
                    <span className="text-xs text-gray-400">c</span>
                    <span className="text-xs text-gray-200 font-mono">{reciprocalParams.c.toFixed(3)}</span>
                  </div>
                  <div 
                    className="flex items-center justify-between rounded px-2 py-1"
                    style={{
                      backgroundColor: isFlashing ? 'rgba(96, 96, 96, 0.8)' : '#333333',
                      transition: isFlashing ? 'none' : 'background-color 0.4s ease-out'
                    }}
                  >
                    <span className="text-xs text-gray-400">d</span>
                    <span className="text-xs text-gray-200 font-mono">{reciprocalParams.d.toFixed(3)}</span>
                  </div>
                  <div 
                    className="flex items-center justify-between rounded px-2 py-1"
                    style={{
                      backgroundColor: isFlashing ? 'rgba(96, 96, 96, 0.8)' : '#333333',
                      transition: isFlashing ? 'none' : 'background-color 0.4s ease-out'
                    }}
                  >
                    <span className="text-xs text-gray-400">β</span>
                    <span className="text-xs text-gray-200 font-mono">{reciprocalParams.beta.toFixed(1)}°</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Middle column - Real Space Vectors (2 rows, normalized to 3-row height) */}
          <div>
            <h3 className="text-xs font-medium text-gray-300 mb-2">Real Space</h3>
            <div className="grid grid-rows-2 gap-1.5" style={{ minHeight: '90px' }}>
              {lattice.meepLattice && (
                <>
                  <div className="bg-neutral-700/50 rounded px-2 py-1 flex items-center">
                    <LabeledVector
                      label="a₁"
                      values={[
                        lattice.meepLattice.basis1.x * lattice.meepLattice.basis_size.x,
                        lattice.meepLattice.basis1.y * lattice.meepLattice.basis_size.y
                      ]}
                      color="text-green-400"
                      size="sm"
                    />
                  </div>
                  <div className="bg-neutral-700/50 rounded px-2 py-1 flex items-center">
                    <LabeledVector
                      label="a₂"
                      values={[
                        lattice.meepLattice.basis2.x * lattice.meepLattice.basis_size.x,
                        lattice.meepLattice.basis2.y * lattice.meepLattice.basis_size.y
                      ]}
                      color="text-amber-400"
                      size="sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Right column - Reciprocal Space Vectors (2 rows, normalized to 3-row height) */}
          <div>
            <h3 className="text-xs font-medium text-gray-300 mb-2">k-Space</h3>
            <div className="grid grid-rows-2 gap-1.5" style={{ minHeight: '90px' }}>
              {lattice.meepLattice?.reciprocal_basis1 && lattice.meepLattice?.reciprocal_basis2 && (
                <>
                  <div className="bg-neutral-700/50 rounded px-2 py-1 flex items-center">
                    <LabeledVector
                      label="b₁"
                      values={[lattice.meepLattice.reciprocal_basis1.x, lattice.meepLattice.reciprocal_basis1.y]}
                      color="text-blue-400"
                      size="sm"
                    />
                  </div>
                  <div className="bg-neutral-700/50 rounded px-2 py-1 flex items-center">
                    <LabeledVector
                      label="b₂"
                      values={[lattice.meepLattice.reciprocal_basis2.x, lattice.meepLattice.reciprocal_basis2.y]}
                      color="text-purple-400"
                      size="sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Transformations Section */}
      <div className="p-4 pt-0">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Transformations</h3>
        <div className="grid grid-cols-2 gap-2">
          <TooltipWrapper
            tooltip={
              <TransformationTooltip
                description="Transforms real to reciprocal coordinates"
                iconSrc="/icons/T_AB.svg"
                matrix={TAB}
                matrixMode="3D"
                iconSize={60}
              />
            }
          >
            <div className="bg-neutral-700/30 rounded p-2 hover:bg-neutral-700/50 transition-colors cursor-pointer flex items-center justify-center h-12">
              <CustomLucideIcon
                src="/icons/T_AB_matrix.svg"
                size={150}
                color="currentColor"
                className="text-gray-300"
              />
            </div>
          </TooltipWrapper>
          
          <TooltipWrapper
            tooltip={
              <TransformationTooltip
                description="Transforms reciprocal to real coordinates"
                iconSrc="/icons/T_BA.svg"
                matrix={TBA}
                matrixMode="3D"
                iconSize={60}
              />
            }
          >
            <div className="bg-neutral-700/30 rounded p-2 hover:bg-neutral-700/50 transition-colors cursor-pointer flex items-center justify-center h-12">
              <CustomLucideIcon
                src="/icons/T_BA_matrix.svg"
                size={150}
                color="currentColor"
                className="text-gray-300"
              />
            </div>
          </TooltipWrapper>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 pt-0 mt-auto">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {actionButtons.map((action, index) => {
            const Icon = action.icon;
            const isLastAndOdd = index === actionButtons.length - 1 && actionButtons.length % 2 === 1;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex flex-col items-center justify-center p-3 rounded bg-neutral-700/30 hover:bg-neutral-700/50 transition-colors group cursor-pointer ${
                  isLastAndOdd ? 'col-span-2' : ''
                }`}
              >
                <Icon 
                  size={20} 
                  className="text-gray-400 group-hover:text-gray-200 transition-colors mb-1"
                />
                <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors text-center">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RightLatticePanel;
