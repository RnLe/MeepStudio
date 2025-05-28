"use client";
import React from "react";
import { SourceComponent } from "../../types/meepSourceTypes";
import { Zap } from "lucide-react";
import { GaussianPulsePlot } from "../plots/GaussianPulsePlot";

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

  // Calculate derived values
  const frequency = source.frequency || 1;
  const width = source.width || 0.1;
  const fwidth = width > 0 ? 1 / width : Infinity;
  const startTime = source.startTime || 0;
  const cutoff = source.cutoff || 5;
  const peakTime = startTime + cutoff * width;
  const wavelength = frequency > 0 ? 1 / frequency : 0;

  // Round values for display
  const formatValue = (value: number, decimals: number = 2) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">Gaussian Source</h3>
      </div>
      
      {/* Source type indicator */}
      <div className="text-xs text-gray-400 bg-neutral-700/50 rounded px-2 py-1">
        Type: <span className="text-gray-200 font-medium">Point Source (Pulse)</span>
      </div>
      
      {/* Gaussian Pulse Visualization */}
      <div className="bg-neutral-800/50 rounded-lg p-2">
        <GaussianPulsePlot
          frequency={source.frequency || 1}
          pulseWidth={source.width || 0.1}
          startTime={source.startTime || 0}
          cutoff={source.cutoff || 5}
          amplitude={source.amplitude || { real: 1, imag: 0 }}
        />
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
            {Object.values(SourceComponent).filter(comp => comp !== "ALL_COMPONENTS").map(comp => (
              <option key={comp} value={comp}>{comp}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">Frequency</label>
          <input
            type="number"
            value={formatValue(source.frequency || 1)}
            onChange={(e) => handleNumberChange('frequency', e.target.value)}
            className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
            step="0.01"
          />
        </div>
        
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">Amp (Re)</label>
          <input
            type="number"
            value={formatValue(source.amplitude?.real || 1)}
            onChange={(e) => handleAmplitudeChange(true, e.target.value)}
            className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
            step="0.1"
          />
        </div>
        
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">Amp (Im)</label>
          <input
            type="number"
            value={formatValue(source.amplitude?.imag || 0)}
            onChange={(e) => handleAmplitudeChange(false, e.target.value)}
            className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
            step="0.1"
          />
        </div>
      </div>

      {/* Position (Gaussian sources are always point sources) */}
      <div>
        <label className="text-[10px] text-gray-400 block mb-0.5">
          Position <span className="text-gray-500">(Point Source)</span>
        </label>
        <div className="grid grid-cols-2 gap-1">
          <div>
            <input
              type="number"
              value={formatValue(source.pos?.x || 0)}
              onChange={(e) => handleVectorChange('pos', 'x', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="0.01"
            />
            <span className="text-[9px] text-gray-500 block text-center">x</span>
          </div>
          <div>
            <input
              type="number"
              value={formatValue(source.pos?.y || 0)}
              onChange={(e) => handleVectorChange('pos', 'y', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="0.01"
            />
            <span className="text-[9px] text-gray-500 block text-center">y</span>
          </div>
        </div>
      </div>

      {/* Pulse Parameters - Width and Cutoff */}
      <div>
        <label className="text-[10px] text-gray-400 block mb-0.5">Pulse Parameters</label>
        <div className="grid grid-cols-3 gap-1">
          <div>
            <input
              type="number"
              value={formatValue(source.width || 0.1)}
              onChange={(e) => handleNumberChange('width', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="0.01"
              min="0.01"
            />
            <span className="text-[9px] text-gray-500 block text-center">width</span>
          </div>
          <div>
            <input
              type="number"
              value={formatValue(source.startTime || 0)}
              onChange={(e) => handleNumberChange('startTime', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="0.1"
              min="0"
            />
            <span className="text-[9px] text-gray-500 block text-center">start</span>
          </div>
          <div>
            <input
              type="number"
              value={formatValue(source.cutoff || 5)}
              onChange={(e) => handleNumberChange('cutoff', e.target.value)}
              className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              step="0.5"
              min="1"
            />
            <span className="text-[9px] text-gray-500 block text-center">cutoff</span>
          </div>
        </div>
      </div>

      {/* Derived values display */}
      <div className="text-[10px] text-gray-500 bg-neutral-800/50 rounded px-2 py-1 space-y-0.5">
        <div className="flex justify-between">
          <span>Peak time:</span>
          <span className="text-gray-300">{formatValue(peakTime)}</span>
        </div>
        <div className="flex justify-between">
          <span>Freq width (fwidth):</span>
          <span className="text-gray-300">{width > 0 ? formatValue(fwidth) : '∞'}</span>
        </div>
        <div className="flex justify-between">
          <span>Wavelength (λ):</span>
          <span className="text-gray-300">{formatValue(wavelength)}</span>
        </div>
      </div>

      {/* Integration option */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">Integrated source</label>
        <input
          type="checkbox"
          checked={source.isIntegrated || false}
          onChange={(e) => onUpdate({ isIntegrated: e.target.checked })}
          className="rounded bg-neutral-700 border-gray-600"
        />
      </div>
    </div>
  );
};
