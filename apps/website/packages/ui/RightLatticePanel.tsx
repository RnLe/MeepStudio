import React from "react";
import { Lattice } from "../types/meepProjectTypes";
import { useMeepProjects } from "../hooks/useMeepProjects";
import LatticeVectorDisplay from "./LatticeVectorDisplay";
import { MathVector } from "./MathVector";

interface Props {
  lattice: Lattice;
  ghPages: boolean;
}

// Vector display component
const VectorDisplay: React.FC<{ values: number[]; color?: string }> = ({ values, color = "text-gray-200" }) => {
  return (
    <div className={`inline-flex items-center ${color} font-mono text-xs`}>
      <span className="text-lg font-light mr-0.5">[</span>
      <div className="flex flex-col space-y-0.5">
        {values.map((value, index) => (
          <span key={index} className="text-center px-1">
            {value.toFixed(3)}
          </span>
        ))}
      </div>
      <span className="text-lg font-light ml-0.5">]</span>
    </div>
  );
};

const RightLatticePanel: React.FC<Props> = ({ lattice, ghPages }) => {
  const { updateLattice } = useMeepProjects({ ghPages });
  
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
  
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Title and description */}
      <div className="p-4 pb-0">
        <h2 className="text-xl font-semibold text-white text-center">{lattice.title}</h2>
        {lattice.description && (
          <p className="text-sm text-gray-400 text-center mt-1">{lattice.description}</p>
        )}
      </div>
      
      {/* Vector Display */}
      <div className="px-4 pt-4">
        <LatticeVectorDisplay 
          latticeType={lattice.latticeType || 'square'}
          customVectors={lattice.meepLattice ? {
            basis1: lattice.meepLattice.basis1,
            basis2: lattice.meepLattice.basis2
          } : undefined}
        />
      </div>
      
      {/* Parameters and Vectors in 50:50 layout */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Left column - Parameters */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Parameters</h3>
            <div className="space-y-2">
              {lattice.parameters.a !== undefined && (
                <div className="flex items-center justify-between bg-gray-800/50 rounded px-2 py-1.5">
                  <span className="text-xs text-gray-400">a</span>
                  <span className="text-xs text-gray-200 font-mono">{lattice.parameters.a.toFixed(3)}</span>
                </div>
              )}
              {lattice.parameters.b !== undefined && (
                <div className="flex items-center justify-between bg-gray-800/50 rounded px-2 py-1.5">
                  <span className="text-xs text-gray-400">b</span>
                  <span className="text-xs text-gray-200 font-mono">{lattice.parameters.b.toFixed(3)}</span>
                </div>
              )}
              {lattice.parameters.gamma !== undefined && (
                <div className="flex items-center justify-between bg-gray-800/50 rounded px-2 py-1.5">
                  <span className="text-xs text-gray-400">γ</span>
                  <span className="text-xs text-gray-200 font-mono">{lattice.parameters.gamma.toFixed(1)}°</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Right column - Vectors */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Vectors</h3>
            <div className="space-y-2">
              {lattice.meepLattice && (
                <>
                  <div className="bg-gray-800/50 rounded px-2 py-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-green-400">a₁</span>
                    </div>
                    <div className="flex justify-center">
                      <MathVector 
                        values={[
                          lattice.meepLattice.basis1.x, 
                          lattice.meepLattice.basis1.y,
                          ...(lattice.meepLattice.basis1.z !== undefined && lattice.meepLattice.basis1.z !== 0 ? [lattice.meepLattice.basis1.z] : [])
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded px-2 py-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-amber-400">a₂</span>
                    </div>
                    <div className="flex justify-center">
                      <MathVector 
                        values={[
                          lattice.meepLattice.basis2.x, 
                          lattice.meepLattice.basis2.y,
                          ...(lattice.meepLattice.basis2.z !== undefined && lattice.meepLattice.basis2.z !== 0 ? [lattice.meepLattice.basis2.z] : [])
                        ]}
                        size="sm"
                      />
                    </div>
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
          <label className="flex items-center justify-between cursor-pointer bg-gray-800/30 rounded px-3 py-2 hover:bg-gray-800/50 transition-colors">
            <span className="text-xs text-gray-400">Wigner-Seitz Cell</span>
            <input
              type="checkbox"
              checked={displaySettings.showWignerSeitz}
              onChange={() => handleToggle('showWignerSeitz')}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer bg-gray-800/30 rounded px-3 py-2 hover:bg-gray-800/50 transition-colors">
            <span className="text-xs text-gray-400">Brillouin Zone</span>
            <input
              type="checkbox"
              checked={displaySettings.showBrillouinZone}
              onChange={() => handleToggle('showBrillouinZone')}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer bg-gray-800/30 rounded px-3 py-2 hover:bg-gray-800/50 transition-colors">
            <span className="text-xs text-gray-400">High Symmetry Points</span>
            <input
              type="checkbox"
              checked={displaySettings.showHighSymmetryPoints}
              onChange={() => handleToggle('showHighSymmetryPoints')}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer bg-gray-800/30 rounded px-3 py-2 hover:bg-gray-800/50 transition-colors">
            <span className="text-xs text-gray-400">Reciprocal Lattice</span>
            <input
              type="checkbox"
              checked={displaySettings.showReciprocal}
              onChange={() => handleToggle('showReciprocal')}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
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
          <button className="w-full text-xs px-3 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors">
            Export Lattice Points
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightLatticePanel;
