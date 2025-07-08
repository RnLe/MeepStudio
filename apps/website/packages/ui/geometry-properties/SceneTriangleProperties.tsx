"use client";
import React from "react";
import { Triangle as TriangleIcon } from "lucide-react";
import { useCanvasStore } from "../../providers/CanvasStore";
import { useMeepProjects } from "../../hooks/useMeepProjects";
import { MeepProject, LengthUnit } from "../../types/meepProjectTypes";
import { Dial } from "../components/Dial";
import { MaterialSelectionMenu } from "../MaterialSelectionMenu";
import { MaterialCatalog } from "../../constants/meepMaterialPresets";
import { useMaterialColorStore } from "../../providers/MaterialColorStore";
import { convertLength } from "../../utils/physicalUnitsHelper";
import { Vector2d } from "konva/lib/types";
import { RotateCcw } from "lucide-react";

interface SceneTrianglePropertiesProps {
  triangle: any;
  project: MeepProject;
  ghPages: boolean;
  projectA?: number;
  projectUnit?: LengthUnit;
}

export const SceneTriangleProperties: React.FC<SceneTrianglePropertiesProps> = ({
  triangle,
  project,
  ghPages,
  projectA = 1,
  projectUnit = LengthUnit.NM
}) => {
  const { updateGeometry } = useCanvasStore();
  const { updateProject } = useMeepProjects();
  const { getMaterialColor } = useMaterialColorStore();
  
  const [showMaterialMenu, setShowMaterialMenu] = React.useState(false);
  const materialButtonRef = React.useRef<HTMLDivElement>(null);
  
  // Handle geometry updates
  const handleUpdate = async (updates: Partial<any>) => {
    // Update in canvas store
    updateGeometry(triangle.id, updates);
    
    // Update in project
    const geometries = useCanvasStore.getState().geometries;
    await updateProject({
      documentId: project.documentId,
      project: {
        scene: {
          ...project.scene,
          geometries,
        },
      },
    });
  };
  
  // Handle position changes
  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      handleUpdate({
        pos: {
          ...triangle.pos,
          [axis]: num
        }
      });
    }
  };

  // Handle vertex changes
  const handleVertexChange = (vertexIndex: number, axis: 'x' | 'y', value: number) => {
    const newVertices = [...triangle.vertices];
    newVertices[vertexIndex] = {
      ...newVertices[vertexIndex],
      [axis]: value
    };
    handleUpdate({ vertices: newVertices });
  };

  // Handle rotation changes
  const handleRotationChange = (value: number) => {
    handleUpdate({ orientation: value * Math.PI / 180 });
  };
  
  // Handle material selection
  const handleMaterialSelect = (materialKey: string) => {
    handleUpdate({ material: materialKey });
    setShowMaterialMenu(false);
  };
  
  // Get current material info
  const currentMaterial = MaterialCatalog[triangle.material as keyof typeof MaterialCatalog] || MaterialCatalog["Air"];
  const materialColor = getMaterialColor(triangle.material || "Air", currentMaterial?.color);
  const materialDisplayName = currentMaterial?.name || triangle.material || "Air";

  // Vertex colors
  const vertexColors = ['text-purple-400', 'text-pink-400', 'text-amber-400'];
  const vertexBgColors = ['bg-purple-500/20', 'bg-pink-500/20', 'bg-amber-500/20'];

  // Default values for reset functionality
  const defaultTriangle = {
    vertices: [
      { x: 0, y: -0.5 },
      { x: -0.5, y: 0.5 },
      { x: 0.5, y: 0.5 }
    ] as [Vector2d, Vector2d, Vector2d],
    orientation: 0,
    material: "Air"
  };

  // Check if triangle has non-default values
  const hasNonDefaultValues = React.useMemo(() => {
    const vertices = triangle.vertices || defaultTriangle.vertices;
    const orientation = triangle.orientation || 0;
    const material = triangle.material || "Air";
    
    // Check vertices
    const verticesChanged = vertices.some((v: Vector2d, i: number) => 
      Math.abs(v.x - defaultTriangle.vertices[i].x) > 0.001 || 
      Math.abs(v.y - defaultTriangle.vertices[i].y) > 0.001
    );
    
    return verticesChanged || 
           Math.abs(orientation - defaultTriangle.orientation) > 0.001 || 
           material !== defaultTriangle.material;
  }, [triangle.vertices, triangle.orientation, triangle.material]);

  // Reset to default values
  const handleResetTriangle = () => {
    handleUpdate({
      vertices: defaultTriangle.vertices,
      orientation: defaultTriangle.orientation,
      material: defaultTriangle.material
    });
  };
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TriangleIcon size={16} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">Triangle Properties</h3>
      </div>
      
      {/* Name */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Name</label>
        <input
          type="text"
          value={triangle.name || ''}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          placeholder="Unnamed triangle"
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded focus:bg-neutral-600 outline-none"
        />
      </div>
      
      {/* Material */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Material</label>
        <div 
          ref={materialButtonRef}
          className="flex items-center gap-2 cursor-pointer hover:bg-neutral-700 rounded px-2 py-1.5 transition-colors bg-neutral-700/50"
          onClick={() => setShowMaterialMenu(true)}
        >
          <div 
            className="w-3 h-3 rounded-full border border-neutral-600"
            style={{ backgroundColor: materialColor }}
          />
          <span className="text-xs text-gray-300">{materialDisplayName}</span>
        </div>
      </div>

      {/* Geometry Parameters */}
      <div className="bg-neutral-700/30 rounded-lg p-3 relative">
        <h4 className="text-xs font-medium text-gray-300 mb-3">Geometry</h4>
        
        {/* Reset button */}
        {hasNonDefaultValues && (
          <button
            onClick={handleResetTriangle}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-neutral-600 transition-colors group"
            title="Reset to default triangle"
          >
            <RotateCcw size={12} className="text-gray-500 group-hover:text-white transition-colors" />
          </button>
        )}
        
        {/* 2-column layout: Position on left, Triangle visualization on right */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left column - Position */}
          <div className="space-y-2">
            <h5 className="text-xs text-gray-400">Position</h5>
            <div className="space-y-2">
              <div>
                <input
                  type="number"
                  value={(triangle.pos?.x || 0).toFixed(3)}
                  onChange={(e) => handlePositionChange('x', e.target.value)}
                  className="w-full px-1 py-1 text-xs bg-neutral-700 rounded text-gray-200"
                  step="0.001"
                />
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-xs text-gray-500">x</span>
                  <span className="text-xs text-blue-400">
                    {convertLength(triangle.pos?.x || 0, projectA, projectUnit)}
                  </span>
                </div>
              </div>
              <div>
                <input
                  type="number"
                  value={(triangle.pos?.y || 0).toFixed(3)}
                  onChange={(e) => handlePositionChange('y', e.target.value)}
                  className="w-full px-1 py-1 text-xs bg-neutral-700 rounded text-gray-200"
                  step="0.001"
                />
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-xs text-gray-500">y</span>
                  <span className="text-xs text-blue-400">
                    {convertLength(triangle.pos?.y || 0, projectA, projectUnit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Triangle Visualization */}
          <div className="flex justify-center items-center">
            <div className="relative w-20 h-20">
              {/* Triangle visualization */}
              <svg width="80" height="80" className="absolute inset-0">
                {/* Triangle outline with colored sides */}
                <g stroke="currentColor" strokeWidth="2" fill="none">
                  {/* Side 1: from vertex 0 to vertex 1 (purple to pink) */}
                  <line 
                    x1="40" y1="10" 
                    x2="10" y2="70" 
                    className="stroke-purple-400"
                  />
                  {/* Side 2: from vertex 1 to vertex 2 (pink to amber) */}
                  <line 
                    x1="10" y1="70" 
                    x2="70" y2="70" 
                    className="stroke-pink-400"
                  />
                  {/* Side 3: from vertex 2 to vertex 0 (amber to purple) */}
                  <line 
                    x1="70" y1="70" 
                    x2="40" y2="10" 
                    className="stroke-amber-400"
                  />
                </g>
                {/* Vertex points */}
                <circle cx="40" cy="10" r="3" className="fill-purple-400" />
                <circle cx="10" cy="70" r="3" className="fill-pink-400" />
                <circle cx="70" cy="70" r="3" className="fill-amber-400" />
              </svg>
              {/* Vertex labels */}
              <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 text-xs text-purple-400 font-medium">v1</span>
              <span className="absolute bottom-0 left-0 transform -translate-x-1 translate-y-1 text-xs text-pink-400 font-medium">v2</span>
              <span className="absolute bottom-0 right-0 transform translate-x-1 translate-y-1 text-xs text-amber-400 font-medium">v3</span>
            </div>
          </div>
        </div>

        {/* Vertices Section */}
        <div className="mt-4">
          <h5 className="text-xs text-gray-400 mb-2">Vertices (relative)</h5>
          <div className="grid grid-cols-3 gap-3">
            {triangle.vertices?.map((vertex: Vector2d, i: number) => (
              <div key={i} className={`${vertexBgColors[i]} rounded p-2`}>
                <div className={`text-xs font-medium ${vertexColors[i]} mb-2 text-center`}>
                  v{i + 1}
                </div>
                {/* X coordinate dial */}
                <div className="flex flex-col items-center mb-3">
                  <Dial
                    value={vertex.x}
                    onChange={(val) => handleVertexChange(i, 'x', val)}
                    mode="linear"
                    min={-5}
                    max={5}
                    step={0.001}
                    size={32}
                    label="x"
                  />
                  <div className="text-xs text-blue-400 mt-0.5">
                    {convertLength(vertex.x, projectA, projectUnit)}
                  </div>
                </div>
                {/* Y coordinate dial */}
                <div className="flex flex-col items-center">
                  <Dial
                    value={vertex.y}
                    onChange={(val) => handleVertexChange(i, 'y', val)}
                    mode="linear"
                    min={-5}
                    max={5}
                    step={0.001}
                    size={32}
                    label="y"
                  />
                  <div className="text-xs text-blue-400 mt-0.5">
                    {convertLength(vertex.y, projectA, projectUnit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rotation Section */}
        <div className="mt-4">
          <h5 className="text-xs text-gray-400 mb-2">Rotation</h5>
          <div className="space-y-2">
            <input
              type="range"
              min="-180"
              max="180"
              step="0.1"
              value={((triangle.orientation || 0) * 180 / Math.PI).toFixed(1)}
              onChange={(e) => handleRotationChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Rotation</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={((triangle.orientation || 0) * 180 / Math.PI).toFixed(1)}
                  onChange={(e) => handleRotationChange(parseFloat(e.target.value) || 0)}
                  className="w-16 px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200 text-center"
                  step="0.1"
                />
                <span className="text-gray-400">°</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Material Selection Menu */}
      <MaterialSelectionMenu
        isOpen={showMaterialMenu}
        onClose={() => setShowMaterialMenu(false)}
        onSelect={handleMaterialSelect}
        currentMaterial={triangle.material || "Air"}
        anchorEl={materialButtonRef.current}
      />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
        }
      `}</style>
    </div>
  );
};
