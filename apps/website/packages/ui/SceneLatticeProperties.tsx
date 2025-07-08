import React from "react";
import { useCanvasStore } from "../providers/CanvasStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useEditorStateStore } from "../providers/EditorStateStore";
import { MeepProject } from "../types/meepProjectTypes";
import { Sparkles, Eye, EyeOff, Grid3x3, Maximize2 } from "lucide-react";
import { LabeledVector } from "./MathVector";
import { detectLatticeType, LatticeType } from "../utils/latticeTypeChecker";
import { MaterialCatalog } from "../constants/meepMaterialPresets";
import { useMaterialColorStore } from "../providers/MaterialColorStore";
import { getWasmModule } from "../utils/wasmLoader";

interface Props {
  lattice: any;
  project: MeepProject;
  ghPages: boolean;
}

export default function SceneLatticeProperties({ lattice, project, ghPages }: Props) {
  const updateLattice = useCanvasStore((s) => s.updateLattice);
  const geometries = useCanvasStore((s) => s.geometries);
  const { updateProject } = useMeepProjects();
  const { lattices: fullLattices } = useMeepProjects();
  const { openLattice, setActiveLattice } = useEditorStateStore();
  
  const [localValues, setLocalValues] = React.useState({
    multiplier: lattice.multiplier || 3,
    tiedGeometryId: lattice.tiedGeometryId || '',
    showMode: lattice.showMode || 'points',
    fillMode: lattice.fillMode || 'manual', // New state: 'manual' or 'centerFill'
  });
  
  // Find linked full lattice
  const linkedLattice = React.useMemo(() => {
    if (!lattice.latticeDocumentId) return null;
    return fullLattices.find(l => l.documentId === lattice.latticeDocumentId);
  }, [lattice.latticeDocumentId, fullLattices]);
  
  React.useEffect(() => {
    setLocalValues({
      multiplier: lattice.multiplier || 3,
      tiedGeometryId: lattice.tiedGeometryId || '',
      showMode: lattice.showMode || 'points',
      fillMode: lattice.fillMode || 'manual',
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
  
  const handleOpenLattice = () => {
    if (linkedLattice) {
      openLattice(linkedLattice);
      setActiveLattice(linkedLattice.documentId);
    }
  };
  
  // Get available geometries for tying
  const availableGeometries = geometries.filter(g => 
    g.kind === 'cylinder' || g.kind === 'rectangle' || g.kind === 'triangle'
  );
  
  // Get the tied geometry
  const tiedGeometry = React.useMemo(() => {
    return geometries.find(g => g.id === localValues.tiedGeometryId);
  }, [geometries, localValues.tiedGeometryId]);
  
  // Toggle between showing geometry on lattice points vs just points
  const toggleShowMode = () => {
    const newMode = localValues.showMode === 'points' ? 'geometry' : 'points';
    handleChange('showMode', newMode);
  };
  
  // Detect lattice type
  const detectedLatticeType = React.useMemo(() => {
    try {
      const result = detectLatticeType(lattice.basis1, lattice.basis2);
      return result;
    } catch (error) {
      console.error('Error detecting lattice type:', error);
      return null;
    }
  }, [lattice.basis1, lattice.basis2]);
  
  // Get lattice type badge color
  const getLatticeTypeBadgeColor = (type: LatticeType) => {
    const colors: Record<LatticeType, string> = {
      [LatticeType.QUADRATIC]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      [LatticeType.RECTANGULAR]: 'bg-green-500/20 text-green-300 border-green-500/30',
      [LatticeType.TRIANGULAR]: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      [LatticeType.RHOMBIC]: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      [LatticeType.OBLIQUE]: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };
  
  const { getMaterialColor } = useMaterialColorStore();
  
  // Helper function to get material color
  const getMaterialColorForGeometry = React.useCallback((materialKey?: string): string => {
    if (!materialKey) {
      return "#808080"; // Default gray when no material
    }
    
    // Get custom color from store first
    const customColor = getMaterialColor(materialKey);
    if (customColor) {
      return customColor;
    }
    
    // Fall back to catalog color
    const material = MaterialCatalog[materialKey as keyof typeof MaterialCatalog];
    if (material && material.color) {
      return material.color;
    }
    
    // Fallback color
    return "#808080";
  }, [getMaterialColor]);
  
  // Get material abbreviation
  const getMaterialAbbreviation = (material: string) => {
    const abbreviations: Record<string, string> = {
      'Air': 'Air',
      'SiO2': 'SiO₂',
      'Si3N4': 'Si₃N₄',
      'Si': 'Si',
      'Al2O3': 'Al₂O₃',
      'GaAs': 'GaAs',
      'InP': 'InP',
      'GaN': 'GaN',
      'AlN': 'AlN',
      'Diamond': 'C',
      'Gold': 'Au',
      'Silver': 'Ag',
      'Copper': 'Cu',
      'Aluminum': 'Al',
      'Titanium': 'Ti',
      'Tungsten': 'W',
      'Chromium': 'Cr',
      'Nickel': 'Ni',
      'Platinum': 'Pt',
      'Palladium': 'Pd',
    };
    return abbreviations[material] || material.slice(0, 3);
  };
  
  /* ---------- DEBUG STATE -------------------------------------------------- */
  const [fillStats, setFillStats] = React.useState<{
    rectW: number;
    rectH: number;
    pointCount: number;
  } | null>(null);

  // ─────────── Centre & Fill ───────────────────────────────────────────────
  const handleCenterAndFill = async () => {
    try {
      const wasm = await getWasmModule();

      // logical scene size taken from the project (units = lattice units)
      const rectWidth  = project.scene?.rectWidth  ?? 1;
      const rectHeight = project.scene?.rectHeight ?? 1;

      // fetch points
      const points: any[] = wasm.calculate_rectangle_lattice_points(
        lattice.basis1.x, lattice.basis1.y,
        lattice.basis2.x, lattice.basis2.y,
        rectWidth, rectHeight
      );

      // centre of logical rectangle
      const centerX = rectWidth  * 0.5;
      const centerY = rectHeight * 0.5;

      updateLattice(lattice.id, {
        pos: { x: centerX, y: centerY },
        fillMode: "centerFill",
        calculatedPoints: points,
      });

      handleChange("fillMode", "centerFill");
      setFillStats({ rectW: rectWidth, rectH: rectHeight, pointCount: points.length });
    } catch (err) {
      console.error("Center&Fill failed:", err);
    }
  };

  const handleManualFill = () => {
    updateLattice(lattice.id, { fillMode: "manual", calculatedPoints: undefined });
    handleChange("fillMode", "manual");
    setFillStats(null);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">Lattice Properties</h3>
      </div>
      
      {/* Lattice Identity Card */}
      {linkedLattice && (
        <div 
          onClick={handleOpenLattice}
          className="bg-neutral-800 rounded p-3 cursor-pointer hover:bg-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-200">{linkedLattice.title}</div>
            {detectedLatticeType && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getLatticeTypeBadgeColor(detectedLatticeType.type)}`}>
                <span className="capitalize">{detectedLatticeType.type}</span>
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Fill Mode Controls */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Fill Mode</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleManualFill}
            className={`px-3 py-1.5 text-xs rounded flex items-center justify-center gap-1 transition-colors ${
              localValues.fillMode === 'manual'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
            }`}
          >
            <Grid3x3 size={14} />
            Manual Fill
          </button>
          <button
            onClick={handleCenterAndFill}
            className={`px-3 py-1.5 text-xs rounded flex items-center justify-center gap-1 transition-colors ${
              localValues.fillMode === 'centerFill'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
            }`}
          >
            <Maximize2 size={14} />
            Center & Fill
          </button>
        </div>
        {/* ── debug info ── */}
        {fillStats && (
          <div className="text-[10px] text-gray-500 pt-1">
            rect&nbsp;
            {fillStats.rectW.toFixed(2)} × {fillStats.rectH.toFixed(2)} –&nbsp;
            {fillStats.pointCount} pts
          </div>
        )}
      </div>
      
      {/* Compact Parameters */}
      <div className="space-y-2">
        {/* Multiplier - only show in manual mode */}
        {localValues.fillMode === 'manual' && (
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
        )}
        
        {/* Show info when in center fill mode */}
        {localValues.fillMode === 'centerFill' && (
          <div className="text-xs text-gray-400 italic">
            Lattice is centered and fills the canvas
          </div>
        )}
        
        {/* Basis Vectors and Origin - Single Row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-neutral-700/30 rounded px-2 py-1 flex items-center justify-center">
            <LabeledVector
              label="a₁"
              values={[lattice.basis1.x, lattice.basis1.y]}
              color="text-green-400"
              size="sm"
              format="decimal"
              decimalPlaces={2}
            />
          </div>
          <div className="bg-neutral-700/30 rounded px-2 py-1 flex items-center justify-center">
            <LabeledVector
              label="a₂"
              values={[lattice.basis2.x, lattice.basis2.y]}
              color="text-amber-400"
              size="sm"
              format="decimal"
              decimalPlaces={2}
            />
          </div>
          <div className="bg-neutral-700/30 rounded px-2 py-1 flex items-center justify-center">
            <LabeledVector
              label="O"
              values={[lattice.pos.x, lattice.pos.y]}
              color="text-gray-400"
              size="sm"
              format="decimal"
              decimalPlaces={2}
            />
          </div>
        </div>
      </div>
      
      {/* Linked Geometry Section */}
      <div className="space-y-2 pt-3 border-t border-gray-700">
        <h4 className="text-xs font-medium text-gray-300">Linked Geometry</h4>
        
        <div className="flex items-center gap-2">
          <select
            value={localValues.tiedGeometryId}
            onChange={(e) => handleChange('tiedGeometryId', e.target.value)}
            className="flex-1 px-2 py-1 text-xs bg-neutral-700 rounded focus:bg-neutral-600 outline-none"
          >
            <option value="">None</option>
            {availableGeometries.map(geom => {
              const color = getMaterialColorForGeometry(geom.material || 'Air');
              const abbrev = getMaterialAbbreviation(geom.material || 'Air');
              // Capitalize the geometry kind
              const capitalizedKind = geom.kind.charAt(0).toUpperCase() + geom.kind.slice(1);
              return (
                <option key={geom.id} value={geom.id}>
                  {capitalizedKind} • {geom.material || 'Air'}
                </option>
              );
            })}
          </select>
          
          {tiedGeometry && (
            <button
              onClick={toggleShowMode}
              className="p-1 hover:bg-neutral-700 rounded transition-colors"
              title={localValues.showMode === 'geometry' ? "Show points only" : "Show geometry on lattice points"}
            >
              {localValues.showMode === 'geometry' ? (
                <Eye size={14} className="text-blue-400" />
              ) : (
                <EyeOff size={14} className="text-gray-400" />
              )}
            </button>
          )}
        </div>
        
        {/* Custom dropdown rendering for geometry selection */}
        {tiedGeometry && (
          <div className="flex items-center justify-between text-xs text-gray-400">
            {/* Capitalized geometry kind with material icon */}
            <div className="flex items-center gap-2">
              <span className="capitalize">{tiedGeometry.kind}</span>
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full border border-gray-600"
                  style={{ backgroundColor: getMaterialColorForGeometry(tiedGeometry.material || 'Air') }}
                />
                <span>{tiedGeometry.material || 'Air'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom rendering for dropdown options */}
      <style jsx>{`
        select option {
          display: flex;
          justify-content: space-between;
        }
      `}</style>
    </div>
  );
}
