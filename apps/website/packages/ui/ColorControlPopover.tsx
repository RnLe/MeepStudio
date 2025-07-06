import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore } from '../providers/CanvasStore';

interface ColorControlPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorPosition: { x: number; y: number };
}

export const ColorControlPopover: React.FC<ColorControlPopoverProps> = ({
  isOpen,
  onClose,
  anchorPosition,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { colorSettings, setColorSetting, showColors } = useCanvasStore();
  const [adjustedPosition, setAdjustedPosition] = useState(anchorPosition);

  // Adjust position to keep popover on screen
  useEffect(() => {
    if (!isOpen || !popoverRef.current) return;

    const rect = popoverRef.current.getBoundingClientRect();
    const padding = 10; // Padding from screen edges
    
    let newX = anchorPosition.x;
    let newY = anchorPosition.y;

    // Check right edge
    if (newX + rect.width > window.innerWidth - padding) {
      newX = window.innerWidth - rect.width - padding;
    }

    // Check bottom edge
    if (newY + rect.height > window.innerHeight - padding) {
      newY = window.innerHeight - rect.height - padding;
    }

    // Check left edge
    if (newX < padding) {
      newX = padding;
    }

    // Check top edge
    if (newY < padding) {
      newY = padding;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [isOpen, anchorPosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const elements: Array<{
    key: 'background' | 'geometries' | 'boundaries';
    label: string;
  }> = [
    { key: 'background', label: 'Background' },
    { key: 'geometries', label: 'Geometries' },
    { key: 'boundaries', label: 'Boundaries' },
  ];

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-2xl p-4"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        minWidth: '240px',
      }}
    >
      <div className="text-sm font-medium text-gray-300 mb-3">Color Visibility Settings</div>
      
      {/* Header row */}
      <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-gray-400">
        <div></div>
        <div className="text-center">Mode Off</div>
        <div className="text-center">Mode On</div>
      </div>
      
      {/* Element rows */}
      <div className="space-y-2">
        {elements.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-3 gap-2 items-center">
            <div className="text-sm text-gray-300">{label}</div>
            
            {/* Off state checkbox */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={colorSettings.offState[key]}
                onChange={(e) => {
                  setColorSetting('offState', key, e.target.checked);
                  // Force re-render by triggering a dummy state update
                  useCanvasStore.setState((state) => ({ ...state }));
                }}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
            </div>
            
            {/* On state checkbox */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={colorSettings.onState[key]}
                onChange={(e) => {
                  setColorSetting('onState', key, e.target.checked);
                  // Force re-render by triggering a dummy state update
                  useCanvasStore.setState((state) => ({ ...state }));
                }}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Help text - show current mode */}
      <div className="mt-3 pt-3 border-t border-neutral-700 text-xs text-gray-500">
        <div>Configure which elements show color in each mode</div>
        <div className="mt-1 text-gray-400">
          Current mode: <span className="font-medium">{showColors ? 'Mode On' : 'Mode Off'}</span>
        </div>
      </div>
    </div>
  );
};
