import React from "react";
import { useCanvasStore } from "../providers/CanvasStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { MeepProject } from "../types/meepProjectTypes";
import { Sparkles } from "lucide-react";

interface Props {
  lattice: any;
  project: MeepProject;
  ghPages: boolean;
}

export default function SceneLatticeProperties({ lattice, project, ghPages }: Props) {
  const updateLattice = useCanvasStore((s) => s.updateLattice);
  const geometries = useCanvasStore((s) => s.geometries);
  const { updateProject } = useMeepProjects({ ghPages });
  
  const [localValues, setLocalValues] = React.useState({
    multiplier: lattice.multiplier || 3,
    showMode: lattice.showMode || 'points',
    tiedGeometryId: lattice.tiedGeometryId || '',
  });
  
  React.useEffect(() => {
    setLocalValues({
      multiplier: lattice.multiplier || 3,
      showMode: lattice.showMode || 'points',
      tiedGeometryId: lattice.tiedGeometryId || '',
    });
  }, [lattice]);
  
  const handleChange = (field: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
    updateLattice(lattice.id, { [field]: value });
    
    // Update project
    const lattices = useCanvasStore.getState().lattices;
    updateProject({
      documentId: project.documentId,
      project: {
        scene: {
          ...project.scene,
          lattices,
        },
      },
    });
  };
  
  // Get available geometries for tying
  const availableGeometries = geometries.filter(g => 
    g.kind === 'cylinder' || g.kind === 'rectangle' || g.kind === 'triangle'
  );
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">Lattice Properties</h3>
      </div>
      
      <div className="space-y-2">
        {/* Multiplier */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400">Multiplier</label>
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={localValues.multiplier}
            onChange={(e) => handleChange('multiplier', parseInt(e.target.value) || 3)}
            className="w-16 px-2 py-1 text-xs bg-neutral-700 rounded focus:bg-neutral-600 outline-none"
          />
        </div>
        
        {/* Show Mode */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400">Display Mode</label>
          <select
            value={localValues.showMode}
            onChange={(e) => handleChange('showMode', e.target.value)}
            className="px-2 py-1 text-xs bg-neutral-700 rounded focus:bg-neutral-600 outline-none"
          >
            <option value="points">Points</option>
            <option value="geometry">Geometry</option>
          </select>
        </div>
        
        {/* Tied Geometry (only show when in geometry mode) */}
        {localValues.showMode === 'geometry' && (
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Tied Geometry</label>
            <select
              value={localValues.tiedGeometryId}
              onChange={(e) => handleChange('tiedGeometryId', e.target.value)}
              className="px-2 py-1 text-xs bg-neutral-700 rounded focus:bg-neutral-600 outline-none max-w-[120px]"
            >
              <option value="">None</option>
              {availableGeometries.map(geom => (
                <option key={geom.id} value={geom.id}>
                  {geom.kind} ({geom.id.slice(0, 6)})
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Basis Vectors Display */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-500 mb-2">Basis Vectors</div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">a₁:</span>
              <span className="text-gray-300">
                ({lattice.basis1.x.toFixed(2)}, {lattice.basis1.y.toFixed(2)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">a₂:</span>
              <span className="text-gray-300">
                ({lattice.basis2.x.toFixed(2)}, {lattice.basis2.y.toFixed(2)})
              </span>
            </div>
          </div>
        </div>
        
        {/* Position */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-500 mb-2">Position</div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Origin:</span>
            <span className="text-xs text-gray-300 font-mono">
              ({lattice.pos.x.toFixed(2)}, {lattice.pos.y.toFixed(2)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
