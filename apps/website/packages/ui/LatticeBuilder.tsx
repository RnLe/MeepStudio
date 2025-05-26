import React, { useState } from "react";
import { Square, RectangleHorizontal, Hexagon, Diamond, Shapes } from "lucide-react";
import { MeepProject, MeepLattice } from "../types/meepProjectTypes";
import LatticeCanvas from "./LatticeCanvas";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useEditorStateStore } from "../providers/EditorStateStore";
import { reciprocalBasis, calculateTransformationMatrices } from "../utils/latticeCalculations";
import { getWasmModule } from "../utils/wasmLoader";

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
    let meepLattice: MeepLattice;
    let parameters;
    
    switch (type) {
      case "square":
        meepLattice = {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0, y: 1, z: 0 },
          basis3: { x: 0, y: 0, z: 1 },
          basis_size: { x: 1, y: 1, z: 1 }
        };
        parameters = { a: 1, b: 1, alpha: 90 };
        break;
      case "rectangle":
        meepLattice = {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0, y: 1, z: 0 },
          basis3: { x: 0, y: 0, z: 1 },
          basis_size: { x: 1, y: 0.5, z: 1 }
        };
        parameters = { a: 1, b: 0.5, alpha: 90 };
        break;
      case "hexagon":
        meepLattice = {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0.5, y: Math.sqrt(3)/2, z: 0 },
          basis3: { x: 0, y: 0, z: 1 },
          basis_size: { x: 1, y: 1, z: 1 }
        };
        parameters = { a: 1, b: 1, alpha: 120 };
        break;
      default:
        meepLattice = {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0, y: 1, z: 0 },
          basis3: { x: 0, y: 0, z: 1 },
          basis_size: { x: 1, y: 1, z: 1 }
        };
        parameters = { a: 1, b: 1, alpha: 90 };
    }
    
    // Calculate reciprocal basis vectors using WASM
    try {
      const wasm = await getWasmModule();
      
      // Get scaled basis vectors
      const a1 = {
        x: meepLattice.basis1.x * meepLattice.basis_size.x,
        y: meepLattice.basis1.y * meepLattice.basis_size.y,
        z: meepLattice.basis1.z * meepLattice.basis_size.z
      };
      const a2 = {
        x: meepLattice.basis2.x * meepLattice.basis_size.x,
        y: meepLattice.basis2.y * meepLattice.basis_size.y,
        z: meepLattice.basis2.z * meepLattice.basis_size.z
      };
      
      // For 2D lattices, calculate reciprocal basis manually
      const det = a1.x * a2.y - a1.y * a2.x;
      if (Math.abs(det) < 1e-14) {
        throw new Error("Basis vectors are collinear - cannot build reciprocal lattice.");
      }
      
      const factor = 2 * Math.PI / det;
      meepLattice.reciprocal_basis1 = { 
        x: a2.y * factor, 
        y: -a2.x * factor,
        z: 0 
      };
      meepLattice.reciprocal_basis2 = { 
        x: -a1.y * factor, 
        y: a1.x * factor,
        z: 0 
      };
      meepLattice.reciprocal_basis3 = { x: 0, y: 0, z: 2 * Math.PI }; // 2π/1 for z
      
      // Calculate transformation matrices (3D)
      if (wasm.calculate_lattice_transformations_3d) {
        const matrices = wasm.calculate_lattice_transformations_3d(
          a1.x, a1.y, a1.z,
          a2.x, a2.y, a2.z,
          meepLattice.basis3.x * meepLattice.basis_size.x,
          meepLattice.basis3.y * meepLattice.basis_size.y,
          meepLattice.basis3.z * meepLattice.basis_size.z,
          meepLattice.reciprocal_basis1.x, meepLattice.reciprocal_basis1.y, meepLattice.reciprocal_basis1.z,
          meepLattice.reciprocal_basis2.x, meepLattice.reciprocal_basis2.y, meepLattice.reciprocal_basis2.z,
          meepLattice.reciprocal_basis3.x, meepLattice.reciprocal_basis3.y, meepLattice.reciprocal_basis3.z
        );
        
        meepLattice.transformationMatrices = matrices;
      } else if (wasm.calculate_lattice_transformations) {
        // Fallback to 2D version
        const matrices2d = wasm.calculate_lattice_transformations(
          a1.x, a1.y,
          a2.x, a2.y,
          meepLattice.reciprocal_basis1.x, meepLattice.reciprocal_basis1.y,
          meepLattice.reciprocal_basis2.x, meepLattice.reciprocal_basis2.y
        );
        
        // Convert 2x2 matrices to 3x3
        const expandMatrix = (m: any): number[][] => {
          if (!m || !Array.isArray(m)) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
          return [
            [m[0][0], m[0][1], 0],
            [m[1][0], m[1][1], 0],
            [0, 0, 1]
          ];
        };
        
        meepLattice.transformationMatrices = {
          MA: expandMatrix(matrices2d.MA),
          MA_inv: expandMatrix(matrices2d.MA_inv),
          MB: expandMatrix(matrices2d.MB),
          MB_inv: expandMatrix(matrices2d.MB_inv),
          realToReciprocal: expandMatrix(matrices2d.realToReciprocal),
          reciprocalToReal: expandMatrix(matrices2d.reciprocalToReal)
        };
      }
    } catch (error) {
      console.error("Failed to calculate reciprocal lattice:", error);
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
                basis3: { x: 0, y: 0, z: 1 },
                basis_size: { x: 1, y: 1, z: 1 }
              },
              parameters: project.lattice.latticeData.parameters || { a: 1, b: 1, alpha: 90 },
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
