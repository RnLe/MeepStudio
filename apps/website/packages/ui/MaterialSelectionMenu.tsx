"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MaterialCatalog } from '../constants/meepMaterialPresets';
import { useMaterialColorStore } from '../providers/MaterialColorStore';
import { Search, X } from 'lucide-react';

interface MaterialSelectionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (materialKey: string) => void;
  currentMaterial?: string;
  anchorEl?: HTMLElement | null;
}

export const MaterialSelectionMenu: React.FC<MaterialSelectionMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentMaterial = "Air",
  anchorEl,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredMaterial, setHoveredMaterial] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { getMaterialColor } = useMaterialColorStore();

  // Calculate position based on anchor element
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if (anchorEl && isOpen) {
      const rect = anchorEl.getBoundingClientRect();
      const menuHeight = 400; // Approximate height
      const menuWidth = 320;
      
      // Calculate position to avoid going off-screen
      let top = rect.bottom + 8;
      let left = rect.left;
      
      // Check if menu would go off bottom of screen
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 8;
      }
      
      // Check if menu would go off right of screen
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }
      
      setPosition({ top, left });
    }
  }, [anchorEl, isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  // Filter and sort materials alphabetically
  const materials = Object.entries(MaterialCatalog)
    .filter(([key, material]) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        key.toLowerCase().includes(query) ||
        material.name?.toLowerCase().includes(query) ||
        material.abbreviation?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '320px',
        maxHeight: '400px',
      }}
    >
      {/* Search header */}
      <div className="p-3 border-b border-neutral-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
          <input
            type="text"
            placeholder="Search materials..."
            className="w-full bg-neutral-800 rounded pl-10 pr-8 py-2 text-sm placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Materials list */}
      <div className="overflow-y-auto max-h-[320px] p-2">
        {materials.length === 0 ? (
          <div className="text-center text-neutral-500 py-4">
            No materials found
          </div>
        ) : (
          <div className="space-y-0.5">
            {materials.map(([key, material]) => {
              const color = getMaterialColor(key, material.color) || material.color || "#888";
              const displayName = material.name || key;
              const showAbbreviation = material.abbreviation && material.abbreviation !== displayName;
              const isSelected = key === currentMaterial;
              const isHovered = hoveredMaterial === key;

              return (
                <button
                  key={key}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-all text-left
                    ${isSelected ? 'bg-blue-600/20 border border-blue-500/50' : ''}
                    ${!isSelected && isHovered ? 'bg-neutral-800' : ''}
                    ${!isSelected && !isHovered ? 'hover:bg-neutral-800' : ''}
                  `}
                  onMouseEnter={() => setHoveredMaterial(key)}
                  onMouseLeave={() => setHoveredMaterial(null)}
                  onClick={() => {
                    onSelect(key);
                    onClose();
                  }}
                >
                  {/* Material color square */}
                  <div 
                    className="w-4 h-4 rounded flex-shrink-0 border border-neutral-600"
                    style={{ backgroundColor: color }}
                  />
                  
                  {/* Material name */}
                  <span className="text-sm truncate flex-1">
                    {displayName}
                    {showAbbreviation && (
                      <span className="text-neutral-400 ml-1">({material.abbreviation})</span>
                    )}
                  </span>
                  
                  {/* Selected indicator */}
                  {isSelected && (
                    <span className="text-xs text-blue-400">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
