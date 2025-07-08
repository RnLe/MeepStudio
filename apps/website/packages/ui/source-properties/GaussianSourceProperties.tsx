"use client";
import React from "react";
import { SourceComponent } from "../../types/meepSourceTypes";
import { RotateCcw } from "lucide-react";
import { GaussianPulsePlot } from "../plots/GaussianPulsePlot";
import { Dial } from "../components/Dial";
import CustomLucideIcon from "../CustomLucideIcon";
import { LengthUnit } from "../../types/meepProjectTypes";
import { useNumberInputWheel } from "../../hooks/useNumberInputWheel";
import { 
  convertLength,
  convertFrequency,
  convertTime,
  convertWavelength
} from "../../utils/physicalUnitsHelper";
import { 
  getSourceDefaults, 
  GAUSSIAN_SOURCE_DEFAULTS,
  BASE_SOURCE_DEFAULTS 
} from "../../constants/sourceDefaults";

interface GaussianSourcePropertiesProps {
  source: any;
  onUpdate: (partial: Partial<any>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  projectUnit?: LengthUnit;
  projectA?: number;
}

export const GaussianSourceProperties: React.FC<GaussianSourcePropertiesProps> = ({ 
  source, 
  onUpdate,
  onDragStart,
  onDragEnd,
  projectUnit = LengthUnit.NM,
  projectA = 1
}) => {
  // Get default values
  const defaults = React.useMemo(() => getSourceDefaults('gaussian'), []);
  const { createWheelHandler } = useNumberInputWheel();
  
  const [showUnits, setShowUnits] = React.useState(false);
  const [lineOrientation, setLineOrientation] = React.useState<'horizontal' | 'vertical'>('horizontal');
  const [areaOrientation, setAreaOrientation] = React.useState<'wide' | 'tall'>('wide');

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

  // Calculate derived values using defaults
  const frequency = source.frequency || defaults.frequency;
  const width = source.width || defaults.width;
  const fwidth = width > 0 ? 1 / width : Infinity;
  const startTime = source.start_time ?? defaults.start_time;
  const cutoff = source.cutoff || defaults.cutoff;
  const peakTime = startTime + cutoff * width;
  const wavelength = frequency > 0 ? 1 / frequency : 0;

  // Determine source type based on size
  const sizeX = source.size?.x || 0;
  const sizeY = source.size?.y || 0;
  const sourceType = sizeX === 0 && sizeY === 0 ? 'Point' : 
                    (sizeX === 0 || sizeY === 0) ? 'Line' : 'Area';

  // Round values for display
  const formatValue = (value: number, decimals: number = 2) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Set default component to Ez if not set
  React.useEffect(() => {
    if (!source.component) {
      onUpdate({ component: defaults.component });
    }
  }, []);

  // Handle preset buttons
  const handlePointPreset = () => {
    onUpdate({ size: { x: 0, y: 0 } });
  };

  const handleLinePreset = () => {
    if (sourceType === 'Line') {
      // If already a line, transpose
      onUpdate({ size: { x: sizeY, y: sizeX } });
      setLineOrientation(sizeX > 0 ? 'vertical' : 'horizontal');
    } else if (sourceType === 'Point') {
      // From point, apply default based on orientation
      if (lineOrientation === 'horizontal') {
        onUpdate({ size: { x: 1, y: 0 } });
      } else {
        onUpdate({ size: { x: 0, y: 1 } });
      }
    } else {
      // From area, keep width and set height to 0
      onUpdate({ size: { x: sizeX, y: 0 } });
      setLineOrientation('horizontal');
    }
  };

  const handleAreaPreset = () => {
    if (sourceType === 'Area') {
      // If already an area, always transpose
      onUpdate({ size: { x: sizeY, y: sizeX } });
      // Toggle orientation state even when dimensions are equal
      if (sizeX === sizeY) {
        setAreaOrientation(prev => prev === 'wide' ? 'tall' : 'wide');
      } else {
        setAreaOrientation(sizeX >= sizeY ? 'tall' : 'wide');
      }
    } else if (sourceType === 'Point') {
      // From point, set both to 1
      onUpdate({ size: { x: 1, y: 1 } });
    } else if (sourceType === 'Line') {
      // From line, set missing dimension to 1
      onUpdate({ size: { x: sizeX || 1, y: sizeY || 1 } });
    }
  };

  // Update orientations when size changes
  React.useEffect(() => {
    if (sourceType === 'Line') {
      setLineOrientation(sizeX > 0 ? 'horizontal' : 'vertical');
    } else if (sourceType === 'Area' && sizeX !== sizeY) {
      // Only update area orientation if dimensions are different
      setAreaOrientation(sizeX > sizeY ? 'wide' : 'tall');
    }
  }, [sizeX, sizeY, sourceType]);

  const handleResetTimeFrequencyParams = () => {
    onUpdate({
      amplitude: defaults.amplitude,
      frequency: defaults.frequency,
      width: defaults.width,
      start_time: defaults.start_time,
      cutoff: defaults.cutoff
    });
  };

  // Check if any time/frequency parameter differs from default
  const hasNonDefaultTimeFreqParams = React.useMemo(() => {
    return (
      (source.amplitude?.real !== defaults.amplitude.real) ||
      (source.amplitude?.imag !== defaults.amplitude.imag) ||
      (source.frequency !== defaults.frequency) ||
      (source.width !== defaults.width) ||
      (source.start_time !== defaults.start_time) ||
      (source.cutoff !== defaults.cutoff)
    );
  }, [source, defaults]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CustomLucideIcon src="/icons/gauss_wave_package.svg" size={30} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">Gaussian Source</h3>
      </div>
      
      {/* Source type indicator */}
      <div className="text-xs text-gray-400 bg-neutral-700/50 rounded px-2 py-1">
        Type: <span className="text-gray-200 font-medium">{sourceType} Source (Pulse)</span>
      </div>
      
      {/* Unit mode toggle */}
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
      
      {/* Gaussian Pulse Visualization */}
      <GaussianPulsePlot
        frequency={source.frequency || defaults.frequency}
        pulseWidth={source.width || defaults.width}
        startTime={source.start_time || defaults.start_time}
        cutoff={source.cutoff || defaults.cutoff}
        amplitude={source.amplitude || defaults.amplitude}
        showUnits={showUnits}
        projectUnit={projectUnit}
        projectA={projectA}
      />
      
      {/* Component selection and derived values */}
      <div className="bg-neutral-700/30 rounded-lg p-2">
        <div className="space-y-2">
          {/* Derived values display with component */}
          <div className="grid grid-cols-4 gap-2 text-[10px] text-gray-500">
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">Component</label>
              <select
                value={source.component || defaults.component}
                onChange={(e) => onUpdate({ component: e.target.value })}
                className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              >
                {Object.values(SourceComponent).filter(comp => comp !== "ALL_COMPONENTS").map(comp => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Peak Time</div>
              <div className="text-gray-300">
                {formatValue(peakTime)}
                <div className="text-blue-400 text-[9px] h-3">
                  {showUnits && convertTime(peakTime, projectA, projectUnit)}
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Frequency Width</div>
              <div className="text-gray-300">
                {width > 0 ? formatValue(fwidth) : '∞'}
                <div className="text-blue-400 text-[9px] h-3">
                  {showUnits && width > 0 && convertFrequency(fwidth, projectA, projectUnit)}
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Wavelength (λ)</div>
              <div className="text-gray-300">
                {formatValue(wavelength)}
                <div className="text-blue-400 text-[9px] h-3">
                  {showUnits && convertWavelength(wavelength, projectA, projectUnit)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time & Frequency Parameters - 2x4 grid layout */}
      <div className="bg-neutral-700/30 rounded-lg p-2 relative">
        <label className="text-[10px] text-gray-400 block mb-1">Time & Frequency Parameters</label>
        
        {/* Reset button - only show when values differ from defaults */}
        {hasNonDefaultTimeFreqParams && (
          <button
            onClick={handleResetTimeFrequencyParams}
            className="absolute top-1 right-1 p-1 rounded-full transition-colors group"
            title="Reset all parameters"
          >
            <RotateCcw size={12} className="text-gray-500 group-hover:text-white transition-colors" />
          </button>
        )}
        
        <div className="grid grid-cols-4 gap-2 items-center">
          {/* Amplitude column (2x1) */}
          <div className="col-span-1">
            <div className="bg-neutral-700/50 rounded p-1.5">
              <label className="text-[10px] text-gray-400 block mb-1 text-center">Amplitude</label>
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Dial
                    value={source.amplitude?.real || defaults.amplitude.real}
                    onChange={(val) => onUpdate({ amplitude: { ...(source.amplitude || defaults.amplitude), real: val } })}
                    mode="linear"
                    min={-10}
                    max={10}
                    step={0.1}
                    size={36}
                    label="Real"
                    defaultValue={defaults.amplitude.real}
                  />
                </div>
                <div className="flex justify-center">
                  <Dial
                    value={source.amplitude?.imag || defaults.amplitude.imag}
                    onChange={(val) => onUpdate({ amplitude: { ...(source.amplitude || defaults.amplitude), imag: val } })}
                    mode="linear"
                    min={-10}
                    max={10}
                    step={0.1}
                    size={36}
                    label="Imaginary"
                    defaultValue={defaults.amplitude.imag}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Frequency domain parameters (3 columns) */}
          <div className="col-span-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Frequency */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <Dial
                    value={source.frequency || defaults.frequency}
                    onChange={(val) => onUpdate({ frequency: val })}
                    mode="10x"
                    min={0.001}
                    step={0.001}
                    size={36}
                    label="Frequency"
                    defaultValue={defaults.frequency}
                  />
                  <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                    {showUnits && convertFrequency(source.frequency || defaults.frequency, projectA, projectUnit)}
                  </div>
                </div>
              </div>
              
              {/* Pulse Width */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <Dial
                    value={source.width || defaults.width}
                    onChange={(val) => onUpdate({ width: val })}
                    mode="10x"
                    min={0.001}
                    step={0.0001}
                    size={36}
                    label="Pulse Width"
                    defaultValue={defaults.width}
                  />
                  <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                    {showUnits && convertTime(source.width || defaults.width, projectA, projectUnit)}
                  </div>
                </div>
              </div>
              
              {/* Start Time */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <Dial
                    value={source.start_time || defaults.start_time}
                    onChange={(val) => onUpdate({ start_time: val })}
                    mode="linear"
                    min={0}
                    step={0.001}
                    size={36}
                    label="Start Time"
                    defaultValue={defaults.start_time}
                  />
                  <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                    {showUnits && convertTime(source.start_time || defaults.start_time, projectA, projectUnit)}
                  </div>
                </div>
              </div>
              
              {/* Cutoff - positioned below frequency */}
              <div className="flex justify-center col-start-2">
                <Dial
                  value={source.cutoff || defaults.cutoff}
                  onChange={(val) => onUpdate({ cutoff: val })}
                  mode="linear"
                  min={1}
                  max={20}
                  step={0.001}
                  size={36}
                  label="Cutoff"
                  defaultValue={defaults.cutoff}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Position and Size */}
      <div className="bg-neutral-700/30 rounded-lg p-2">
        <label className="text-[10px] text-gray-400 block mb-1">
          Position & Size {sourceType !== 'Point' && <span className="text-gray-500">({sourceType})</span>}
        </label>
        <div className="flex gap-2 items-center">
          {/* Position column */}
          <div className="space-y-1">
            <div>
              <input
                type="number"
                value={formatValue(source.pos?.x || 0)}
                onChange={(e) => handleVectorChange('pos', 'x', e.target.value)}
                onWheel={createWheelHandler('pos.x', source.pos?.x || 0, (newValue) => 
                  handleVectorChange('pos', 'x', newValue.toString())
                )}
                className="w-16 px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
                step="0.01"
              />
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500">x</span>
                <span className="text-[9px] text-blue-400 h-3">
                  {showUnits && convertLength(source.pos?.x || 0, projectA, projectUnit)}
                </span>
              </div>
            </div>
            <div>
              <input
                type="number"
                value={formatValue(source.pos?.y || 0)}
                onChange={(e) => handleVectorChange('pos', 'y', e.target.value)}
                onWheel={createWheelHandler('pos.y', source.pos?.y || 0, (newValue) => 
                  handleVectorChange('pos', 'y', newValue.toString())
                )}
                className="w-16 px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
                step="0.01"
              />
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500">y</span>
                <span className="text-[9px] text-blue-400 h-3">
                  {showUnits && convertLength(source.pos?.y || 0, projectA, projectUnit)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Size section with presets */}
          <div className="flex-1">
            {/* Preset buttons */}
            <div className="flex gap-1 mb-2">
              <button
                onClick={handlePointPreset}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  sourceType === 'Point' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
                }`}
              >
                Point
              </button>
              <button
                onClick={handleLinePreset}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  sourceType === 'Line' 
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
                  sourceType === 'Area' 
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
                  value={source.size?.x || 0}
                  onChange={(val) => onUpdate({ size: { ...(source.size || { x: 0, y: 0 }), x: val } })}
                  mode="linear"
                  min={0}
                  step={0.01}
                  size={36}
                  label="Width"
                />
                <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                  {showUnits && convertLength(source.size?.x || 0, projectA, projectUnit)}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <Dial
                  value={source.size?.y || 0}
                  onChange={(val) => onUpdate({ size: { ...(source.size || { x: 0, y: 0 }), y: val } })}
                  mode="linear"
                  min={0}
                  step={0.01}
                  size={36}
                  label="Height"
                />
                <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                  {showUnits && convertLength(source.size?.y || 0, projectA, projectUnit)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration option */}
      <div 
        className="flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-neutral-700/30 transition-colors"
        onClick={() => onUpdate({ isIntegrated: !source.isIntegrated })}
      >
        <label className="text-xs text-gray-400 cursor-pointer select-none">Integrated source</label>
        <input
          type="checkbox"
          checked={source.isIntegrated || defaults.is_integrated}
          onChange={(e) => e.stopPropagation()}
          className="rounded bg-neutral-700 border-gray-600 cursor-pointer"
        />
      </div>
    </div>
  );
};
