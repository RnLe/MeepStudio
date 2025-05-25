import React, { useState } from "react";
import { Square, RectangleHorizontal, Hexagon, Diamond, Shapes } from "lucide-react";
import { MeepProject } from "../types/meepProjectTypes";
import LatticeCanvas from "./LatticeCanvas";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useEditorStateStore } from "../providers/EditorStateStore";

const latticeTypes = [
  { key: "square", title: "Square", Icon: Square },
  { key: "rectangle", title: "Rectangle", Icon: RectangleHorizontal },
  { key: "hexagon", title: "Hexagon", Icon: Hexagon },
  { key: "rhombic", title: "Rhombic", Icon: Diamond },
  { key: "oblique", title: "Oblique", Icon: Diamond }, // fallback for oblique
  { key: "custom", title: "Custom", Icon: Shapes },
] as const;

interface Props {
  project: MeepProject;
  ghPages: boolean;
}

export default function LatticeBuilder({ project, ghPages }: Props) {
  const { updateProject } = useMeepProjects({ ghPages });
  const [selectedType, setSelectedType] = useState<string>(
    project.lattice?.latticeData?.latticeType || "square"
  );
  
  const handleLatticeTypeSelect = async (type: typeof latticeTypes[number]["key"]) => {
    setSelectedType(type);
    
    // Initialize lattice based on type
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
      case "rectangle":
        meepLattice = {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0, y: 1, z: 0 },
          basis_size: { x: 1, y: 0.5, z: 1 }
        };
        parameters = { a: 1, b: 0.5, gamma: 90 };
        break;
      case "hexagon":
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
    
    // Update project with new lattice
    await updateProject({
      documentId: project.documentId,
      project: {
        lattice: {
          latticeData: {
            latticeType: type,
            meepLattice,
            parameters,
            displaySettings: {
              showWignerSeitz: false,
              showBrillouinZone: false,
              showHighSymmetryPoints: false,
              showReciprocal: false,
            }
          }
        }
      }
    });
  };
  
  return (
    <div className="flex h-full w-full">
      {/* Left panel for lattice type selection */}
      <div className="w-64 bg-gray-900 border-r border-gray-700 p-4">
        <h3 className="text-white text-sm font-medium mb-4">Select Lattice Type</h3>
        <div className="grid grid-cols-2 gap-3">
          {latticeTypes.map(({ key, title, Icon }) => (
            <div
              key={key}
              onClick={() => handleLatticeTypeSelect(key)}
              className={`flex flex-col items-center justify-center cursor-pointer transition-all ${
                selectedType === key ? "opacity-100" : "opacity-60 hover:opacity-80"
              }`}
            >
              <div className={`flex items-center justify-center aspect-square w-full max-w-[80px] rounded-xl transition group shadow-lg ${
                selectedType === key 
                  ? "bg-blue-600 hover:bg-blue-500" 
                  : "bg-gray-700 hover:bg-gray-600"
              }`}>
                <Icon size={32} className="text-white transition" />
              </div>
              <span className="text-white text-xs font-medium text-center mt-2 select-none">
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Canvas area */}
      <div className="flex-1">
        {project.lattice?.latticeData ? (
          <LatticeCanvas 
            lattice={{
              documentId: `${project.documentId}-lattice`,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              title: `${project.title} Lattice`,
              latticeType: project.lattice.latticeData.latticeType || "square",
              meepLattice: project.lattice.latticeData.meepLattice || {
                basis1: { x: 1, y: 0, z: 0 },
                basis2: { x: 0, y: 1, z: 0 },
                basis_size: { x: 1, y: 1, z: 1 }
              },
              parameters: project.lattice.latticeData.parameters || { a: 1, b: 1, gamma: 90 },
              displaySettings: project.lattice.latticeData.displaySettings || {
                showWignerSeitz: false,
                showBrillouinZone: false,
                showHighSymmetryPoints: false,
                showReciprocal: false,
              },
              latticeData: project.lattice.latticeData
            }}
            ghPages={ghPages} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a lattice type to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}
