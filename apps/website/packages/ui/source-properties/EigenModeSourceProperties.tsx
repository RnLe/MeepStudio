"use client";
import React from "react";
import { useCanvasStore } from "../../providers/CanvasStore";
import { SourceComponent, EigenModeDirection, EigenModeParity } from "../../types/meepSourceTypes";

interface EigenModeSourcePropertiesProps {
  source: any;
  onUpdate: (partial: Partial<any>) => void;
}

export const EigenModeSourceProperties: React.FC<EigenModeSourcePropertiesProps> = ({ source, onUpdate }) => {
  const handleNumberChange = (field: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdate({ [field]: num });
    }
  };

  const handleIntChange = (field: string, value: string) => {
    const num = parseInt(value);
    if (!isNaN(num)) {
      onUpdate({ [field]: num });
    }
  };

  const handleVectorChange = (field: string, axis: 'x' | 'y' | 'z', value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onUpdate({
        [field]: {
          ...source[field],
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
          ...source.amplitude,
          [real ? 'real' : 'imag']: num
        }
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Component Selection */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Component</label>
        <select
          value={source.component || "ALL_COMPONENTS"}
          onChange={(e) => onUpdate({ component: e.target.value })}
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
        >
          {Object.values(SourceComponent).map(comp => (
            <option key={comp} value={comp}>{comp}</option>
          ))}
        </select>
      </div>

      {/* Band Index */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Band Index</label>
        <input
          type="number"
          value={source.eigBand || 1}
          onChange={(e) => handleIntChange('eigBand', e.target.value)}
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
          step="1"
          min="1"
        />
      </div>

      {/* Direction */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Mode Direction</label>
        <select
          value={source.direction || "AUTOMATIC"}
          onChange={(e) => onUpdate({ direction: e.target.value })}
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
        >
          {Object.values(EigenModeDirection).map(dir => (
            <option key={dir} value={dir}>{dir}</option>
          ))}
        </select>
      </div>

      {/* Parity */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Mode Parity</label>
        <select
          value={source.eigParity || "NO_PARITY"}
          onChange={(e) => onUpdate({ eigParity: e.target.value })}
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
        >
          {Object.values(EigenModeParity).map(parity => (
            <option key={parity} value={parity}>{parity}</option>
          ))}
        </select>
      </div>

      {/* k-point */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">k-vector (2π/a units)</label>
        <div className="bg-neutral-700/50 rounded px-2 py-1">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <input
                type="number"
                value={source.eigKpoint?.x || 0}
                onChange={(e) => handleVectorChange('eigKpoint', 'x', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">kₓ</span>
            </div>
            <div>
              <input
                type="number"
                value={source.eigKpoint?.y || 0}
                onChange={(e) => handleVectorChange('eigKpoint', 'y', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">kᵧ</span>
            </div>
            <div>
              <input
                type="number"
                value={source.eigKpoint?.z || 0}
                onChange={(e) => handleVectorChange('eigKpoint', 'z', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">kᵧ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Amplitude */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Amplitude</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="number"
              value={source.amplitude?.real || 1}
              onChange={(e) => handleAmplitudeChange(true, e.target.value)}
              className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
              placeholder="Real"
              step="0.1"
            />
            <span className="text-[10px] text-gray-500 block text-center mt-0.5">Real</span>
          </div>
          <div>
            <input
              type="number"
              value={source.amplitude?.imag || 0}
              onChange={(e) => handleAmplitudeChange(false, e.target.value)}
              className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
              placeholder="Imag"
              step="0.1"
            />
            <span className="text-[10px] text-gray-500 block text-center mt-0.5">Imag</span>
          </div>
        </div>
      </div>

      {/* Center Position */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Center Position</label>
        <div className="bg-neutral-700/50 rounded px-2 py-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                value={source.pos?.x || 0}
                onChange={(e) => handleVectorChange('pos', 'x', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">x</span>
            </div>
            <div>
              <input
                type="number"
                value={source.pos?.y || 0}
                onChange={(e) => handleVectorChange('pos', 'y', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">y</span>
            </div>
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Size</label>
        <div className="bg-neutral-700/50 rounded px-2 py-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                value={source.size?.x || 0}
                onChange={(e) => handleVectorChange('size', 'x', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
                min="0"
              />
              <span className="text-[10px] text-gray-500 block text-center">width</span>
            </div>
            <div>
              <input
                type="number"
                value={source.size?.y || 0}
                onChange={(e) => handleVectorChange('size', 'y', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
                min="0"
              />
              <span className="text-[10px] text-gray-500 block text-center">height</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 block">Advanced Settings</label>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Resolution</label>
            <input
              type="number"
              value={source.eigResolution || 0}
              onChange={(e) => handleNumberChange('eigResolution', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="1"
              min="0"
              placeholder="Auto"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Match Freq</label>
            <input
              type="checkbox"
              checked={source.eigMatchFreq !== false}
              onChange={(e) => onUpdate({ eigMatchFreq: e.target.checked })}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
