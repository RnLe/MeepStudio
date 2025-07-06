"use client";
import React from "react";
import { Circle } from "lucide-react";
import { useCanvasStore } from "../../providers/CanvasStore";
import { useMeepProjects } from "../../hooks/useMeepProjects";
import { MeepProject, LengthUnit } from "../../types/meepProjectTypes";
import { Dial } from "../components/Dial";
import { MaterialSelectionMenu } from "../MaterialSelectionMenu";
import { MaterialCatalog } from "../../constants/meepMaterialPresets";
import { useMaterialColorStore } from "../../providers/MaterialColorStore";
import { convertLength } from "../../utils/physicalUnitsHelper";

interface SceneCylinderPropertiesProps {
  cylinder: any;
  project: MeepProject;
  ghPages: boolean;
  projectA?: number;
  projectUnit?: LengthUnit;
}

export const SceneCylinderProperties: React.FC<SceneCylinderPropertiesProps> = ({
  cylinder,
  project,
  ghPages,
  projectA = 1,
  projectUnit = LengthUnit.NM
}) => {
  const { updateGeometry } = useCanvasStore();
  const { updateProject } = useMeepProjects();
  const { getMaterialColor } = useMaterialColorStore();
  
  const [showUnits, setShowUnits] = React.useState(false);
  const [showMaterialMenu, setShowMaterialMenu] = React.useState(false);
  const materialButtonRef = React.useRef<HTMLDivElement>(null);
  
  // Handle geometry updates
  const handleUpdate = async (updates: Partial<any>) => {
    // Update in canvas store
    updateGeometry(cylinder.id, updates);
    
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
          ...cylinder.pos,
          [axis]: num
        }
      });
    }
  };
  
  // Handle material selection
  const handleMaterialSelect = (materialKey: string) => {
    handleUpdate({ material: materialKey });
    setShowMaterialMenu(false);
  };
  
  // Get current material info
  const currentMaterial = MaterialCatalog[cylinder.material as keyof typeof MaterialCatalog] || MaterialCatalog["Air"];
  const materialColor = getMaterialColor(cylinder.material || "Air", currentMaterial?.color);
  const materialDisplayName = currentMaterial?.name || cylinder.material || "Air";
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Circle size={16} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">Cylinder Properties</h3>
      </div>
      
      {/* Name */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Name</label>
        <input
          type="text"
          value={cylinder.name || ''}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          placeholder="Unnamed cylinder"
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded focus:bg-neutral-600 outline-none"
        />
      </div>
      
      {/* Unit Mode Toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setShowUnits(false)}
          className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
            !showUnits 
              ? 'bg-neutral-600 text-white' 
              : 'bg-neutral-700/30 text-gray-400 hover:bg-neutral-700/50'
          }`}
        >
          Scale Free
        </button>
        <button
          onClick={() => setShowUnits(true)}
          className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
            showUnits 
              ? 'bg-neutral-600 text-white' 
              : 'bg-neutral-700/30 text-gray-400 hover:bg-neutral-700/50'
          }`}
        >
          Physical Units
        </button>
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
      <div className="bg-neutral-700/30 rounded-lg p-3">
        <h4 className="text-xs font-medium text-gray-300 mb-3">Geometry</h4>
        
        {/* Radius */}
        <div className="flex justify-center mb-3">
          <div className="flex flex-col items-center">
            <Dial
              value={cylinder.radius || 0.5}
              onChange={(val) => handleUpdate({ radius: val })}
              mode="linear"
              min={0.001}
              max={10}
              step={0.0001}
              size={48}
              label="Radius"
            />
            {showUnits && (
              <div className="text-[9px] text-blue-400 mt-1">
                {convertLength(cylinder.radius || 0.5, projectA, projectUnit)}
              </div>
            )}
          </div>
        </div>
        
        {/* Position */}
        <div className="space-y-2">
          <h5 className="text-[10px] text-gray-400">Position</h5>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                value={cylinder.pos?.x || 0}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
                step="0.1"
              />
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-[9px] text-gray-500">x</span>
                {showUnits && (
                  <span className="text-[9px] text-blue-400">
                    {convertLength(cylinder.pos?.x || 0, projectA, projectUnit)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <input
                type="number"
                value={cylinder.pos?.y || 0}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
                step="0.1"
              />
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-[9px] text-gray-500">y</span>
                {showUnits && (
                  <span className="text-[9px] text-blue-400">
                    {convertLength(cylinder.pos?.y || 0, projectA, projectUnit)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Derived Properties */}
      <div className="bg-neutral-700/30 rounded-lg p-3">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Properties</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Area</span>
            <span className="text-gray-300">
              {(Math.PI * (cylinder.radius || 0.5) ** 2).toFixed(3)}
              {showUnits && (
                <span className="text-blue-400 ml-1">
                  {convertLength((cylinder.radius || 0.5) ** 2, projectA ** 2, projectUnit)}²
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Circumference</span>
            <span className="text-gray-300">
              {(2 * Math.PI * (cylinder.radius || 0.5)).toFixed(3)}
              {showUnits && (
                <span className="text-blue-400 ml-1">
                  {convertLength(2 * Math.PI * (cylinder.radius || 0.5), projectA, projectUnit)}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
      
      {/* Material Selection Menu */}
      <MaterialSelectionMenu
        isOpen={showMaterialMenu}
        onClose={() => setShowMaterialMenu(false)}
        onSelect={handleMaterialSelect}
        currentMaterial={cylinder.material || "Air"}
        anchorEl={materialButtonRef.current}
      />
    </div>
  );
};
