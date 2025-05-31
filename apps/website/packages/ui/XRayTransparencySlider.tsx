"use client";

import React, { useRef, useEffect } from 'react';
import { useCanvasStore } from '../providers/CanvasStore';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface XRayTransparencySliderProps {
  isVisible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export const XRayTransparencySlider: React.FC<XRayTransparencySliderProps> = ({
  isVisible,
  onClose,
  position
}) => {
  const xRayTransparency = useCanvasStore((s) => s.xRayTransparency);
  const setXRayTransparency = useCanvasStore((s) => s.setXRayTransparency);
  const xRayTransparencySettings = useCanvasStore((s) => s.xRayTransparencySettings);
  const setXRayTransparencySetting = useCanvasStore((s) => s.setXRayTransparencySetting);
  const setUnifiedXRayTransparency = useCanvasStore((s) => s.setUnifiedXRayTransparency);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Close slider when clicking outside
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (sliderRef.current && !sliderRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  // Close on escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const handleUnifiedSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setXRayTransparency(value);
    // Update all individual settings when in unified mode
    if (xRayTransparencySettings.unified) {
      setXRayTransparencySetting('background', value);
      setXRayTransparencySetting('geometries', value);
      setXRayTransparencySetting('boundaries', value);
      setXRayTransparencySetting('sources', value);           // +++
    }
  };

  const handleIndividualSliderChange = (element: 'background' | 'geometries' | 'boundaries' | 'sources', value: number) => {
    setXRayTransparencySetting(element, value);
  };

  const toggleUnified = () => {
    setUnifiedXRayTransparency(!xRayTransparencySettings.unified);
  };

  const sliders = [
    { key: 'background' as const, label: 'Background' },
    { key: 'geometries' as const, label: 'Geometries' },
    { key: 'boundaries' as const, label: 'Boundaries' },
    { key: 'sources'    as const, label: 'Sources'    },    // +++
  ];

  return (
    <div
      ref={sliderRef}
      className="absolute z-50 bg-neutral-800 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-600"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '280px',
      }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-300 font-semibold">
            X-Ray Transparency
          </div>
          <button
            onClick={toggleUnified}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title={xRayTransparencySettings.unified ? "Show individual controls" : "Show unified control"}
          >
            {xRayTransparencySettings.unified ? (
              <ChevronDown size={14} className="text-gray-400" />
            ) : (
              <ChevronUp size={14} className="text-gray-400" />
            )}
          </button>
        </div>
        
        {xRayTransparencySettings.unified ? (
          // Unified slider
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-16">All</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={xRayTransparency}
              onChange={handleUnifiedSliderChange}
              className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #4a7ec7 0%, #4a7ec7 ${xRayTransparency * 100}%, #6b7280 ${xRayTransparency * 100}%, #6b7280 100%)`
              }}
            />
            <span className="text-xs text-gray-400 w-10 text-right">
              {Math.round(xRayTransparency * 100)}%
            </span>
          </div>
        ) : (
          // Individual sliders
          <div className="flex flex-col gap-2">
            {sliders.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-16">{label}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={xRayTransparencySettings[key]}
                  onChange={(e) => handleIndividualSliderChange(key, parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #4a7ec7 0%, #4a7ec7 ${xRayTransparencySettings[key] * 100}%, #6b7280 ${xRayTransparencySettings[key] * 100}%, #6b7280 100%)`
                  }}
                />
                <span className="text-xs text-gray-400 w-10 text-right">
                  {Math.round(xRayTransparencySettings[key] * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4a7ec7;
          border: 2px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4a7ec7;
          border: 2px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: none;
        }
      `}</style>
    </div>
  );
};
