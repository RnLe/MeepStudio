import React, { useState, useMemo } from "react";
import { CanvasPMLBoundary, PMLDirection, PMLSide, PMLEdgeParameters } from "../../types/meepBoundaryTypes";
import { Dial } from "../components/Dial";
import { PMLEdgeSelector, type EdgeAssignment } from "../components/PMLEdgeSelector";
import { useCanvasStore } from "../../providers/CanvasStore";
import { RotateCcw } from "lucide-react";

interface PMLBoundaryPropertiesProps {
  boundary: CanvasPMLBoundary;
  onUpdate: (partial: Partial<CanvasPMLBoundary>) => void;
}

// Parameter set colors
const PARAM_SET_COLORS: Record<number, string> = {
  0: '#60a5fa',    // blue-400
  1: '#f97316',    // orange-500
  2: '#a855f7',    // purple-500
  3: '#eab308'     // yellow-500
};

const PARAM_SET_NAMES = ['Set A', 'Set B', 'Set C', 'Set D'];

export const PMLBoundaryProperties: React.FC<PMLBoundaryPropertiesProps> = ({ 
  boundary, 
  onUpdate 
}) => {
  // Initialize parameter sets if not present
  const parameterSets = boundary.parameterSets || {
    0: { 
      thickness: boundary.thickness || 1, 
      strength: boundary.strength || 1, 
      power: boundary.power || 2, 
      R_asymptotic: boundary.R_asymptotic || 1e-15,
      active: true 
    },
    1: { 
      thickness: 1, 
      strength: 1, 
      power: 2, 
      R_asymptotic: 1e-15,
      active: false 
    },
    2: { 
      thickness: 1, 
      strength: 1, 
      power: 2, 
      R_asymptotic: 1e-15,
      active: false 
    },
    3: { 
      thickness: 1, 
      strength: 1, 
      power: 2, 
      R_asymptotic: 1e-15,
      active: false 
    }
  };

  const edgeAssignments = boundary.edgeAssignments || {};

  // Get active parameter set indices
  const activeParameterSets = Object.keys(parameterSets)
    .map(k => parseInt(k))
    .filter(i => parameterSets[i]?.active);

  const handleParameterChange = (setIndex: number, param: keyof PMLEdgeParameters, value: number) => {
    onUpdate({
      parameterSets: {
        ...parameterSets,
        [setIndex]: {
          ...parameterSets[setIndex],
          [param]: value
        }
      }
    });
  };

  const toggleParameterSet = (setIndex: number) => {
    const newSets = {
      ...parameterSets,
      [setIndex]: {
        ...parameterSets[setIndex],
        active: !parameterSets[setIndex].active
      }
    };

    // If deactivating, remove any edge assignments using this set
    if (parameterSets[setIndex].active) {
      const newAssignments = { ...edgeAssignments };
      Object.keys(newAssignments).forEach(edge => {
        if (newAssignments[edge as keyof typeof newAssignments] === setIndex) {
          delete newAssignments[edge as keyof typeof newAssignments];
        }
      });
      onUpdate({
        parameterSets: newSets,
        edgeAssignments: newAssignments
      });
    } else {
      onUpdate({ parameterSets: newSets });
    }
  };

  const handleEdgeAssignment = (edge: 'top' | 'right' | 'bottom' | 'left', setIndex: number | undefined) => {
    const newAssignments = { ...edgeAssignments };
    if (setIndex === undefined) {
      delete newAssignments[edge];
    } else {
      newAssignments[edge] = setIndex;
    }
    onUpdate({ edgeAssignments: newAssignments });
  };

  const handleBulkEdgeAssignment = (newAssignments: EdgeAssignment) => {
    onUpdate({ edgeAssignments: newAssignments });
  };

  const handleResetParameterSets = () => {
    // Reset all parameter sets to defaults
    const defaultSets = {
      0: { 
        thickness: 1, 
        strength: 1, 
        power: 2, 
        R_asymptotic: 1e-15,
        active: true 
      },
      1: { 
        thickness: 1, 
        strength: 1, 
        power: 2, 
        R_asymptotic: 1e-15,
        active: false 
      },
      2: { 
        thickness: 1, 
        strength: 1, 
        power: 2, 
        R_asymptotic: 1e-15,
        active: false 
      },
      3: { 
        thickness: 1, 
        strength: 1, 
        power: 2, 
        R_asymptotic: 1e-15,
        active: false 
      }
    };
    
    // Reset edge assignments
    onUpdate({
      parameterSets: defaultSets,
      edgeAssignments: {}
    });
  };

  // Check if any parameter differs from default
  const hasNonDefaultParams = React.useMemo(() => {
    // Check if edge assignments exist
    if (Object.keys(edgeAssignments).length > 0) return true;
    
    // Check if any parameter set other than 0 is active
    if ([1, 2, 3].some(i => parameterSets[i]?.active)) return true;
    
    // Check if parameter set 0 has non-default values
    const set0 = parameterSets[0];
    if (set0) {
      return (
        set0.thickness !== 1 ||
        set0.strength !== 1 ||
        set0.power !== 2 ||
        set0.R_asymptotic !== 1e-15
      );
    }
    
    return false;
  }, [parameterSets, edgeAssignments]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-300">PML Boundary</h3>
      
      {/* Edge Selector - centered */}
      <div className="flex justify-center py-2">
        <PMLEdgeSelector 
          edgeAssignments={edgeAssignments}
          activeParameterSets={activeParameterSets}
          parameterColors={PARAM_SET_COLORS}
          onChange={handleEdgeAssignment}
          onBulkChange={handleBulkEdgeAssignment}
        />
      </div>

      {/* Parameter Sets */}
      <div className="bg-neutral-700/30 rounded-lg p-3 relative">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Parameter Sets</h4>
        
        {/* Reset button - only show when values differ from defaults */}
        {hasNonDefaultParams && (
          <button
            onClick={handleResetParameterSets}
            className="absolute top-3 right-3 p-1 rounded-full transition-colors group"
            title="Reset all parameter sets"
          >
            <RotateCcw size={12} className="text-gray-500 group-hover:text-white transition-colors" />
          </button>
        )}
        
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((setIndex) => (
            <div 
              key={setIndex}
              className="bg-neutral-800/50 rounded p-2 relative"
              style={{ 
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: parameterSets[setIndex]?.active ? PARAM_SET_COLORS[setIndex] : 'transparent',
                opacity: parameterSets[setIndex]?.active ? 1 : 0.5
              }}
            >
              <div className="flex justify-center mb-3">
                <button
                  onClick={() => toggleParameterSet(setIndex)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    parameterSets[setIndex]?.active 
                      ? 'bg-white border-white' 
                      : 'bg-transparent border-gray-500 hover:border-gray-300 hover:bg-gray-300/20'
                  }`}
                  style={{
                    backgroundColor: parameterSets[setIndex]?.active ? PARAM_SET_COLORS[setIndex] : undefined
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Dial
                    value={parameterSets[setIndex]?.thickness || 1}
                    onChange={(val) => handleParameterChange(setIndex, 'thickness', val)}
                    mode="linear"
                    min={0.1}
                    max={10}
                    step={0.1}
                    size={32}
                    label="Thick"
                    defaultValue={1}
                    disabled={!parameterSets[setIndex]?.active}
                  />
                </div>
                <div className="flex justify-center">
                  <Dial
                    value={parameterSets[setIndex]?.strength || 1}
                    onChange={(val) => handleParameterChange(setIndex, 'strength', val)}
                    mode="linear"
                    min={0.1}
                    max={10}
                    step={0.1}
                    size={32}
                    label="Str"
                    defaultValue={1}
                    disabled={!parameterSets[setIndex]?.active}
                  />
                </div>
                <div className="flex justify-center">
                  <Dial
                    value={parameterSets[setIndex]?.power || 2}
                    onChange={(val) => handleParameterChange(setIndex, 'power', val)}
                    mode="linear"
                    min={0.5}
                    max={8}
                    step={0.5}
                    size={32}
                    label="Pow"
                    defaultValue={2}
                    disabled={!parameterSets[setIndex]?.active}
                  />
                </div>
                <div className="flex justify-center">
                  <Dial
                    value={-Math.log10(parameterSets[setIndex]?.R_asymptotic || 1e-15)}
                    onChange={(val) => handleParameterChange(setIndex, 'R_asymptotic', Math.pow(10, -val))}
                    mode="linear"
                    min={3}
                    max={20}
                    step={0.1}
                    size={32}
                    label="R(-log)"
                    defaultValue={15}
                    disabled={!parameterSets[setIndex]?.active}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 bg-neutral-700/30 rounded p-2">
        <p className="mb-1">PML absorbs outgoing waves at simulation boundaries.</p>
        <p>• Activate parameter sets by clicking the circle button</p>
        <p>• Click edges to cycle through active parameter sets</p>
        <p>• Each edge can have different PML parameters</p>
        <p>• The system will generate proper Meep PML boundaries</p>
      </div>
    </div>
  );
};

