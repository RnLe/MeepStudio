import React, { useState, useMemo } from "react";
import { CanvasPMLBoundary, PMLDirection, PMLSide, PMLEdgeParameters } from "../../types/meepBoundaryTypes";
import { Dial } from "../components/Dial";
import { PMLEdgeSelector, type EdgeAssignment } from "../components/PMLEdgeSelector";
import { useCanvasStore } from "../../providers/CanvasStore";
import { RotateCcw } from "lucide-react";
import { 
  PML_PARAMETER_SETS_DEFAULTS,
  hasNonDefaultParameterSets,
  hasNonDefaultEdgeAssignments
} from "../../constants/boundaryDefaults";

interface PMLBoundaryPropertiesProps {
  boundary: CanvasPMLBoundary;
  onUpdate: (partial: Partial<CanvasPMLBoundary>) => void;
}

// Parameter set colors
const PARAM_SET_COLORS: Record<number, string> = {
  0: '#1e2939',    // dark blue-gray
  1: '#392e1e',    // dark brown
  2: '#211e39',    // dark purple
  3: '#36391e'     // dark olive
};

const PARAM_SET_NAMES = ['Set A', 'Set B', 'Set C', 'Set D'];

export const PMLBoundaryProperties: React.FC<PMLBoundaryPropertiesProps> = ({ 
  boundary, 
  onUpdate 
}) => {
  // Initialize parameter sets from boundary or use defaults
  const parameterSets = boundary.parameterSets || PML_PARAMETER_SETS_DEFAULTS;
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
    onUpdate({
      parameterSets: PML_PARAMETER_SETS_DEFAULTS,
      edgeAssignments: {}
    });
  };

  // Check if any parameter differs from default
  const hasNonDefaultParams = React.useMemo(() => {
    // Check if edge assignments exist
    if (hasNonDefaultEdgeAssignments(edgeAssignments)) return true;
    
    // Check parameter sets
    return hasNonDefaultParameterSets(parameterSets);
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
                    label="Thickness"
                    defaultValue={1}
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

