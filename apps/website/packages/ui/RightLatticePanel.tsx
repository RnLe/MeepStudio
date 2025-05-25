import React from "react";
import { Square, RectangleHorizontal, Hexagon, Diamond, Shapes } from "lucide-react";
import { Lattice } from "../types/meepProjectTypes";
import { useMeepProjects } from "../hooks/useMeepProjects";

const latticeTypes = [
  { key: "square", title: "Square", Icon: Square },
  { key: "rectangular", title: "Rectangle", Icon: RectangleHorizontal },
  { key: "hexagonal", title: "Hexagon", Icon: Hexagon },
  { key: "rhombic", title: "Rhombic", Icon: Diamond },
  { key: "oblique", title: "Oblique", Icon: Diamond },
  { key: "custom", title: "Custom", Icon: Shapes },
] as const;

interface Props {
  lattice: Lattice;
  ghPages: boolean;
}

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

  const handleLatticeTypeChange = async (type: typeof latticeTypes[number]["key"]) => {
    let meepLattice;
    let parameters;
    
    switch (type) {
      case "square":
        meepLattice = {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0, y: 1, z: 0 },
          basis_size: { x: 1, y: 1, z: 1 }
        };
        parameters = { a: 1, b: 1, gamma: 90 };
        break;
      case "rectangular":
        meepLattice = {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0, y: 1, z: 0 },
          basis_size: { x: 1, y: 0.5, z: 1 }
        };
        parameters = { a: 1, b: 0.5, gamma: 90 };
        break;
      case "hexagonal":
        meepLattice = {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0.5, y: Math.sqrt(3)/2, z: 0 },
          basis_size: { x: 1, y: 1, z: 1 }
        };
        parameters = { a: 1, b: 1, gamma: 120 };
        break;
      default:
        meepLattice = {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0, y: 1, z: 0 },
          basis_size: { x: 1, y: 1, z: 1 }
        };
        parameters = { a: 1, b: 1, gamma: 90 };
    }
    
    await updateLattice({
      documentId: lattice.documentId,
      lattice: {
        ...lattice,
        latticeType: type,
        meepLattice,
        parameters,
      }
    });
  };
  
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-white text-center">{lattice.title}</h2>
      {lattice.description && (
        <p className="text-sm text-gray-400 text-center">{lattice.description}</p>
      )}
      
      {/* Lattice Type Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Lattice Type</h3>
        <div className="grid grid-cols-3 gap-2">
          {latticeTypes.map(({ key, title, Icon }) => (
            <button
              key={key}
              onClick={() => handleLatticeTypeChange(key)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                lattice.latticeType === key 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Icon size={24} className="mb-1" />
              <span className="text-xs">{title}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Lattice Parameters */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Lattice Parameters</h3>
        <div className="space-y-2 text-xs">
          {lattice.parameters.a !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-400">a:</span>
              <span className="text-gray-300">{lattice.parameters.a}</span>
            </div>
          )}
          {lattice.parameters.b !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-400">b:</span>
              <span className="text-gray-300">{lattice.parameters.b}</span>
            </div>
          )}
          {lattice.parameters.gamma !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-400">γ:</span>
              <span className="text-gray-300">{lattice.parameters.gamma}°</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Display Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Display Options</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-gray-400">Wigner-Seitz Cell</span>
            <input
              type="checkbox"
              checked={displaySettings.showWignerSeitz}
              onChange={() => handleToggle('showWignerSeitz')}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-gray-400">Brillouin Zone</span>
            <input
              type="checkbox"
              checked={displaySettings.showBrillouinZone}
              onChange={() => handleToggle('showBrillouinZone')}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-gray-400">High Symmetry Points</span>
            <input
              type="checkbox"
              checked={displaySettings.showHighSymmetryPoints}
              onChange={() => handleToggle('showHighSymmetryPoints')}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-gray-400">Reciprocal Lattice</span>
            <input
              type="checkbox"
              checked={displaySettings.showReciprocal}
              onChange={() => handleToggle('showReciprocal')}
              className="rounded"
            />
          </label>
        </div>
      </div>
      
      {/* Actions */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Actions</h3>
        <div className="space-y-2">
          <button className="w-full text-xs px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Convert to Scene
          </button>
          <button className="w-full text-xs px-3 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors">
            Export Lattice Points
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightLatticePanel;
