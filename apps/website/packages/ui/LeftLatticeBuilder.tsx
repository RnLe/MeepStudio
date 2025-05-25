import React, { useState } from "react";
import { Square, RectangleHorizontal, Hexagon, Diamond, Triangle, Settings } from "lucide-react";
import CreateLatticeModal from "./CreateLatticeModal";
import LatticeVectorDisplay from "./LatticeVectorDisplay";

interface LeftLatticeBuilderProps {
  onCancel?: () => void;
}

type LatticeType = 'square' | 'rectangular' | 'hexagonal' | 'rhombic' | 'oblique' | 'custom';

const latticeTypes: { type: LatticeType; name: string; icon: React.ComponentType<any>; description: string }[] = [
  { 
    type: 'square', 
    name: 'Square', 
    icon: Square, 
    description: 'Orthogonal lattice with equal sides (a = b, γ = 90°)' 
  },
  { 
    type: 'rectangular', 
    name: 'Rectangular', 
    icon: RectangleHorizontal, 
    description: 'Orthogonal lattice with unequal sides (a ≠ b, γ = 90°)' 
  },
  { 
    type: 'hexagonal', 
    name: 'Hexagonal', 
    icon: Hexagon, 
    description: 'Six-fold symmetric lattice (a = b, γ = 120°)' 
  },
  { 
    type: 'rhombic', 
    name: 'Rhombic', 
    icon: Diamond, 
    description: 'Equal sides with oblique angle (a = b, γ ≠ 90°)' 
  },
  { 
    type: 'oblique', 
    name: 'Oblique', 
    icon: Triangle, 
    description: 'General case with unequal sides and angle (a ≠ b, γ ≠ 90°)' 
  },
  { 
    type: 'custom', 
    name: 'Custom', 
    icon: Settings, 
    description: 'Custom lattice with user-defined basis vectors' 
  },
];

export default function LeftLatticeBuilder({ onCancel }: LeftLatticeBuilderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLatticeType, setSelectedLatticeType] = useState<LatticeType>('square');
  const [hoveredLatticeType, setHoveredLatticeType] = useState<LatticeType | null>(null);
  
  const displayedLatticeType = hoveredLatticeType || selectedLatticeType;

  const handleLatticeTypeClick = (latticeType: LatticeType) => {
    setSelectedLatticeType(latticeType);
  };

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const selectedTypeInfo = latticeTypes.find(type => type.type === selectedLatticeType) || latticeTypes[0];

  return (
    <>
      <div className="flex-1 flex flex-col overflow-y-auto px-3 py-3">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Select Lattice Type</h4>
          <div className="grid grid-cols-2 gap-2">
            {latticeTypes.map((latticeType) => {
              const IconComponent = latticeType.icon;
              const isSelected = selectedLatticeType === latticeType.type;
              const isHovered = hoveredLatticeType === latticeType.type;
              
              return (
                <div key={latticeType.type} className="flex flex-col">
                  <button
                    onClick={() => handleLatticeTypeClick(latticeType.type)}
                    onMouseEnter={() => setHoveredLatticeType(latticeType.type)}
                    onMouseLeave={() => setHoveredLatticeType(null)}
                    className={`group flex items-center justify-center p-1 rounded-lg transition-all mb-1 cursor-pointer ${
                      isSelected 
                        ? 'bg-gray-700/50' 
                        : isHovered
                        ? 'bg-gray-700/30'
                        : 'hover:bg-gray-700/30'
                    }`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <IconComponent className={`w-10 h-10 transition-colors ${
                        isSelected 
                          ? 'text-blue-400' 
                          : 'text-gray-400 group-hover:text-blue-400'
                      }`} />
                    </div>
                  </button>
                  <h3 className="text-xs font-medium text-gray-200 text-center">
                    {latticeType.name}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vector Display */}
        <div className="mb-3">
          <LatticeVectorDisplay latticeType={displayedLatticeType} />
        </div>

        {/* Create Button */}
        <div className="mb-3">
          <button
            onClick={handleCreateClick}
            className="w-full px-3 py-2 bg-transparent border-2 border-dashed border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white rounded text-sm font-medium transition-all cursor-pointer"
          >
            Create {selectedTypeInfo.name} Lattice
          </button>
        </div>
      </div>

      <CreateLatticeModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          if (onCancel) {
            onCancel();
          }
        }}
        latticeType={selectedLatticeType}
        latticeTypeInfo={{
          name: selectedTypeInfo.name,
          description: selectedTypeInfo.description
        }}
      />
    </>
  );
}
