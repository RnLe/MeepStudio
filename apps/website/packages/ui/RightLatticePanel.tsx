import React from "react";
import { Lattice } from "../types/meepProjectTypes";
import { useMeepProjects } from "../hooks/useMeepProjects";
import LatticeVectorDisplay from "./LatticeVectorDisplay";
import { MathVector, LabeledVector } from "./MathVector";

interface Props {
  lattice: Lattice;
  ghPages: boolean;
}

const RightLatticePanel: React.FC<Props> = ({ lattice, ghPages }) => {
  const { updateLattice } = useMeepProjects({ ghPages });
  const [realSpaceMode, setRealSpaceMode] = React.useState(true);
  
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
  
  // Calculate real space parameters
  const calculateRealSpaceParams = () => {
    if (!lattice.meepLattice) {
      return { a: 0, b: 0, gamma: 0 };
    }
    
    const a1 = lattice.meepLattice.basis1;
    const a2 = lattice.meepLattice.basis2;
    
    // Calculate lengths
    const a = Math.sqrt(a1.x * a1.x + a1.y * a1.y);
    const b = Math.sqrt(a2.x * a2.x + a2.y * a2.y);
    
    // Calculate angle between a1 and a2
    const dot = a1.x * a2.x + a1.y * a2.y;
    const cosGamma = dot / (a * b);
    const gamma = Math.acos(Math.max(-1, Math.min(1, cosGamma))) * 180 / Math.PI;
    
    return { a, b, gamma };
  };
  
  // Calculate reciprocal space parameters
  const calculateReciprocalParams = () => {
    if (!lattice.meepLattice?.reciprocal_basis1 || !lattice.meepLattice?.reciprocal_basis2) {
      return { c: 0, d: 0, alpha: 0 };
    }
    
    const b1 = lattice.meepLattice.reciprocal_basis1;
    const b2 = lattice.meepLattice.reciprocal_basis2;
    
    // Calculate lengths
    const c = Math.sqrt(b1.x * b1.x + b1.y * b1.y);
    const d = Math.sqrt(b2.x * b2.x + b2.y * b2.y);
    
    // Calculate angle between b1 and b2
    const dot = b1.x * b2.x + b1.y * b2.y;
    const cosAlpha = dot / (c * d);
    const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha))) * 180 / Math.PI;
    
    return { c, d, alpha };
  };
  
  const realSpaceParams = calculateRealSpaceParams();
  const reciprocalParams = calculateReciprocalParams();
  
  // Use calculated values if not provided
  const displayParams = {
    a: lattice.parameters.a ?? realSpaceParams.a,
    b: lattice.parameters.b ?? realSpaceParams.b,
    gamma: lattice.parameters.gamma ?? realSpaceParams.gamma
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Title and description */}
      <div className="p-4 pb-0">
        <h2 className="text-xl font-semibold text-white text-center">{lattice.title}</h2>
        {lattice.description && (
          <p className="text-sm text-gray-400 text-center mt-1">{lattice.description}</p>
        )}
      </div>
      
      {/* Space toggle buttons */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex w-full gap-1">
          <button
            onClick={() => setRealSpaceMode(true)}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
              realSpaceMode 
                ? "bg-neutral-600 text-white" 
                : "bg-neutral-700/30 text-gray-400 hover:bg-neutral-700/50"
            }`}
          >
            Real Space
          </button>
          <button
            onClick={() => setRealSpaceMode(false)}
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
          customAngle={!realSpaceMode ? reciprocalParams.alpha : undefined}
          realSpaceMode={realSpaceMode}
        />
      </div>
      
      {/* Parameters and Vectors in 3-column layout */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {/* Left column - Parameters (3 rows) */}
          <div>
            <h3 className="text-xs font-medium text-gray-300 mb-2">Parameters</h3>
            <div className="grid grid-rows-3 gap-1.5" style={{ minHeight: '90px' }}>
              {realSpaceMode ? (
                <>
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">a</span>
                    <span className="text-xs text-gray-200 font-mono">{displayParams.a.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">b</span>
                    <span className="text-xs text-gray-200 font-mono">{displayParams.b.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">γ</span>
                    <span className="text-xs text-gray-200 font-mono">{displayParams.gamma.toFixed(1)}°</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">c</span>
                    <span className="text-xs text-gray-200 font-mono">{reciprocalParams.c.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">d</span>
                    <span className="text-xs text-gray-200 font-mono">{reciprocalParams.d.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-700/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">α</span>
                    <span className="text-xs text-gray-200 font-mono">{reciprocalParams.alpha.toFixed(1)}°</span>
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
                      values={[lattice.meepLattice.basis1.x, lattice.meepLattice.basis1.y]}
                      color="text-green-400"
                      size="sm"
                    />
                  </div>
                  <div className="bg-neutral-700/50 rounded px-2 py-1 flex items-center">
                    <LabeledVector
                      label="a₂"
                      values={[lattice.meepLattice.basis2.x, lattice.meepLattice.basis2.y]}
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
      
      {/* Display Options */}
      <div className="p-4 pt-0">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Display Options</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between cursor-pointer bg-neutral-700/30 rounded px-3 py-2 hover:bg-neutral-700/50 transition-colors">
            <span className="text-xs text-gray-400">Wigner-Seitz Cell</span>
            <input
              type="checkbox"
              checked={displaySettings.showWignerSeitz}
              onChange={() => handleToggle('showWignerSeitz')}
              className="rounded bg-neutral-600 border-neutral-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer bg-neutral-700/30 rounded px-3 py-2 hover:bg-neutral-700/50 transition-colors">
            <span className="text-xs text-gray-400">Brillouin Zone</span>
            <input
              type="checkbox"
              checked={displaySettings.showBrillouinZone}
              onChange={() => handleToggle('showBrillouinZone')}
              className="rounded bg-neutral-600 border-neutral-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer bg-neutral-700/30 rounded px-3 py-2 hover:bg-neutral-700/50 transition-colors">
            <span className="text-xs text-gray-400">High Symmetry Points</span>
            <input
              type="checkbox"
              checked={displaySettings.showHighSymmetryPoints}
              onChange={() => handleToggle('showHighSymmetryPoints')}
              className="rounded bg-neutral-600 border-neutral-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer bg-neutral-700/30 rounded px-3 py-2 hover:bg-neutral-700/50 transition-colors">
            <span className="text-xs text-gray-400">Reciprocal Lattice</span>
            <input
              type="checkbox"
              checked={displaySettings.showReciprocal}
              onChange={() => handleToggle('showReciprocal')}
              className="rounded bg-neutral-600 border-neutral-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
          </label>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 pt-0 mt-auto">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Actions</h3>
        <div className="space-y-2">
          <button className="w-full text-xs px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Convert to Scene
          </button>
          <button className="w-full text-xs px-3 py-2 rounded bg-neutral-600 text-white hover:bg-neutral-500 transition-colors">
            Export Lattice Points
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightLatticePanel;
