"use client";
import React from "react";
import { useCanvasStore } from "../../providers/CanvasStore";
import { SourceComponent } from "../../types/meepSourceTypes";

interface GaussianBeamSourcePropertiesProps {
  source: any;
  onUpdate: (partial: Partial<any>) => void;
}

export const GaussianBeamSourceProperties: React.FC<GaussianBeamSourcePropertiesProps> = ({ source, onUpdate }) => {
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
          ...source.amplitude,
          [real ? 'real' : 'imag']: num
        }
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Component (usually ignored for beam) */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Component</label>
        <select
          value={source.component || "ALL_COMPONENTS"}
          onChange={(e) => onUpdate({ component: e.target.value })}
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
          disabled
        >
          <option value="ALL_COMPONENTS">ALL_COMPONENTS</option>
        </select>
        <span className="text-[10px] text-gray-500 block mt-0.5">Auto-set for beams</span>
      </div>

      {/* Beam Waist */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Beam Waist (w₀)</label>
        <input
          type="number"
          value={source.beamW0 || 1}
          onChange={(e) => handleNumberChange('beamW0', e.target.value)}
          className="w-full px-2 py-1 text-xs bg-neutral-700 rounded text-gray-200"
          step="0.1"
          min="0.1"
        />
      </div>

      {/* Focus Location */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Focus Location (relative)</label>
        <div className="bg-neutral-700/50 rounded px-2 py-1">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <input
                type="number"
                value={source.beamX0?.x || 0}
                onChange={(e) => handleVectorChange('beamX0', 'x', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">x</span>
            </div>
            <div>
              <input
                type="number"
                value={source.beamX0?.y || 0}
                onChange={(e) => handleVectorChange('beamX0', 'y', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">y</span>
            </div>
            <div>
              <input
                type="number"
                value={source.beamX0?.z || 0}
                onChange={(e) => handleVectorChange('beamX0', 'z', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">z</span>
            </div>
          </div>
        </div>
      </div>

      {/* Propagation Direction */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Propagation Direction</label>
        <div className="bg-neutral-700/50 rounded px-2 py-1">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <input
                type="number"
                value={source.beamKdir?.x || 1}
                onChange={(e) => handleVectorChange('beamKdir', 'x', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">kₓ</span>
            </div>
            <div>
              <input
                type="number"
                value={source.beamKdir?.y || 0}
                onChange={(e) => handleVectorChange('beamKdir', 'y', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">kᵧ</span>
            </div>
            <div>
              <input
                type="number"
                value={source.beamKdir?.z || 0}
                onChange={(e) => handleVectorChange('beamKdir', 'z', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">kᵧ</span>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 block mt-0.5">Length ignored, only direction used</span>
      </div>

      {/* Polarization */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Polarization Vector (E₀)</label>
        <div className="bg-neutral-700/50 rounded px-2 py-1">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <input
                type="number"
                value={source.beamE0?.x || 0}
                onChange={(e) => handleVectorChange('beamE0', 'x', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">Eₓ</span>
            </div>
            <div>
              <input
                type="number"
                value={source.beamE0?.y || 0}
                onChange={(e) => handleVectorChange('beamE0', 'y', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">Eᵧ</span>
            </div>
            <div>
              <input
                type="number"
                value={source.beamE0?.z || 0}
                onChange={(e) => handleVectorChange('beamE0', 'z', e.target.value)}
                className="w-full px-1 py-0.5 text-xs bg-neutral-600 rounded text-gray-200"
                step="0.1"
              />
              <span className="text-[10px] text-gray-500 block text-center">Eᵧ</span>
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
        <label className="text-xs text-gray-400 block mb-1">Source Center</label>
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
        <label className="text-xs text-gray-400 block mb-1">Source Size</label>
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
        <span className="text-[10px] text-gray-500 block mt-0.5">Must be line (2D) or plane (3D)</span>
      </div>
    </div>
  );
};
