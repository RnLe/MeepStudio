import React from "react";
import { RegionBox } from "../../types/canvasElementTypes";
import { Target, Zap, Shield, Grid3X3, Square, CheckSquare } from "lucide-react";
import { Dial } from "../components/Dial";
import { LengthUnit } from "../../types/meepProjectTypes";
import { convertLength } from "../../utils/physicalUnitsHelper";

interface RegionBoxPropertiesProps {
  regionBox: RegionBox;
  onUpdate: (partial: Partial<RegionBox>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  projectUnit?: LengthUnit;
  projectA?: number;
  projectWidth?: number;
  projectHeight?: number;
}

export const RegionBoxProperties: React.FC<RegionBoxPropertiesProps> = ({ 
  regionBox, 
  onUpdate,
  onDragStart,
  onDragEnd,
  projectUnit = LengthUnit.NM,
  projectA = 1,
  projectWidth = 3,
  projectHeight = 3
}) => {
  // ────────────────────────── Region Type Info ──────────────────────────────
  const getRegionTypeInfo = (regionType: string) => {
    switch (regionType) {
      case 'flux':
        return { 
          icon: Target, 
          color: 'text-red-400', 
          name: 'Flux Region Box',
          description: 'Four-sided flux measurement boundary'
        };
      case 'energy':
        return { 
          icon: Zap, 
          color: 'text-orange-400', 
          name: 'Energy Region Box',
          description: 'Four-sided energy measurement boundary'
        };
      case 'force':
        return { 
          icon: Shield, 
          color: 'text-purple-400', 
          name: 'Force Region Box',
          description: 'Four-sided force measurement boundary'
        };
      default:
        return { 
          icon: Grid3X3, 
          color: 'text-gray-400', 
          name: 'Region Box',
          description: 'Four-sided measurement boundary'
        };
    }
  };

  const regionTypeInfo = getRegionTypeInfo(regionBox.regionType || 'flux');
  const RegionIcon = regionTypeInfo.icon;

  // ────────────────────────── Formatting Helpers ──────────────────────────
  const formatValue = (value: number, decimals: number = 2) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // ────────────────────────── Event Handlers ──────────────────────────────
  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdate({
        pos: {
          ...(regionBox.pos || { x: 0, y: 0 }),
          [axis]: num
        }
      });
    }
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    onUpdate({ [dimension]: value });
  };

  const handleEdgeUpdate = (edge: 'top' | 'right' | 'bottom' | 'left', updates: Partial<typeof regionBox.edges.top>) => {
    onUpdate({
      edges: {
        ...regionBox.edges,
        [edge]: {
          ...regionBox.edges[edge],
          ...updates
        }
      }
    });
  };

  const handleEdgeWeightChange = (edge: 'top' | 'right' | 'bottom' | 'left', weight: number) => {
    handleEdgeUpdate(edge, { weight });
  };

  const handleEdgeToggle = (edge: 'top' | 'right' | 'bottom' | 'left') => {
    const currentEdge = regionBox.edges[edge];
    handleEdgeUpdate(edge, { enabled: !currentEdge.enabled });
  };

  // Get edge direction info
  const getEdgeDirection = (edge: 'top' | 'right' | 'bottom' | 'left') => {
    switch (edge) {
      case 'top': return { axis: 'Y', direction: '+Y', color: 'text-green-400' };
      case 'bottom': return { axis: 'Y', direction: '-Y', color: 'text-green-400' };
      case 'left': return { axis: 'X', direction: '-X', color: 'text-red-400' };
      case 'right': return { axis: 'X', direction: '+X', color: 'text-red-400' };
    }
  };

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
      
      {/* ─────────────── Region Box Properties ─────────────────── */}
      <div className="bg-neutral-700/30 rounded-lg p-2">
        <label className="text-[10px] text-gray-400 block mb-2">Region Box Properties</label>
        
        {/* Region Type */}
        <div className="mb-3">
          <label className="text-[9px] text-gray-400 block mb-2">Type</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => onUpdate({ regionType: 'flux' })}
              className={`flex flex-col items-center px-2 py-2 text-xs rounded transition-colors ${
                (regionBox.regionType || 'flux') === 'flux'
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
                regionBox.regionType === 'energy'
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
                regionBox.regionType === 'force'
                  ? 'bg-purple-500 text-white' 
                  : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
              }`}
            >
              <Shield size={16} />
              <span className="text-[9px] mt-1">Force</span>
            </button>
          </div>
        </div>

        {/* Position & Size */}
        <div className="mb-3">
          <label className="text-[9px] text-gray-400 block mb-2">Position & Size</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Position */}
            <div className="space-y-1">
              <div>
                <input
                  type="number"
                  value={formatValue(regionBox.pos?.x || 0)}
                  onChange={(e) => handlePositionChange('x', e.target.value)}
                  className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
                  step="0.01"
                  placeholder="X"
                />
                <div className="text-[8px] text-blue-400 mt-0.5">
                  {convertLength(regionBox.pos?.x || 0, projectA, projectUnit)}
                </div>
              </div>
              <div>
                <input
                  type="number"
                  value={formatValue(regionBox.pos?.y || 0)}
                  onChange={(e) => handlePositionChange('y', e.target.value)}
                  className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
                  step="0.01"
                  placeholder="Y"
                />
                <div className="text-[8px] text-blue-400 mt-0.5">
                  {convertLength(regionBox.pos?.y || 0, projectA, projectUnit)}
                </div>
              </div>
            </div>
            
            {/* Size */}
            <div className="flex gap-2">
              <div className="flex flex-col items-center flex-1">
                <label className="text-[8px] text-gray-400 mb-1">Width</label>
                <Dial
                  value={regionBox.width || 1}
                  onChange={(val) => handleSizeChange('width', val)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  mode="linear"
                  min={0.01}
                  max={projectWidth}
                  step={0.01}
                  size={32}
                  label=""
                  defaultValue={1.0}
                />
                <div className="text-[8px] text-blue-400 mt-0.5">
                  {convertLength(regionBox.width || 1, projectA, projectUnit)}
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <label className="text-[8px] text-gray-400 mb-1">Height</label>
                <Dial
                  value={regionBox.height || 1}
                  onChange={(val) => handleSizeChange('height', val)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  mode="linear"
                  min={0.01}
                  max={projectHeight}
                  step={0.01}
                  size={32}
                  label=""
                  defaultValue={1.0}
                />
                <div className="text-[8px] text-blue-400 mt-0.5">
                  {convertLength(regionBox.height || 1, projectA, projectUnit)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────── Edge Settings ─────────────────── */}
      <div className="bg-neutral-700/30 rounded-lg p-2">
        <label className="text-[10px] text-gray-400 block mb-2">Edge Settings</label>
        
        {/* 4-column edge layout */}
        <div className="grid grid-cols-4 gap-1">
          {(['top', 'right', 'bottom', 'left'] as const).map((edge) => {
            const edgeData = regionBox.edges[edge];
            const directionInfo = getEdgeDirection(edge);
            const EnableIcon = edgeData.enabled ? CheckSquare : Square;
            
            return (
              <div key={edge} className="bg-neutral-800/50 rounded p-1">
                {/* Edge enable/disable with icon */}
                <div className="flex flex-col items-center gap-1 mb-2">
                  <button
                    onClick={() => handleEdgeToggle(edge)}
                    className="p-1 rounded transition-colors hover:bg-neutral-700"
                    title={`${edgeData.enabled ? 'Disable' : 'Enable'} ${edge} edge`}
                  >
                    <EnableIcon 
                      size={14} 
                      className={edgeData.enabled ? 'text-green-400' : 'text-gray-500'}
                    />
                  </button>
                  <span className="text-[9px] text-gray-300 capitalize">{edge}</span>
                  <span className={`text-[8px] ${directionInfo.color}`}>
                    {directionInfo.direction}
                  </span>
                </div>
                
                {/* Weight dial */}
                <div className="flex flex-col items-center gap-1">
                  <Dial
                    value={edgeData.weight}
                    onChange={(val) => handleEdgeWeightChange(edge, val)}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    mode="linear"
                    min={-10}
                    max={10}
                    step={0.01}
                    size={24}
                    label=""
                    defaultValue={1.0}
                    disabled={!edgeData.enabled}
                  />
                  
                  {/* Sign flip button */}
                  <button
                    onClick={() => handleEdgeWeightChange(edge, -edgeData.weight)}
                    className={`px-1 py-0.5 text-[8px] rounded transition-colors ${
                      edgeData.enabled
                        ? 'bg-neutral-600 hover:bg-neutral-500 text-gray-200 hover:text-white'
                        : 'bg-neutral-800 text-gray-600 cursor-not-allowed'
                    }`}
                    title="Flip sign"
                    disabled={!edgeData.enabled}
                  >
                    {edgeData.weight >= 0 ? '+→−' : '−→+'}
                  </button>
                  
                  {/* Weight value display */}
                  <div className="text-[7px] text-gray-400 h-2 text-center">
                    {edgeData.enabled && `${Math.abs(edgeData.weight) < 0.1 ? edgeData.weight.toFixed(3) : edgeData.weight.toFixed(2)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bulk actions */}
        <div className="mt-3 flex gap-1">
          <button
            onClick={() => {
              const newEdges = { ...regionBox.edges };
              Object.keys(newEdges).forEach(edge => {
                newEdges[edge as keyof typeof newEdges].enabled = true;
              });
              onUpdate({ edges: newEdges });
            }}
            className="flex-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={() => {
              const newEdges = { ...regionBox.edges };
              Object.keys(newEdges).forEach(edge => {
                newEdges[edge as keyof typeof newEdges].enabled = false;
              });
              onUpdate({ edges: newEdges });
            }}
            className="flex-1 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            Disable All
          </button>
        </div>
      </div>
    </div>
  );
};
