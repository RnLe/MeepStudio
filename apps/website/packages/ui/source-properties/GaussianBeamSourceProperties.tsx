"use client";
import React from "react";
import { useCanvasStore } from "../../providers/CanvasStore";
import { SourceComponent } from "../../types/meepSourceTypes";
import { Dial } from "../components/Dial";

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

      {/* Beam Parameters Group */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Beam Parameters</label>
        <div className="bg-neutral-700/50 rounded p-2">
          <div className="flex justify-center">
            <Dial
              value={source.beamW0 || 1}
              onChange={(val) => onUpdate({ beamW0: val })}
              mode="10x"
              min={0.1}
              step={0.01}
              size={36}
              label="Beam Waist (w₀)"
            />
          </div>
        </div>
      </div>

      {/* Focus Location */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Focus Location (relative)</label>
        <div className="bg-neutral-700/50 rounded px-2 py-1">
          <div className="grid grid-cols-3 gap-1">
            <div className="flex justify-center">
              <Dial
                value={source.beamX0?.x || 0}
                onChange={(val) => onUpdate({ beamX0: { ...source.beamX0, x: val } })}
                mode="linear"
                min={-10}
                step={0.1}
                size={36}
                label="x"
              />
            </div>
            <div className="flex justify-center">
              <Dial
                value={source.beamX0?.y || 0}
                onChange={(val) => onUpdate({ beamX0: { ...source.beamX0, y: val } })}
                mode="linear"
                min={-10}
                step={0.1}
                size={36}
                label="y"
              />
            </div>
            <div className="flex justify-center">
              <Dial
                value={source.beamX0?.z || 0}
                onChange={(val) => onUpdate({ beamX0: { ...source.beamX0, z: val } })}
                mode="linear"
                min={-10}
                step={0.1}
                size={36}
                label="z"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Propagation Direction */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Propagation Direction</label>
        <div className="bg-neutral-700/50 rounded px-2 py-1">
          <div className="grid grid-cols-3 gap-1">
            <div className="flex justify-center">
              <Dial
                value={source.beamKdir?.x || 1}
                onChange={(val) => onUpdate({ beamKdir: { ...source.beamKdir, x: val } })}
                mode="linear"
                min={-1}
                max={1}
                step={0.1}
                size={36}
                label="kₓ"
              />
            </div>
            <div className="flex justify-center">
              <Dial
                value={source.beamKdir?.y || 0}
                onChange={(val) => onUpdate({ beamKdir: { ...source.beamKdir, y: val } })}
                mode="linear"
                min={-1}
                max={1}
                step={0.1}
                size={36}
                label="kᵧ"
              />
            </div>
            <div className="flex justify-center">
              <Dial
                value={source.beamKdir?.z || 0}
                onChange={(val) => onUpdate({ beamKdir: { ...source.beamKdir, z: val } })}
                mode="linear"
                min={-1}
                max={1}
                step={0.1}
                size={36}
                label="kᵣ"
              />
            </div>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 block mt-0.5">Length ignored, only direction used</span>
      </div>

      {/* Polarization */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Polarization Vector (E₀)</label>
        <div className="bg-neutral-700/50 rounded px-2 py-1">
          <div className="grid grid-cols-3 gap-1">
            <div className="flex justify-center">
              <Dial
                value={source.beamE0?.x || 0}
                onChange={(val) => onUpdate({ beamE0: { ...source.beamE0, x: val } })}
                mode="linear"
                min={-1}
                max={1}
                step={0.1}
                size={36}
                label="Eₓ"
              />
            </div>
            <div className="flex justify-center">
              <Dial
                value={source.beamE0?.y || 0}
                onChange={(val) => onUpdate({ beamE0: { ...source.beamE0, y: val } })}
                mode="linear"
                min={-1}
                max={1}
                step={0.1}
                size={36}
                label="Eᵧ"
              />
            </div>
            <div className="flex justify-center">
              <Dial
                value={source.beamE0?.z || 0}
                onChange={(val) => onUpdate({ beamE0: { ...source.beamE0, z: val } })}
                mode="linear"
                min={-1}
                max={1}
                step={0.1}
                size={36}
                label="Eᵣ"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Amplitude */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Amplitude</label>
        <div className="bg-neutral-700/50 rounded px-2 py-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-center">
              <Dial
                value={source.amplitude?.real || 1}
                onChange={(val) => onUpdate({ amplitude: { ...source.amplitude, real: val } })}
                mode="linear"
                min={-10}
                max={10}
                step={0.1}
                size={36}
                label="Real"
              />
            </div>
            <div className="flex justify-center">
              <Dial
                value={source.amplitude?.imag || 0}
                onChange={(val) => onUpdate({ amplitude: { ...source.amplitude, imag: val } })}
                mode="linear"
                min={-10}
                max={10}
                step={0.1}
                size={36}
                label="Imag"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center Position - kept as regular inputs */}
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
            <div className="flex justify-center">
              <Dial
                value={source.size?.x || 0}
                onChange={(val) => onUpdate({ size: { ...source.size, x: val } })}
                mode="linear"
                min={0}
                step={0.1}
                size={36}
                label="width"
              />
            </div>
            <div className="flex justify-center">
              <Dial
                value={source.size?.y || 0}
                onChange={(val) => onUpdate({ size: { ...source.size, y: val } })}
                mode="linear"
                min={0}
                step={0.1}
                size={36}
                label="height"
              />
            </div>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 block mt-0.5">Must be line (2D) or plane (3D)</span>
      </div>
    </div>
  );
};
