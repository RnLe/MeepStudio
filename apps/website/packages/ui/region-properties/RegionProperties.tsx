"use client";
import React from "react";
import { useCanvasStore } from "../../providers/CanvasStore";
import { RegionDirection } from "../../types/meepRegionTypes";
import { Target, Zap, Shield } from "lucide-react";
import { Dial } from "../components/Dial";
import CustomLucideIcon from "../CustomLucideIcon";
import { LengthUnit } from "../../types/meepProjectTypes";
import { 
  convertLength,
} from "../../utils/physicalUnitsHelper";

interface RegionPropertiesProps {
  region: any;
  onUpdate: (partial: Partial<any>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  projectUnit?: LengthUnit;
  projectA?: number;
}

export const RegionProperties: React.FC<RegionPropertiesProps> = ({ 
  region, 
  onUpdate,
  onDragStart,
  onDragEnd,
  projectUnit = LengthUnit.NM,
  projectA = 1
}) => {
  // ─────────────────────────── State Management ───────────────────────────
  const [lineOrientation, setLineOrientation] = React.useState<'horizontal' | 'vertical'>('horizontal');
  const [areaOrientation, setAreaOrientation] = React.useState<'wide' | 'tall'>('wide');

  // ────────────────────────── Event Handlers ──────────────────────────────
  const handleVectorChange = (field: string, axis: 'x' | 'y' | 'z', value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdate({
        [field]: {
          ...(region[field] || { x: 0, y: 0, z: 0 }),
          [axis]: num
        }
      });
    }
  };

  // ─────────────────────── Region Type Detection ───────────────────────
  const sizeX = region.size?.x || 0;
  const sizeY = region.size?.y || 0;
  const regionShape = sizeX === 0 && sizeY === 0 ? 'Point' : 
                     (sizeX === 0 || sizeY === 0) ? 'Line' : 'Area';

  // ────────────────────────── Region Type Info ──────────────────────────────
  const getRegionTypeInfo = (regionType: string) => {
    switch (regionType) {
      case 'flux':
        return { 
          icon: Target, 
          color: 'text-red-400', 
          name: 'Flux Region',
          description: 'Poynting vector flux calculation'
        };
      case 'energy':
        return { 
          icon: Zap, 
          color: 'text-orange-400', 
          name: 'Energy Region',
          description: 'Energy density integral'
        };
      case 'force':
        return { 
          icon: Shield, 
          color: 'text-purple-400', 
          name: 'Force Region',
          description: 'Stress tensor integral'
        };
      default:
        return { 
          icon: Target, 
          color: 'text-gray-400', 
          name: 'Region',
          description: 'FDTD analysis region'
        };
    }
  };

  const regionTypeInfo = getRegionTypeInfo(region.regionType || 'flux');
  const RegionIcon = regionTypeInfo.icon;

  // ────────────────────────── Formatting Helpers ──────────────────────────
  const formatValue = (value: number, decimals: number = 2) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // ─────────────────────── Preset Button Handlers ─────────────────────────
  const handlePointPreset = () => {
    onUpdate({ size: { x: 0, y: 0 } });
  };

  const handleLinePreset = () => {
    if (regionShape === 'Line') {
      // Transpose existing line
      onUpdate({ size: { x: sizeY, y: sizeX } });
      setLineOrientation(sizeX > 0 ? 'vertical' : 'horizontal');
    } else if (regionShape === 'Point') {
      // Create line from point based on orientation
      if (lineOrientation === 'horizontal') {
        onUpdate({ size: { x: 1, y: 0 } });
      } else {
        onUpdate({ size: { x: 0, y: 1 } });
      }
    } else {
      // Convert area to line
      onUpdate({ size: { x: sizeX, y: 0 } });
      setLineOrientation('horizontal');
    }
  };

  const handleAreaPreset = () => {
    if (regionShape === 'Area') {
      // Transpose existing area
      onUpdate({ size: { x: sizeY, y: sizeX } });
      // Toggle orientation state
      if (sizeX === sizeY) {
        setAreaOrientation(prev => prev === 'wide' ? 'tall' : 'wide');
      } else {
        setAreaOrientation(sizeX >= sizeY ? 'tall' : 'wide');
      }
    } else if (regionShape === 'Point') {
      // Create area from point
      onUpdate({ size: { x: 1, y: 1 } });
    } else if (regionShape === 'Line') {
      // Convert line to area
      onUpdate({ size: { x: sizeX || 1, y: sizeY || 1 } });
    }
  };

  // ────────────────────── Orientation Updates ──────────────────────────
  React.useEffect(() => {
    if (regionShape === 'Line') {
      setLineOrientation(sizeX > 0 ? 'horizontal' : 'vertical');
    } else if (regionShape === 'Area' && sizeX !== sizeY) {
      setAreaOrientation(sizeX > sizeY ? 'wide' : 'tall');
    }
  }, [sizeX, sizeY, regionShape]);

  // Get direction label
  const getDirectionLabel = (dir: number) => {
    switch (dir) {
      case RegionDirection.X: return 'X';
      case RegionDirection.Y: return 'Y';
      case RegionDirection.Z: return 'Z';
      default: return 'X';
    }
  };

  // Handle manual direction selection
  const handleDirectionSelection = (dir: RegionDirection) => {
    onUpdate({ direction: dir });
  };

  // Get axis color based on direction
  const getAxisColor = (dir: RegionDirection) => {
    switch (dir) {
      case RegionDirection.X: return 'bg-red-500';
      case RegionDirection.Y: return 'bg-green-500'; 
      case RegionDirection.Z: return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Get axis text color based on direction  
  const getAxisTextColor = (dir: RegionDirection) => {
    switch (dir) {
      case RegionDirection.X: return 'text-red-400';
      case RegionDirection.Y: return 'text-green-400';
      case RegionDirection.Z: return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const actualDirection = region.direction ?? RegionDirection.X; // Default to X
  const directionSign = region.directionSign ?? 1;

  return (
    <div className="space-y-2">
      {/* ──────────────────────── Header Section ────────────────────────── */}
      <div className="flex items-center gap-2">
        <RegionIcon size={30} className={regionTypeInfo.color} />
        <div>
          <h3 className="text-sm font-medium text-gray-300">{regionTypeInfo.name}</h3>
          <p className="text-xs text-gray-500">{regionTypeInfo.description}</p>
        </div>
      </div>
      
      {/* ────────────────────── Region Type Badge ───────────────────────── */}
      <div className="text-xs text-gray-400 bg-neutral-700/50 rounded px-2 py-1">
        Shape: <span className="text-gray-200 font-medium">{regionShape}</span>
        <span className="text-gray-500 mx-2">•</span>
        Type: <span className="text-gray-200 font-medium">{region.regionType || 'flux'}</span>
        {regionShape === 'Area' && (
          <>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-orange-400 text-xs">Note: Use Region Box for flux measurements through area boundaries</span>
          </>
        )}
      </div>
      
      {/* ─────────────── Region Properties ─────────────────── */}
      <div className="bg-neutral-700/30 rounded-lg p-2">
        <label className="text-[10px] text-gray-400 block mb-2">Region Properties</label>
        
        {/* Region Type */}
        <div className="mb-3">
          <label className="text-[9px] text-gray-400 block mb-2">Type</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => onUpdate({ regionType: 'flux' })}
              className={`flex flex-col items-center px-2 py-2 text-xs rounded transition-colors ${
                (region.regionType || 'flux') === 'flux'
                  ? 'bg-red-500 text-white' 
                  : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
              }`}
            >
              <Target size={16} />
              <span className="text-[9px] mt-1">Flux</span>
            </button>
            <button
              onClick={() => onUpdate({ regionType: 'energy' })}
              className={`flex flex-col items-center px-2 py-2 text-xs rounded transition-colors ${
                region.regionType === 'energy'
                  ? 'bg-orange-500 text-white' 
                  : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
              }`}
            >
              <Zap size={16} />
              <span className="text-[9px] mt-1">Energy</span>
            </button>
            <button
              onClick={() => onUpdate({ regionType: 'force' })}
              className={`flex flex-col items-center px-2 py-2 text-xs rounded transition-colors ${
                region.regionType === 'force'
                  ? 'bg-purple-500 text-white' 
                  : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
              }`}
            >
              <Shield size={16} />
              <span className="text-[9px] mt-1">Force</span>
            </button>
          </div>
        </div>

        {/* Direction Selection */}
        <div className="mb-3">
          <label className="text-[9px] text-gray-400 block mb-2">
            Direction (sign controlled by weight polarity)
          </label>
          
          {/* Direction and weight layout: column of buttons + dial */}
          <div className="flex items-center gap-3">
            {/* Direction buttons in a vertical column */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleDirectionSelection(RegionDirection.X)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  region.direction === RegionDirection.X
                    ? 'bg-red-500 text-white font-medium' 
                    : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
                }`}
              >
                X
              </button>
              <button
                onClick={() => handleDirectionSelection(RegionDirection.Y)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  region.direction === RegionDirection.Y
                    ? 'bg-green-500 text-white font-medium' 
                    : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
                }`}
              >
                Y
              </button>
              <button
                onClick={() => handleDirectionSelection(RegionDirection.Z)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  region.direction === RegionDirection.Z
                    ? 'bg-blue-500 text-white font-medium' 
                    : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
                }`}
              >
                Z
              </button>
              {/* Sign flip button */}
              <button
                onClick={() => onUpdate({ weight: -(region.weight || 1.0) })}
                className="px-1 py-1 text-[10px] rounded bg-neutral-600 hover:bg-neutral-500 text-gray-200 hover:text-white transition-colors"
                title="Flip sign"
              >
                {(region.weight || 1.0) >= 0 ? '+ → −' : '− → +'}
              </button>
            </div>

            {/* Weight dial */}
            <div className="flex flex-col items-center flex-1">
              <Dial
                value={region.weight || 1.0}
                onChange={(val) => onUpdate({ weight: val })}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                mode="linear"
                min={-10}
                max={10}
                step={0.01}
                size={36}
                label="Weight"
                defaultValue={1.0}
              />
              {/* Weight value display (dimensionless) */}
              <div className="text-[9px] text-gray-400 mt-0.5 h-3">
                weight: {Math.abs(region.weight || 1.0) < 0.1 ? (region.weight || 1.0).toFixed(3) : (region.weight || 1.0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────── Position & Size Section ───────────────────── */}
      <div className="bg-neutral-700/30 rounded-lg p-2">
        <label className="text-[10px] text-gray-400 block mb-1">
          Position & Size {regionShape !== 'Point' && <span className="text-gray-500">({regionShape})</span>}
        </label>
        <div className="flex gap-2 items-center">
          {/* Position inputs */}
          <div className="space-y-1">
            <div>
              <input
                type="number"
                value={formatValue(region.pos?.x || 0)}
                onChange={(e) => handleVectorChange('pos', 'x', e.target.value)}
                className="w-16 px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
                step="0.01"
              />
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500">x</span>
                <span className="text-[9px] text-blue-400 h-3">
                  {convertLength(region.pos?.x || 0, projectA, projectUnit)}
                </span>
              </div>
            </div>
            <div>
              <input
                type="number"
                value={formatValue(region.pos?.y || 0)}
                onChange={(e) => handleVectorChange('pos', 'y', e.target.value)}
                className="w-16 px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
                step="0.01"
              />
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500">y</span>
                <span className="text-[9px] text-blue-400 h-3">
                  {convertLength(region.pos?.y || 0, projectA, projectUnit)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Size controls with presets */}
          <div className="flex-1">
            {/* Preset buttons */}
            <div className="flex gap-1 mb-2">
              <button
                onClick={handlePointPreset}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  regionShape === 'Point' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
                }`}
              >
                Point
              </button>
              <button
                onClick={handleLinePreset}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  regionShape === 'Line' 
                    ? lineOrientation === 'vertical' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-blue-500 text-white'
                    : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
                }`}
              >
                Line
              </button>
              <button
                onClick={handleAreaPreset}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  regionShape === 'Area' 
                    ? areaOrientation === 'tall' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-blue-500 text-white'
                    : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
                }`}
              >
                Area
              </button>
            </div>
            
            {/* Size dials */}
            <div className="flex justify-center gap-4">
              <div className="flex flex-col items-center">
                <Dial
                  value={region.size?.x || 0}
                  onChange={(val) => onUpdate({ size: { ...(region.size || { x: 0, y: 0 }), x: val } })}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  mode="linear"
                  min={0}
                  step={0.01}
                  size={36}
                  label="Width"
                />
                <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                  {convertLength(region.size?.x || 0, projectA, projectUnit)}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <Dial
                  value={region.size?.y || 0}
                  onChange={(val) => onUpdate({ size: { ...(region.size || { x: 0, y: 0 }), y: val } })}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  mode="linear"
                  min={0}
                  step={0.01}
                  size={36}
                  label="Height"
                />
                <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                  {convertLength(region.size?.y || 0, projectA, projectUnit)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
