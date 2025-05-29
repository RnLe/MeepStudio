"use client";
import React from "react";
import { useCanvasStore } from "../../providers/CanvasStore";
import { SourceComponent } from "../../types/meepSourceTypes";
import { LabeledVector } from "../MathVector";
import { Zap, RotateCcw } from "lucide-react";
import { ContinuousWavePlot } from "../plots/ContinuousWavePlot";
import { Dial } from "../components/Dial";
import { LengthUnit } from "../../types/meepProjectTypes";
import { 
  convertLength,
  convertFrequency,
  convertTime,
  convertWavelength
} from "../../utils/physicalUnitsHelper";

interface ContinuousSourcePropertiesProps {
  source: any;
  onUpdate: (partial: Partial<any>) => void;
  projectUnit?: LengthUnit;
  projectA?: number;
}

export const ContinuousSourceProperties: React.FC<ContinuousSourcePropertiesProps> = ({ 
  source, 
  onUpdate,
  projectUnit = LengthUnit.NM,
  projectA = 1
}) => {
  const [showUnits, setShowUnits] = React.useState(false);
  const [lineOrientation, setLineOrientation] = React.useState<'horizontal' | 'vertical'>('horizontal');
  const [areaOrientation, setAreaOrientation] = React.useState<'wide' | 'tall'>('wide');
  const [isEditingEndTime, setIsEditingEndTime] = React.useState(false);

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
  const startTime = source.startTime || 0;
  const endTime = source.endTime || 1e20;
  const width = source.width || 0;
  const wavelength = frequency > 0 ? 1 / frequency : 0;
  const fwidth = source.fwidth || (width > 0 ? 1 / width : Infinity);
  const slowness = source.slowness || 3.0;

  // Frequency-domain FWHM (same expression as in plot)
  const sigma        = width > 0 ? 1 / (2 * Math.PI * width * slowness) : Infinity;
  const fwhmBandwidth = width > 0 ? 2 * Math.sqrt(2 * Math.log(2)) * sigma : 0;

  // Ensure slowness is not less than width
  React.useEffect(() => {
    if (width > 0 && slowness < width) {
      onUpdate({ slowness: width });
    }
  }, [width, slowness, onUpdate]);

  // Determine source type based on size
  const sizeX = source.size?.x || 0;
  const sizeY = source.size?.y || 0;
  const sourceType = sizeX === 0 && sizeY === 0 ? 'Point' : 
                    (sizeX === 0 || sizeY === 0) ? 'Line' : 'Area';

  // Round values for display
  const formatValue = (value: number, decimals: number = 2) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Set default component to Ex if not set
  React.useEffect(() => {
    if (!source.component) {
      onUpdate({ component: SourceComponent.Ex });
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

  // Handle end time click
  const handleEndTimeClick = () => {
    if (endTime >= 1e20) {
      setIsEditingEndTime(true);
      onUpdate({ endTime: 10 }); // Set to a reasonable default when clicking infinity
    }
  };

  const handleEndTimeChange = (val: number) => {
    onUpdate({ endTime: val });
  };

  const handleEndTimeFocusLoss = () => {
    // Return to infinity if at max value
    if (source.endTime >= 1e19) {
      onUpdate({ endTime: 1e20 });
      setIsEditingEndTime(false);
    }
  };

  const handleResetTimeFrequencyParams = () => {
    onUpdate({
      amplitude: { real: 1, imag: 0 },
      frequency: 1,
      startTime: 0,
      endTime: 1e20,
      width: 0,
      slowness: 3.0
    });
  };

  // Check if any time/frequency parameter differs from default
  const hasNonDefaultTimeFreqParams = React.useMemo(() => {
    return (
      (source.amplitude?.real !== 1) ||
      (source.amplitude?.imag !== 0) ||
      (source.frequency !== 1) ||
      (source.startTime !== 0) ||
      (source.endTime !== 1e20) ||
      (source.width !== 0) ||
      (source.slowness !== 3.0)
    );
  }, [source]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">Continuous Source</h3>
      </div>
      
      {/* Source type indicator */}
      <div className="text-xs text-gray-400 bg-neutral-700/50 rounded px-2 py-1">
        Type: <span className="text-gray-200 font-medium">{sourceType} Source (CW)</span>
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
      
      {/* Continuous Wave Visualization */}
      <ContinuousWavePlot
        frequency={source.frequency || 1}
        startTime={source.startTime || 0}
        endTime={source.endTime || 1e20}
        width={source.width || 0}
        slowness={source.slowness || 3.0}
        amplitude={source.amplitude || { real: 1, imag: 0 }}
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
                value={source.component || SourceComponent.Ex}
                onChange={(e) => onUpdate({ component: e.target.value })}
                className="w-full px-1 py-0.5 text-xs bg-neutral-700 rounded text-gray-200"
              >
                {Object.values(SourceComponent).filter(comp => comp !== "ALL_COMPONENTS").map(comp => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Rise Time</div>
              <div className="text-gray-300">
                {width > 0 ? formatValue(width * slowness) : '0'}
                <div className="text-blue-400 text-[9px] h-3">
                  {showUnits && width > 0 && convertTime(width * slowness, projectA, projectUnit)}
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
            <div className="text-center">
              <div className="text-gray-400" title="Full Width at Half Maximum">Bandwidth</div>
              <div className="text-gray-300">
                {width > 0 ? formatValue(fwhmBandwidth) : '∞'}
                <div className="text-blue-400 text-[9px] h-3">
                  {showUnits && width > 0 && convertFrequency(fwhmBandwidth, projectA, projectUnit)}
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
                    value={source.amplitude?.real || 1}
                    onChange={(val) => onUpdate({ amplitude: { ...(source.amplitude || { real: 1, imag: 0 }), real: val } })}
                    mode="linear"
                    min={-10}
                    max={10}
                    step={0.001}
                    size={36}
                    label="Real"
                    defaultValue={1}
                  />
                </div>
                <div className="flex justify-center">
                  <Dial
                    value={source.amplitude?.imag || 0}
                    onChange={(val) => onUpdate({ amplitude: { ...(source.amplitude || { real: 1, imag: 0 }), imag: val } })}
                    mode="linear"
                    min={-10}
                    max={10}
                    step={0.001}
                    size={36}
                    label="Imaginary"
                    defaultValue={0}
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
                    value={source.frequency || 1}
                    onChange={(val) => onUpdate({ frequency: val })}
                    mode="10x"
                    min={0.001}
                    step={0.001}
                    size={36}
                    label="Frequency"
                    defaultValue={1}
                  />
                  <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                    {showUnits && convertFrequency(source.frequency || 1, projectA, projectUnit)}
                  </div>
                </div>
              </div>
              
              {/* Time column - Start and End stacked */}
              <div className="flex flex-col gap-2">
                {/* Start Time */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <Dial
                      value={source.startTime || 0}
                      onChange={(val) => onUpdate({ startTime: val })}
                      mode="linear"
                      min={0}
                      step={0.001}
                      size={36}
                      label="Start Time"
                      defaultValue={0}
                    />
                    <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                      {showUnits && convertTime(source.startTime || 0, projectA, projectUnit)}
                    </div>
                  </div>
                </div>
                
                {/* End Time */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    {source.endTime >= 1e19 ? (
                      <>
                        <div 
                          className="text-center cursor-pointer"
                          onClick={() => onUpdate({ endTime: 10 })}
                        >
                          <div className="w-[36px] h-[36px] rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-gray-500 text-sm transition-colors">
                            ∞
                          </div>
                        </div>
                        <label className="text-[9px] text-gray-400 mt-1">End Time</label>
                        <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                          {/* Empty div to maintain spacing */}
                        </div>
                      </>
                    ) : (
                      <Dial
                        value={source.endTime || 10}
                        onChange={(val) => onUpdate({ endTime: val })}
                        mode="10x"
                        min={0.001}
                        max={1e20}
                        step={0.001}
                        size={36}
                        label="End Time"
                        defaultValue={1e20}
                        resetIcon="infinity"
                      />
                    )}
                    <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                      {showUnits && source.endTime < 1e19 && convertTime(source.endTime, projectA, projectUnit)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Width parameters column */}
              <div className="flex flex-col gap-2">
                {/* Smoothing Width */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <Dial
                      value={source.width || 0}
                      onChange={(val) => onUpdate({ width: val })}
                      mode="linear"
                      min={0}
                      max={10000}
                      step={0.001}
                      size={36}
                      label="Width"
                      defaultValue={0}
                    />
                    <div className="text-[9px] text-blue-400 mt-0.5 h-3">
                      {showUnits && source.width > 0 && convertTime(source.width || 0, projectA, projectUnit)}
                    </div>
                  </div>
                </div>
                
                {/* Slowness */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <Dial
                      value={source.slowness || 3.0}
                      onChange={(val) => onUpdate({ slowness: val })}
                      mode="linear"
                      min={Math.max(0.01, source.width || 0.01)}
                      max={10000}
                      step={0.001}
                      size={36}
                      label="Slowness"
                      defaultValue={3.0}
                    />
                  </div>
                </div>
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
          checked={source.isIntegrated || false}
          onChange={(e) => e.stopPropagation()}
          className="rounded bg-neutral-700 border-gray-600 cursor-pointer"
        />
      </div>
    </div>
  );
};
