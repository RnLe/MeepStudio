"use client";
import React from "react";
import { useCanvasStore } from "../../providers/CanvasStore";
import { SourceComponent } from "../../types/meepSourceTypes";

interface GaussianSourcePropertiesProps {
  source: any;
  onUpdate: (partial: Partial<any>) => void;
}

export const GaussianSourceProperties: React.FC<GaussianSourcePropertiesProps> = ({ source, onUpdate }) => {
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
          value={source.component || "Ex"}
          onChange={(e) => onUpdate({ component: e.target.value })}
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
        >
          {Object.values(SourceComponent).map(comp => (
            <option key={comp} value={comp}>{comp}</option>
          ))}
        </select>
      </div>

      {/* Frequency */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Center Frequency (c/a)</label>
        <input
          type="number"
          value={source.frequency || 1}
          onChange={(e) => handleNumberChange('frequency', e.target.value)}
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
          step="0.1"
        />
      </div>

      {/* Width */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Gaussian Width</label>
        <input
          type="number"
          value={source.width || 0.1}
          onChange={(e) => handleNumberChange('width', e.target.value)}
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
          step="0.01"
          min="0.01"
        />
        <span className="text-[10px] text-gray-500 block mt-0.5">
          FWHM ≈ {(2.355 * (source.width || 0.1)).toFixed(3)}
        </span>
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
        <label className="text-xs text-gray-400 block mb-1">Size (0 for point source)</label>
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

      {/* Pulse Parameters */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 block">Pulse Parameters</label>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Start Time</label>
            <input
              type="number"
              value={source.startTime || 0}
              onChange={(e) => handleNumberChange('startTime', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="1"
              min="0"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Cutoff</label>
            <input
              type="number"
              value={source.cutoff || 5}
              onChange={(e) => handleNumberChange('cutoff', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="0.5"
              min="1"
            />
          </div>
        </div>

        <div className="text-[10px] text-gray-500">
          Peak at t = {((source.startTime || 0) + (source.cutoff || 5) * (source.width || 0.1)).toFixed(2)}
        </div>
      </div>
    </div>
  );
};
