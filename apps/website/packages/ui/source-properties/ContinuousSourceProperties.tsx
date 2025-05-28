"use client";
import React from "react";
import { useCanvasStore } from "../../providers/CanvasStore";
import { SourceComponent } from "../../types/meepSourceTypes";
import { LabeledVector } from "../MathVector";
import { Zap } from "lucide-react";

interface ContinuousSourcePropertiesProps {
  source: any;
  onUpdate: (partial: Partial<any>) => void;
}

export const ContinuousSourceProperties: React.FC<ContinuousSourcePropertiesProps> = ({ source, onUpdate }) => {
  const handleNumberChange = (field: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdate({ [field]: num });
    }
  };

  const handleVectorChange = (field: string, axis: 'x' | 'y' | 'z', value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdate({
        [field]: {
          ...(source[field] || { x: 0, y: 0, z: 0 }),
          [axis]: num
        }
      });
    }
  };

  const handleAmplitudeChange = (real: boolean, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdate({
        amplitude: {
          ...(source.amplitude || { real: 1, imag: 0 }),
          [real ? 'real' : 'imag']: num
        }
      });
    }
  };

  // Determine source type based on size
  const sizeX = source.size?.x || 0;
  const sizeY = source.size?.y || 0;
  const sourceType = sizeX === 0 && sizeY === 0 ? 'Point' : 
                    (sizeX === 0 || sizeY === 0) ? 'Line' : 'Area';

  // Round position values to 2 decimal places for display
  const formatPosition = (value: number) => {
    return Math.round(value * 100) / 100;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">Continuous Source</h3>
      </div>
      
      {/* Source type indicator */}
      <div className="text-xs text-gray-400 bg-neutral-700/50 rounded px-2 py-1">
        Type: <span className="text-gray-200 font-medium">{sourceType} Source</span>
      </div>
      
      {/* Component, Frequency, and Amplitude - 4 columns */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">Component</label>
          <select
            value={source.component || "Ex"}
            onChange={(e) => onUpdate({ component: e.target.value })}
            className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
          >
            {Object.values(SourceComponent).map(comp => (
              <option key={comp} value={comp}>{comp}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">Frequency</label>
          <input
            type="number"
            value={source.frequency || 1}
            onChange={(e) => handleNumberChange('frequency', e.target.value)}
            className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
            step="0.001"
          />
        </div>
        
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">Amp (Re)</label>
          <input
            type="number"
            value={source.amplitude?.real || 1}
            onChange={(e) => handleAmplitudeChange(true, e.target.value)}
            className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
            step="0.1"
          />
        </div>
        
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">Amp (Im)</label>
          <input
            type="number"
            value={source.amplitude?.imag || 0}
            onChange={(e) => handleAmplitudeChange(false, e.target.value)}
            className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
            step="0.1"
          />
        </div>
      </div>

      {/* Position and Size - 4 columns */}
      <div>
        <label className="text-[10px] text-gray-400 block mb-0.5">
          Position & Size {sourceType !== 'Point' && <span className="text-gray-500">({sourceType})</span>}
        </label>
        <div className="grid grid-cols-4 gap-1">
          <div>
            <input
              type="number"
              value={formatPosition(source.pos?.x || 0)}
              onChange={(e) => handleVectorChange('pos', 'x', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="0.01"
            />
            <span className="text-[9px] text-gray-500 block text-center">x</span>
          </div>
          <div>
            <input
              type="number"
              value={formatPosition(source.pos?.y || 0)}
              onChange={(e) => handleVectorChange('pos', 'y', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="0.01"
            />
            <span className="text-[9px] text-gray-500 block text-center">y</span>
          </div>
          <div>
            <input
              type="number"
              value={formatPosition(source.size?.x || 0)}
              onChange={(e) => handleVectorChange('size', 'x', e.target.value)}
              className={`w-full px-1 py-0.5 text-xs rounded text-gray-200 ${
                sourceType === 'Line' && sizeX === 0 ? 'bg-neutral-800 text-gray-500' : 'bg-neutral-700'
              }`}
              step="0.01"
              min="0"
            />
            <span className="text-[9px] text-gray-500 block text-center">w</span>
          </div>
          <div>
            <input
              type="number"
              value={formatPosition(source.size?.y || 0)}
              onChange={(e) => handleVectorChange('size', 'y', e.target.value)}
              className={`w-full px-1 py-0.5 text-xs rounded text-gray-200 ${
                sourceType === 'Line' && sizeY === 0 ? 'bg-neutral-800 text-gray-500' : 'bg-neutral-700'
              }`}
              step="0.01"
              min="0"
            />
            <span className="text-[9px] text-gray-500 block text-center">h</span>
          </div>
        </div>
      </div>

      {/* Time Parameters - 3 columns */}
      <div>
        <label className="text-[10px] text-gray-400 block mb-0.5">Time Parameters</label>
        <div className="grid grid-cols-3 gap-1">
          <div>
            <input
              type="number"
              value={source.startTime || 0}
              onChange={(e) => handleNumberChange('startTime', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="1"
              min="0"
            />
            <span className="text-[9px] text-gray-500 block text-center">start</span>
          </div>
          <div>
            {source.endTime === 1e20 || source.endTime === undefined ? (
              <div className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-500 italic text-center h-[22px] flex items-center justify-center">
                ∞
              </div>
            ) : (
              <input
                type="number"
                value={source.endTime}
                onChange={(e) => handleNumberChange('endTime', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
                step="1"
                min="0"
              />
            )}
            <span className="text-[9px] text-gray-500 block text-center">end</span>
          </div>
          <div>
            <input
              type="number"
              value={source.width || 0}
              onChange={(e) => handleNumberChange('width', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="0.1"
              min="0"
            />
            <span className="text-[9px] text-gray-500 block text-center">smooth</span>
          </div>
        </div>
      </div>
    </div>
  );
};
