import React, { useState, useRef, useEffect } from "react";
import { useCanvasStore } from "../../providers/CanvasStore";

export type EdgeAssignment = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface PMLEdgeSelectorProps {
  edgeAssignments: EdgeAssignment;
  activeParameterSets: number[]; // Indices of active parameter sets
  parameterColors: { [index: number]: string };
  onChange: (edge: 'top' | 'right' | 'bottom' | 'left', parameterSetIndex: number | undefined) => void;
  onBulkChange?: (newAssignments: EdgeAssignment) => void; // New prop for bulk updates
}

export const PMLEdgeSelector: React.FC<PMLEdgeSelectorProps> = ({ 
  edgeAssignments, 
  activeParameterSets,
  parameterColors,
  onChange,
  onBulkChange
}) => {
  const [hoveredEdge, setHoveredEdge] = useState<'top' | 'right' | 'bottom' | 'left' | null>(null);
  const [hoveredButton, setHoveredButton] = useState<'all' | 'x' | 'y' | 'none' | null>(null);
  const [contextMenu, setContextMenu] = useState<{ edge: 'top' | 'right' | 'bottom' | 'left'; x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to get next assignment in cycle
  const getNextAssignment = (currentAssignment: number | undefined): number | undefined => {
    if (activeParameterSets.length === 0) {
      return undefined;
    }
    
    const currentIndex = currentAssignment !== undefined 
      ? activeParameterSets.indexOf(currentAssignment)
      : -1;
    
    if (currentIndex === -1) {
      // Not assigned or assigned to inactive set, assign to first active
      return activeParameterSets[0];
    } else if (currentIndex === activeParameterSets.length - 1) {
      // At last active set, clear assignment
      return undefined;
    } else {
      // Move to next active set
      return activeParameterSets[currentIndex + 1];
    }
  };

  // Single edge click handler
  const handleEdgeClick = (edge: 'top' | 'right' | 'bottom' | 'left') => {
    const nextAssignment = getNextAssignment(edgeAssignments[edge]);
    onChange(edge, nextAssignment);
  };

  const handleEdgeRightClick = (e: React.MouseEvent, edge: 'top' | 'right' | 'bottom' | 'left') => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ edge, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
  };

  // Cycle multiple edges at once
  const cycleEdges = (edges: ('top' | 'right' | 'bottom' | 'left')[]) => {
    if (onBulkChange) {
      // Use bulk change if available
      const newAssignments = { ...edgeAssignments };
      edges.forEach(edge => {
        newAssignments[edge] = getNextAssignment(edgeAssignments[edge]);
      });
      onBulkChange(newAssignments);
    } else {
      // Fall back to individual updates
      edges.forEach(edge => {
        const nextAssignment = getNextAssignment(edgeAssignments[edge]);
        onChange(edge, nextAssignment);
      });
    }
  };

  // Clear multiple edges at once
  const clearEdges = (edges: ('top' | 'right' | 'bottom' | 'left')[]) => {
    if (onBulkChange) {
      // Use bulk change if available
      const newAssignments = { ...edgeAssignments };
      edges.forEach(edge => {
        delete newAssignments[edge];
      });
      onBulkChange(newAssignments);
    } else {
      // Fall back to individual updates
      edges.forEach(edge => {
        onChange(edge, undefined);
      });
    }
  };

  const handlePresetAll = () => {
    if (activeParameterSets.length > 0) {
      cycleEdges(['top', 'right', 'bottom', 'left']);
    }
  };

  const handlePresetNone = () => {
    clearEdges(['top', 'right', 'bottom', 'left']);
  };

  const handlePresetX = () => {
    if (activeParameterSets.length > 0) {
      if (onBulkChange) {
        // Create new assignments with X edges cycled and Y edges cleared
        const newAssignments = { ...edgeAssignments };
        // Cycle X edges
        newAssignments.left = getNextAssignment(edgeAssignments.left);
        newAssignments.right = getNextAssignment(edgeAssignments.right);
        // Clear Y edges
        delete newAssignments.top;
        delete newAssignments.bottom;
        onBulkChange(newAssignments);
      } else {
        // Fall back to individual updates
        onChange('left', getNextAssignment(edgeAssignments.left));
        onChange('right', getNextAssignment(edgeAssignments.right));
        onChange('top', undefined);
        onChange('bottom', undefined);
      }
    }
  };

  const handlePresetY = () => {
    if (activeParameterSets.length > 0) {
      if (onBulkChange) {
        // Create new assignments with Y edges cycled and X edges cleared
        const newAssignments = { ...edgeAssignments };
        // Cycle Y edges
        newAssignments.top = getNextAssignment(edgeAssignments.top);
        newAssignments.bottom = getNextAssignment(edgeAssignments.bottom);
        // Clear X edges
        delete newAssignments.left;
        delete newAssignments.right;
        onBulkChange(newAssignments);
      } else {
        // Fall back to individual updates
        onChange('top', getNextAssignment(edgeAssignments.top));
        onChange('bottom', getNextAssignment(edgeAssignments.bottom));
        onChange('left', undefined);
        onChange('right', undefined);
      }
    }
  };

  const edgeThickness = 20;
  const squareSize = 100;
  const innerSize = squareSize - 2 * edgeThickness;

  const getEdgeColor = (edge: 'top' | 'right' | 'bottom' | 'left') => {
    const assignment = edgeAssignments[edge];
    if (assignment !== undefined && parameterColors[assignment]) {
      // If already assigned, show darker color on hover
      if (hoveredEdge === edge) {
        const baseColor = parameterColors[assignment];
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        return `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`;
      }
      return parameterColors[assignment];
    }
    
    // Show preview when hovering buttons
    if (hoveredButton === 'all' || 
        (hoveredButton === 'x' && (edge === 'left' || edge === 'right')) ||
        (hoveredButton === 'y' && (edge === 'top' || edge === 'bottom'))) {
      return "#94a3b8"; // slate-400
    }
    
    if (hoveredEdge === edge) return "#60a5fa"; // blue-400
    return "#404040"; // neutral gray
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        {/* Square with selectable edges */}
        <div className="relative" style={{ width: squareSize, height: squareSize }}>
          {/* Inner square first */}
          <div
            className="absolute bg-neutral-800"
            style={{
              top: edgeThickness,
              left: edgeThickness,
              width: innerSize,
              height: innerSize,
            }}
          />
          
          {/* Top edge */}
          <div
            className="absolute cursor-pointer transition-colors duration-150"
            style={{
              top: 0,
              left: 0,
              width: squareSize,
              height: edgeThickness,
              backgroundColor: getEdgeColor('top'),
              zIndex: 2,
            }}
            onMouseEnter={() => setHoveredEdge('top')}
            onMouseLeave={() => setHoveredEdge(null)}
            onClick={() => handleEdgeClick('top')}
            onContextMenu={(e) => handleEdgeRightClick(e, 'top')}
          />
          
          {/* Bottom edge */}
          <div
            className="absolute cursor-pointer transition-colors duration-150"
            style={{
              bottom: 0,
              left: 0,
              width: squareSize,
              height: edgeThickness,
              backgroundColor: getEdgeColor('bottom'),
              zIndex: 2,
            }}
            onMouseEnter={() => setHoveredEdge('bottom')}
            onMouseLeave={() => setHoveredEdge(null)}
            onClick={() => handleEdgeClick('bottom')}
            onContextMenu={(e) => handleEdgeRightClick(e, 'bottom')}
          />
          
          {/* Left edge */}
          <div
            className="absolute cursor-pointer transition-colors duration-150"
            style={{
              top: edgeThickness,
              left: 0,
              width: edgeThickness,
              height: innerSize,
              backgroundColor: getEdgeColor('left'),
              zIndex: 1,
            }}
            onMouseEnter={() => setHoveredEdge('left')}
            onMouseLeave={() => setHoveredEdge(null)}
            onClick={() => handleEdgeClick('left')}
            onContextMenu={(e) => handleEdgeRightClick(e, 'left')}
          />
          
          {/* Right edge */}
          <div
            className="absolute cursor-pointer transition-colors duration-150"
            style={{
              top: edgeThickness,
              right: 0,
              width: edgeThickness,
              height: innerSize,
              backgroundColor: getEdgeColor('right'),
              zIndex: 1,
            }}
            onMouseEnter={() => setHoveredEdge('right')}
            onMouseLeave={() => setHoveredEdge(null)}
            onClick={() => handleEdgeClick('right')}
            onContextMenu={(e) => handleEdgeRightClick(e, 'right')}
          />
        </div>

        {/* Preset buttons - made smaller */}
        <div className="flex flex-col gap-1">
          <button
            onClick={handlePresetAll}
            onMouseEnter={() => setHoveredButton('all')}
            onMouseLeave={() => setHoveredButton(null)}
            className="px-2 py-1 text-[11px] font-medium rounded bg-neutral-700 hover:bg-neutral-600 text-gray-300 transition-colors"
            disabled={activeParameterSets.length === 0}
          >
            All
          </button>
          <button
            onClick={handlePresetX}
            onMouseEnter={() => setHoveredButton('x')}
            onMouseLeave={() => setHoveredButton(null)}
            className="px-2 py-1 text-[11px] font-medium rounded bg-neutral-700 hover:bg-neutral-600 text-gray-300 transition-colors"
            disabled={activeParameterSets.length === 0}
          >
            X
          </button>
          <button
            onClick={handlePresetY}
            onMouseEnter={() => setHoveredButton('y')}
            onMouseLeave={() => setHoveredButton(null)}
            className="px-2 py-1 text-[11px] font-medium rounded bg-neutral-700 hover:bg-neutral-600 text-gray-300 transition-colors"
            disabled={activeParameterSets.length === 0}
          >
            Y
          </button>
          <button
            onClick={handlePresetNone}
            onMouseEnter={() => setHoveredButton('none')}
            onMouseLeave={() => setHoveredButton(null)}
            className="px-2 py-1 text-[11px] font-medium rounded bg-neutral-700 hover:bg-neutral-600 text-gray-300 transition-colors"
          >
            None
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="absolute z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg p-2"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="flex gap-2 mb-2">
            {[0, 1, 2, 3].map((setIndex) => {
              const isActive = activeParameterSets.includes(setIndex);
              return (
                <button
                  key={setIndex}
                  onClick={() => {
                    if (isActive) {
                      onChange(contextMenu.edge, setIndex);
                      setContextMenu(null);
                    }
                  }}
                  disabled={!isActive}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    isActive 
                      ? 'hover:scale-110 cursor-pointer' 
                      : 'opacity-30 cursor-not-allowed'
                  }`}
                  style={{
                    backgroundColor: parameterColors[setIndex],
                    borderColor: isActive ? 'white' : 'gray'
                  }}
                />
              );
            })}
          </div>
          <button
            onClick={() => {
              onChange(contextMenu.edge, undefined);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1 text-xs font-medium rounded bg-neutral-700 hover:bg-neutral-600 text-gray-300 transition-colors"
          >
            Unset
          </button>
        </div>
      )}
    </div>
  );
};
