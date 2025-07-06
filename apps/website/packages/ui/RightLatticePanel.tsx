import React from "react";
import ReactDOM from "react-dom";
import { Lattice } from "../types/meepLatticeTypes";
import { useMeepProjects } from "../hooks/useMeepProjects";
import LatticeVectorDisplay from "./LatticeVectorDisplay";
import { MathVector, LabeledVector } from "./MathVector";
import { useLatticeStore } from "../providers/LatticeStore";
import CustomLucideIcon from "./CustomLucideIcon";
import { TransformationTooltip, TooltipWrapper } from "./TransformationTooltip";
import { Code2, Layers, Download, LucideIcon, ArrowRight } from "lucide-react";
import { useEditorStateStore } from "../providers/EditorStateStore";
import { detectLatticeType, getLatticeDescription, LatticeType } from "../utils/latticeTypeChecker";
import { getWasmModule } from "../utils/wasmLoader";
import { Vector3 } from "packages/types/meepBaseTypes";
import { 
  getSymmetryPointsForLattice, 
  getSymmetryPathsForLattice 
} from "../utils/latticeDefaults";

interface Props {
  lattice: Lattice;
  ghPages: boolean;
  onCancel?: () => void;
}

const RightLatticePanel: React.FC<Props> = ({ lattice, ghPages, onCancel }) => {
  const { updateLattice } = useMeepProjects();
  
  const { 
    isEditingLattice: editing,
    setIsEditingLattice: setEditing
  } = useEditorStateStore();
  
  // Add lattice store hooks
  const setCurrentBasisVectors = useLatticeStore((s) => s.setCurrentBasisVectors);
  const setCurrentLatticeType = useLatticeStore((s) => s.setCurrentLatticeType);
  const triggerCanvasUpdate = useLatticeStore((s) => s.triggerCanvasUpdate);
  const updateCanvasLatticesInProjects = useLatticeStore((s) => s.updateCanvasLatticesInProjects);
  
  // Add dropdown state
  const [showTypeDropdown, setShowTypeDropdown] = React.useState(false);
  const [hoveredType, setHoveredType] = React.useState<LatticeType | null>(null);
  const [previewData, setPreviewData] = React.useState<{
    vectors: { basis1: Vector3; basis2: Vector3 } | null;
    reciprocalVectors: { basis1: Vector3; basis2: Vector3 } | null;
    parameters: { a: number; b: number; alpha: number } | null;
    reciprocalParams: { c: number; d: number; beta: number } | null;
  }>({
    vectors: null,
    reciprocalVectors: null,
    parameters: null,
    reciprocalParams: null
  });
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = React.useState<'left' | 'right'>('right');
  
  // Add edit values state
  const [editValues, setEditValues] = React.useState({
    title: lattice?.title || ""
  });
  
  // Update edit values when lattice changes
  React.useEffect(() => {
    setEditValues({
      title: lattice?.title || ""
    });
  }, [lattice]);
  
  // Handle cancel
  const handleCancel = () => {
    setEditing(false);
    setEditValues({
      title: lattice?.title || ""
    });
    onCancel?.();
  };
  
  // Handle save
  const handleSave = async () => {
    setEditing(false);
    if (lattice) {
      const updated = {
        ...lattice,
        title: editValues.title
      };
      await updateLattice({
        documentId: lattice.documentId,
        lattice: updated
      });
      // Lattice updated automatically through Zustand store
    }
  };
  
  // Listen for save event from sidebar
  React.useEffect(() => {
    const handleSaveEvent = () => {
      if (editing) {
        handleSave();
      }
    };
    
    window.addEventListener('rightSidebarSave', handleSaveEvent);
    return () => window.removeEventListener('rightSidebarSave', handleSaveEvent);
  }, [editing, editValues, lattice]);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };
  
  // Get lattice point cache for statistics
  const latticePointCache = useLatticeStore((s) => s.latticePointCache);
  
  // Get zone counts from store
  const realSpaceZoneCount = useLatticeStore((s) => s.realSpaceZoneCount);
  const setRealSpaceZoneCount = useLatticeStore((s) => s.setRealSpaceZoneCount);
  const reciprocalSpaceZoneCount = useLatticeStore((s) => s.reciprocalSpaceZoneCount);
  const setReciprocalSpaceZoneCount = useLatticeStore((s) => s.setReciprocalSpaceZoneCount);
  
  const displaySettings = lattice.displaySettings || {
    showWignerSeitz: false,
    showBrillouinZone: false,
    showHighSymmetryPoints: false,
    showReciprocal: false,
  };
  
  const handleToggle = async (setting: keyof typeof displaySettings) => {
    await updateLattice({
      documentId: lattice.documentId,
      lattice: {
        ...lattice,
        displaySettings: {
          ...displaySettings,
          [setting]: !displaySettings[setting]
        }
      }
    });
  };
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    
    if (showTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTypeDropdown]);
  
  // Get base vectors for a specific lattice type
  const getBaseVectorsForType = React.useCallback((type: LatticeType) => {
    const basisSize = lattice.meepLattice?.basis_size || { x: 1, y: 1, z: 1 };
    
    switch (type) {
      case LatticeType.QUADRATIC:
        return {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0, y: 1, z: 0 }
        };
      case LatticeType.RECTANGULAR:
        return {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0, y: 0.5, z: 0 }
        };
      case LatticeType.TRIANGULAR:
        return {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0.5, y: Math.sqrt(3)/2, z: 0 }
        };
      case LatticeType.RHOMBIC:
        return {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0.5, y: 0.866, z: 0 } // 60° angle
        };
      case LatticeType.OBLIQUE:
        return {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0.3, y: 0.8, z: 0 } // arbitrary oblique
        };
      default:
        return null;
    }
  }, [lattice.meepLattice?.basis_size]);
  
  // Handle lattice type change
  const handleLatticeTypeChange = async (newType: LatticeType) => {
    console.log('🔄 Starting lattice type change:', {
      from: detectedLatticeType?.type,
      to: newType,
      latticeId: lattice.documentId
    });
    
    setShowTypeDropdown(false);
    
    const newVectors = getBaseVectorsForType(newType);
    if (!newVectors || !lattice.meepLattice) return;
    
    console.log('📐 New vectors for type', newType, ':', newVectors);
    
    const basisSize = lattice.meepLattice.basis_size;
    
    // Clear cached data in store before updating
    useLatticeStore.setState({
      voronoiData: null,
      latticePointCache: null,
      transformationMatrices: null
    });
    
    // Update the lattice store immediately with new vectors
    setCurrentBasisVectors(
      { x: newVectors.basis1.x, y: newVectors.basis1.y },
      { x: newVectors.basis2.x, y: newVectors.basis2.y }
    );
    setCurrentLatticeType(latticeEnumToString(newType));
    
    console.log('🏪 Updated store with:', {
      basis1: { x: newVectors.basis1.x, y: newVectors.basis1.y },
      basis2: { x: newVectors.basis2.x, y: newVectors.basis2.y },
      type: latticeEnumToString(newType)
    });
    
    // Create updated lattice with new basis vectors
    const updatedMeepLattice = {
      ...lattice.meepLattice,
      basis1: newVectors.basis1,
      basis2: newVectors.basis2,
    };
    
    // Calculate reciprocal basis vectors
    try {
      const wasm = await getWasmModule();
      
      // Get scaled basis vectors
      const a1 = {
        x: newVectors.basis1.x * basisSize.x,
        y: newVectors.basis1.y * basisSize.y,
        z: newVectors.basis1.z * basisSize.z
      };
      const a2 = {
        x: newVectors.basis2.x * basisSize.x,
        y: newVectors.basis2.y * basisSize.y,
        z: newVectors.basis2.z * basisSize.z
      };
      
      // Calculate reciprocal basis
      const det = a1.x * a2.y - a1.y * a2.x;
      if (Math.abs(det) < 1e-14) {
        throw new Error("Basis vectors are collinear");
      }
      
      const factor = 2 * Math.PI / det;
      updatedMeepLattice.reciprocal_basis1 = { 
        x: a2.y * factor, 
        y: -a2.x * factor,
        z: 0 
      };
      updatedMeepLattice.reciprocal_basis2 = { 
        x: -a1.y * factor, 
        y: a1.x * factor,
        z: 0 
      };
      
      // Calculate transformation matrices if available
      if (wasm.calculate_lattice_transformations) {
        const matrices = wasm.calculate_lattice_transformations(
          a1.x, a1.y,
          a2.x, a2.y,
          updatedMeepLattice.reciprocal_basis1.x, updatedMeepLattice.reciprocal_basis1.y,
          updatedMeepLattice.reciprocal_basis2.x, updatedMeepLattice.reciprocal_basis2.y
        );
        
        // Expand 2x2 matrices to 3x3
        const expandMatrix = (m: any): number[][] => {
          if (!m || !Array.isArray(m)) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
          return [
            [m[0][0], m[0][1], 0],
            [m[1][0], m[1][1], 0],
            [0, 0, 1]
          ];
        };
        
        updatedMeepLattice.transformationMatrices = {
          MA: expandMatrix(matrices.MA),
          MA_inv: expandMatrix(matrices.MA_inv),
          MB: expandMatrix(matrices.MB),
          MB_inv: expandMatrix(matrices.MB_inv),
          realToReciprocal: expandMatrix(matrices.realToReciprocal),
          reciprocalToReal: expandMatrix(matrices.reciprocalToReal)
        };
      }
    } catch (error) {
      console.error("Failed to calculate reciprocal lattice:", error);
    }
    
    // Update lattice parameters based on new vectors
    const params = {
      a: Math.sqrt(newVectors.basis1.x * newVectors.basis1.x + newVectors.basis1.y * newVectors.basis1.y),
      b: Math.sqrt(newVectors.basis2.x * newVectors.basis2.x + newVectors.basis2.y * newVectors.basis2.y),
      alpha: Math.acos(
        (newVectors.basis1.x * newVectors.basis2.x + newVectors.basis1.y * newVectors.basis2.y) /
        (Math.sqrt(newVectors.basis1.x * newVectors.basis1.x + newVectors.basis1.y * newVectors.basis1.y) *
         Math.sqrt(newVectors.basis2.x * newVectors.basis2.x + newVectors.basis2.y * newVectors.basis2.y))
      ) * 180 / Math.PI
    };
    
    // Update the lattice with proper latticeType
    console.log('📤 Calling updateLattice with:', {
      documentId: lattice.documentId,
      latticeType: latticeEnumToString(newType),
      basis1: newVectors.basis1,
      basis2: newVectors.basis2
    });
    
    const updateResult = await updateLattice({
      documentId: lattice.documentId,
      lattice: {
        ...lattice,
        latticeType: latticeEnumToString(newType),
        meepLattice: updatedMeepLattice,
        parameters: { a: params.a, b: params.b, alpha: params.alpha },
      },
    });
    
    console.log('✅ updateLattice result:', updateResult);
    
    // Store update propagates automatically via Zustand
    
    // Trigger canvas update
    triggerCanvasUpdate();
    console.log('🎨 Triggered canvas update');
  };
  
  // Calculate real space parameters
  const calculateRealSpaceParams = () => {
    if (!lattice.meepLattice) {
      return { a: 0, b: 0, alpha: 0 };
    }
    
    const a1 = lattice.meepLattice.basis1;
    const a2 = lattice.meepLattice.basis2;
    
    // Calculate lengths
    const a = Math.sqrt(a1.x * a1.x + a1.y * a1.y);
    const b = Math.sqrt(a2.x * a2.x + a2.y * a2.y);
    
    // Calculate angle between a1 and a2
    const dot = a1.x * a2.x + a1.y * a2.y;
    const cosAlpha = dot / (a * b);
    const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha))) * 180 / Math.PI;
    
    return { a, b, alpha };
  };
  
  // Calculate reciprocal space parameters
  const calculateReciprocalParams = () => {
    if (!lattice.meepLattice?.reciprocal_basis1 || !lattice.meepLattice?.reciprocal_basis2) {
      return { c: 0, d: 0, beta: 0 };
    }
    
    const b1 = lattice.meepLattice.reciprocal_basis1;
    const b2 = lattice.meepLattice.reciprocal_basis2;
    
    // Calculate lengths
    const c = Math.sqrt(b1.x * b1.x + b1.y * b1.y);
    const d = Math.sqrt(b2.x * b2.x + b2.y * b2.y);
    
    // Calculate angle between b1 and b2
    const dot = b1.x * b2.x + b1.y * b2.y;
    const cosBeta = dot / (c * d);
    const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta))) * 180 / Math.PI;
    
    return { c, d, beta };
  };
  
  const realSpaceParams = calculateRealSpaceParams();
  const reciprocalParams = calculateReciprocalParams();
  
  // Use calculated values if not provided
  const displayParams = hoveredType && previewData.parameters
    ? previewData.parameters
    : {
        a: lattice.parameters.a ?? realSpaceParams.a,
        b: lattice.parameters.b ?? realSpaceParams.b,
        alpha: lattice.parameters.alpha ?? realSpaceParams.alpha
      };
  
  const displayReciprocalParams = hoveredType && previewData.reciprocalParams
    ? previewData.reciprocalParams
    : reciprocalParams;
  
  // Get transformation matrices from store
  const transformationMatrices = useLatticeStore((s) => s.transformationMatrices);
  
  // Calculate transformation matrices
  const getTransformationMatrices = () => {
    if (transformationMatrices) {
      // Ensure matrices are properly formatted as 3D arrays
      const formatMatrix = (m: any): number[][] => {
        if (!m || !Array.isArray(m)) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        // If it's a 2x2 matrix, expand to 3x3
        if (m.length === 2 && m[0].length === 2) {
          return [
            [m[0][0], m[0][1], 0],
            [m[1][0], m[1][1], 0],
            [0, 0, 1]
          ];
        }
        return m;
      };
      
      return {
        MA: formatMatrix(transformationMatrices.MA),
        MB: formatMatrix(transformationMatrices.MB),
        TAB: formatMatrix(transformationMatrices.realToReciprocal),
        TBA: formatMatrix(transformationMatrices.reciprocalToReal)
      };
    }
    // Fallback to identity matrices if not calculated yet
    const identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    return { MA: identity, MB: identity, TAB: identity, TBA: identity };
  };
  
  const { MA, MB, TAB, TBA } = getTransformationMatrices();
  
  // Define action buttons
  const actionButtons = [
    {
      label: "Code Editor",
      icon: Code2,
      onClick: () => {
        // TODO: Implement code editor functionality
      }
    },
    {
      label: "Add to Scene",
      icon: Layers,
      onClick: () => {
        // TODO: Implement add to scene functionality
      }
    },
    {
      label: "Export",
      icon: Download,
      onClick: () => {
        // TODO: Implement export functionality
      }
    }
  ];

  // Detect lattice type
  const detectedLatticeType = React.useMemo(() => {
    if (!lattice.meepLattice) return null;
    
    try {
      const result = detectLatticeType(
        lattice.meepLattice.basis1,
        lattice.meepLattice.basis2
      );
      return result;
    } catch (error) {
      console.error('Error detecting lattice type:', error);
      return null;
    }
  }, [lattice.meepLattice]);
  
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
  
  // Get lattice type conditions
  const getLatticeConditions = (type: LatticeType) => {
    const conditions: Record<LatticeType, string> = {
      [LatticeType.QUADRATIC]: 'a = b, α = 90°',
      [LatticeType.RECTANGULAR]: 'a ≠ b, α = 90°',
      [LatticeType.TRIANGULAR]: 'a = b, α = 60° or 120°',
      [LatticeType.RHOMBIC]: 'a = b, α ≠ 90°',
      [LatticeType.OBLIQUE]: 'a ≠ b, α ≠ 90°',
    };
    return conditions[type] || '';
  };

  // Add state for dropdown button position
  const [dropdownButtonRect, setDropdownButtonRect] = React.useState<DOMRect | null>(null);
  const dropdownButtonRef = React.useRef<HTMLDivElement>(null);
  
  // Update button position when dropdown opens
  React.useEffect(() => {
    if (showTypeDropdown && dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      setDropdownButtonRect(rect);
      
      // Determine dropdown position based on available space
      const viewportWidth = window.innerWidth;
      const dropdownWidth = Object.values(LatticeType).length * 100;
      
      if (rect.left + dropdownWidth > viewportWidth - 20) {
        setDropdownPosition('left');
      } else {
        setDropdownPosition('right');
      }
    }
  }, [showTypeDropdown]);
  
  // Render dropdown using portal
  const renderDropdown = () => {
    if (!showTypeDropdown || !dropdownButtonRect || !detectedLatticeType) return null;
    
    // Calculate dropdown position - attach to left side of button and center vertically
    const dropdownStyle: React.CSSProperties = {
      position: 'fixed',
      top: dropdownButtonRect.top + (dropdownButtonRect.height / 2), // Center of button
      right: window.innerWidth - dropdownButtonRect.left + 4, // 4px gap from button
      transform: 'translateY(-50%)', // Center the dropdown vertically
      zIndex: 9999,
    };
    
    return ReactDOM.createPortal(
      <div 
        ref={dropdownRef}
        style={dropdownStyle}
        className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden"
      >
        <div className="flex flex-row">
          {Object.values(LatticeType)
            .filter(type => type !== detectedLatticeType.type)
            .map((type) => (
              <div
                key={type}
                className="relative group"
                onMouseEnter={() => {
                  setHoveredType(type);
                  calculatePreviewData(type);
                }}
                onMouseLeave={() => {
                  setHoveredType(null);
                  calculatePreviewData(null);
                }}
                onClick={() => handleLatticeTypeChange(type)}
              >
                <div className={`px-3 py-2 cursor-pointer hover:bg-neutral-700 transition-colors border-r border-neutral-700 last:border-r-0`}>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getLatticeTypeBadgeColor(type)}`}>
                    <span className="capitalize">{type}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>,
      document.body
    );
  };
  
  // quick 2-D reciprocal (no WASM, just cross-product)
  const getReciprocal2D = (a1: Vector3, a2: Vector3) => {
    const det = a1.x * a2.y - a1.y * a2.x;
    if (Math.abs(det) < 1e-14) return null;
    const f = 2 * Math.PI / det;
    return {
      b1: { x:  a2.y * f, y: -a2.x * f, z: 0 },
      b2: { x: -a1.y * f, y:  a1.x * f, z: 0 }
    };
  };
  
  // --- preview calculation -----------------------------------------------------
  const calculatePreviewData = React.useCallback((type: LatticeType | null) => {
    if (!type) {
      setPreviewData({ vectors: null, reciprocalVectors: null, parameters: null, reciprocalParams: null });
      return;
    }

    const newVectors = getBaseVectorsForType(type);
    if (!newVectors) {
      setPreviewData({ vectors: null, reciprocalVectors: null, parameters: null, reciprocalParams: null });
      return;
    }

    // real-space parameters
    const lenA = Math.hypot(newVectors.basis1.x, newVectors.basis1.y);
    const lenB = Math.hypot(newVectors.basis2.x, newVectors.basis2.y);
    const dot  = newVectors.basis1.x * newVectors.basis2.x + newVectors.basis1.y * newVectors.basis2.y;
    const alpha = Math.acos(Math.max(-1, Math.min(1, dot / (lenA * lenB)))) * 180 / Math.PI;

    // reciprocal
    const recip = getReciprocal2D(newVectors.basis1, newVectors.basis2);
    const reciprocalVectors = recip ? { basis1: recip.b1, basis2: recip.b2 } : null;

    let reciprocalParams = null;
    if (reciprocalVectors && recip) {
      const c  = Math.hypot(recip.b1.x, recip.b1.y);
      const d  = Math.hypot(recip.b2.x, recip.b2.y);
      const dp = recip.b1.x * recip.b2.x + recip.b1.y * recip.b2.y;
      const beta = Math.acos(Math.max(-1, Math.min(1, dp / (c * d)))) * 180 / Math.PI;
      reciprocalParams = { c, d, beta };
    }

    setPreviewData({
      vectors: newVectors,
      reciprocalVectors,
      parameters: { a: lenA, b: lenB, alpha },
      reciprocalParams
    });
  }, [getBaseVectorsForType]);
  // -----------------------------------------------------------------------------
  
  // also when dropdown closes reset preview
  React.useEffect(() => {
    if (!showTypeDropdown) {
      setHoveredType(null);
      setPreviewData({ vectors: null, reciprocalVectors: null, parameters: null, reciprocalParams: null });
    }
  }, [showTypeDropdown]);
  
  // Sync lattice changes to store when lattice prop changes
  React.useEffect(() => {
    if (lattice?.meepLattice) {
      setCurrentBasisVectors(
        { x: lattice.meepLattice.basis1.x, y: lattice.meepLattice.basis1.y },
        { x: lattice.meepLattice.basis2.x, y: lattice.meepLattice.basis2.y }
      );
      setCurrentLatticeType(lattice.latticeType || 'square');
    }
  }, [lattice, setCurrentBasisVectors, setCurrentLatticeType]);
  
  // Convert lattice enum to string literal
  const latticeEnumToString = (t: LatticeType): Lattice['latticeType'] => {
    switch (t) {
      case LatticeType.QUADRATIC:   return 'square';
      case LatticeType.RECTANGULAR: return 'rectangular';
      case LatticeType.TRIANGULAR:  return 'hexagonal';
      case LatticeType.RHOMBIC:     return 'rhombic';
      case LatticeType.OBLIQUE:     return 'oblique';
      default:                      return 'custom';
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Title and description */}
      <div className="p-4 pb-0">
        {editing ? (
          <input
            className="not-prose text-xl font-semibold text-white text-center rounded px-1 py-0.5 focus:bg-neutral-600 bg-neutral-700 transition-colors outline-none w-full"
            name="title"
            value={editValues.title}
            minLength={1}
            maxLength={128}
            required
            onChange={handleChange}
          />
        ) : (
          <h2 className="text-xl font-semibold text-white text-center">{lattice.title}</h2>
        )}
        {lattice.description && (
          <p className="text-sm text-gray-400 text-center mt-1">{lattice.description}</p>
        )}
        
        {/* Lattice Type and Conditions - Horizontal Layout */}
        {detectedLatticeType && (
          <div className="mt-3 flex items-center justify-between px-2 relative">
            <div 
              ref={dropdownButtonRef}
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all ${getLatticeTypeBadgeColor(detectedLatticeType.type)} hover:opacity-80`}
            >
              <span className="capitalize">{detectedLatticeType.type}</span>
              {detectedLatticeType.confidence < 0.99 && (
                <span className="ml-1 opacity-70">({Math.round(detectedLatticeType.confidence * 100)}%)</span>
              )}
            </div>
            
            <p className="text-xs text-gray-400">
              {getLatticeConditions(hoveredType || detectedLatticeType.type)}
            </p>
          </div>
        )}
      </div>
      
      {/* Dual Vector Display - Side by Side */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-2">
          {/* Real Space Vector Display */}
          <div>
            <h4 className="text-xs font-medium text-gray-300 mb-1 text-center">Real Space</h4>
            <LatticeVectorDisplay 
              latticeType={lattice.latticeType || 'square'}
              customVectors={
                hoveredType && previewData.vectors
                  ? previewData.vectors
                  : lattice.meepLattice
                  ? {
                      basis1: lattice.meepLattice.basis1,
                      basis2: lattice.meepLattice.basis2
                    }
                  : undefined
              }
              realSpaceMode={true}
              showConditions={false}
            />
          </div>
          
          {/* k-Space Vector Display */}
          <div>
            <h4 className="text-xs font-medium text-gray-300 mb-1 text-center">k-Space</h4>
            <LatticeVectorDisplay 
              latticeType={lattice.latticeType || 'square'}
              customVectors={
                hoveredType && previewData.reciprocalVectors
                  ? previewData.reciprocalVectors
                  : lattice.meepLattice?.reciprocal_basis1 && lattice.meepLattice?.reciprocal_basis2
                  ? {
                      basis1: lattice.meepLattice.reciprocal_basis1,
                      basis2: lattice.meepLattice.reciprocal_basis2
                    }
                  : undefined
              }
              customAngle={displayReciprocalParams.beta}
              realSpaceMode={false}
              showConditions={false}
            />
          </div>
        </div>
      </div>
      
      {/* Combined Parameters and Vectors Section */}
      <div className="p-4">
        {/* Real Space Section */}
        <h3 className="text-sm font-medium text-gray-300 mb-2 text-center">Real Space</h3>
        
        {/* Real Space Parameters - 3 in a row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className={`flex items-center justify-between bg-neutral-700/30 rounded px-2 py-1 ${
            hoveredType ? 'ring-1 ring-blue-500/50' : ''
          }`}>
            <span className="text-xs text-gray-400">a</span>
            <span className="text-xs text-gray-200 font-mono">{displayParams.a.toFixed(3)}</span>
          </div>
          <div className={`flex items-center justify-between bg-neutral-700/30 rounded px-2 py-1 ${
            hoveredType ? 'ring-1 ring-blue-500/50' : ''
          }`}>
            <span className="text-xs text-gray-400">b</span>
            <span className="text-xs text-gray-200 font-mono">{displayParams.b.toFixed(3)}</span>
          </div>
          <div className={`flex items-center justify-between bg-neutral-700/30 rounded px-2 py-1 ${
            hoveredType ? 'ring-1 ring-blue-500/50' : ''
          }`}>
            <span className="text-xs text-gray-400">α</span>
            <span className="text-xs text-gray-200 font-mono">{displayParams.alpha.toFixed(1)}°</span>
          </div>
        </div>
        
        {/* Real Space Vectors */}
        {(hoveredType ? previewData.vectors : lattice.meepLattice) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className={`bg-neutral-700/30 rounded px-2 py-1 flex items-center justify-center ${
              hoveredType ? 'ring-1 ring-blue-500/50' : ''
            }`}>
              <LabeledVector
                label="a₁"
                values={
                  hoveredType && previewData.vectors
                    ? [
                        previewData.vectors.basis1.x * lattice.meepLattice!.basis_size.x,
                        previewData.vectors.basis1.y * lattice.meepLattice!.basis_size.y
                      ]
                    : [
                        lattice.meepLattice!.basis1.x * lattice.meepLattice!.basis_size.x,
                        lattice.meepLattice!.basis1.y * lattice.meepLattice!.basis_size.y
                      ]
                }
                color="text-green-400"
                size="sm"
              />
            </div>
            <div className={`bg-neutral-700/30 rounded px-2 py-1 flex items-center justify-center ${
              hoveredType ? 'ring-1 ring-blue-500/50' : ''
            }`}>
              <LabeledVector
                label="a₂"
                values={
                  hoveredType && previewData.vectors
                    ? [
                        previewData.vectors.basis2.x * lattice.meepLattice!.basis_size.x,
                        previewData.vectors.basis2.y * lattice.meepLattice!.basis_size.y
                      ]
                    : [
                        lattice.meepLattice!.basis2.x * lattice.meepLattice!.basis_size.x,
                        lattice.meepLattice!.basis2.y * lattice.meepLattice!.basis_size.y
                      ]
                }
                color="text-amber-400"
                size="sm"
              />
            </div>
          </div>
        )}
        
        {/* k-Space Section */}
        <h3 className="text-sm font-medium text-gray-300 mb-2 text-center">k-Space</h3>
        
        {/* k-Space Parameters - 3 in a row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className={`flex items-center justify-between bg-neutral-700/30 rounded px-2 py-1 ${
            hoveredType ? 'ring-1 ring-blue-500/50' : ''
          }`}>
            <span className="text-xs text-gray-400">c</span>
            <span className="text-xs text-gray-200 font-mono">{displayReciprocalParams.c.toFixed(3)}</span>
          </div>
          <div className={`flex items-center justify-between bg-neutral-700/30 rounded px-2 py-1 ${
            hoveredType ? 'ring-1 ring-blue-500/50' : ''
          }`}>
            <span className="text-xs text-gray-400">d</span>
            <span className="text-xs text-gray-200 font-mono">{displayReciprocalParams.d.toFixed(3)}</span>
          </div>
          <div className={`flex items-center justify-between bg-neutral-700/30 rounded px-2 py-1 ${
            hoveredType ? 'ring-1 ring-blue-500/50' : ''
          }`}>
            <span className="text-xs text-gray-400">β</span>
            <span className="text-xs text-gray-200 font-mono">{displayReciprocalParams.beta.toFixed(1)}°</span>
          </div>
        </div>
        
        {/* k-Space Vectors */}
        {(hoveredType ? previewData.reciprocalVectors : (lattice.meepLattice?.reciprocal_basis1 && lattice.meepLattice?.reciprocal_basis2)) && (
          <div className="grid grid-cols-2 gap-2">
            <div className={`bg-neutral-700/30 rounded px-2 py-1 flex items-center justify-center ${
              hoveredType ? 'ring-1 ring-blue-500/50' : ''
            }`}>
              <LabeledVector
                label="b₁"
                values={
                  hoveredType && previewData.reciprocalVectors
                    ? [previewData.reciprocalVectors.basis1.x, previewData.reciprocalVectors.basis1.y]
                    : [lattice.meepLattice!.reciprocal_basis1!.x, lattice.meepLattice!.reciprocal_basis1!.y]
                }
                color="text-blue-400"
                size="sm"
              />
            </div>
            <div className={`bg-neutral-700/30 rounded px-2 py-1 flex items-center justify-center ${
              hoveredType ? 'ring-1 ring-blue-500/50' : ''
            }`}>
              <LabeledVector
                label="b₂"
                values={
                  hoveredType && previewData.reciprocalVectors
                    ? [previewData.reciprocalVectors.basis2.x, previewData.reciprocalVectors.basis2.y]
                    : [lattice.meepLattice!.reciprocal_basis2!.x, lattice.meepLattice!.reciprocal_basis2!.y]
                }
                color="text-purple-400"
                size="sm"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* High Symmetry Points Section - NEW */}
      {detectedLatticeType && (
        <div className="p-4 pt-0">
          <h3 className="text-sm font-medium text-gray-300 mb-3 text-center">High Symmetry Points</h3>
          
          {(() => {
            const symmetryPoints = getSymmetryPointsForLattice(detectedLatticeType.type);
            const symmetryPaths = getSymmetryPathsForLattice(detectedLatticeType.type);
            
            if (symmetryPoints.length === 0) {
              return (
                <div className="text-xs text-gray-500 text-center">
                  No symmetry points defined for {detectedLatticeType.type}
                </div>
              );
            }
            
            // Create path string for display (e.g., "Γ → X → M → Γ")
            let pathDisplay: string[] = [];
            if (symmetryPaths.length > 0) {
              // Build the path
              const visited = new Set<string>();
              pathDisplay.push('Γ'); // Always start with Gamma
              visited.add('Γ');
              
              let current = 'Γ';
              while (true) {
                const nextPath = symmetryPaths.find(p => p.from === current && !visited.has(p.to));
                if (!nextPath) break;
                pathDisplay.push(nextPath.to);
                visited.add(nextPath.to);
                current = nextPath.to;
              }
              
              // Close the loop if we have more than just Gamma
              if (pathDisplay.length > 1 && current !== 'Γ') {
                pathDisplay.push('Γ');
              }
            }
            
            return (
              <>
                {/* Symmetry Points - Single Row with Full Width */}
                <div className="flex flex-col-auto gap-1 mb-1">
                  {symmetryPoints.map((point, idx) => (
                    <div 
                      key={idx}
                      className="bg-neutral-700/30 rounded px-1 py-1 flex items-center justify-center flex-1"
                    >
                      <LabeledVector
                        label={point.label}
                        values={[point.coordinates.b1, point.coordinates.b2]}
                        color="text-gray-300"
                        size="sm"
                        format="decimal"
                        decimalPlaces={2}
                        labelColor="text-[#fbbf24]"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Path Display */}
                {pathDisplay.length > 1 && (
                  <div className="bg-neutral-700/30 rounded px-3 py-1">
                    <div className="flex items-center justify-center gap-1 text-s">
                      {pathDisplay.map((point, idx) => (
                        <React.Fragment key={idx}>
                          <span className="text-[#fbbf24] font-bold">{point}</span>
                          {idx < pathDisplay.length - 1 && (
                            <ArrowRight size={12} className="text-gray-500" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      
      {/* Transformations Section */}
      <div className="p-4 pt-0">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Transformations</h3>
        <div className="grid grid-cols-2 gap-2">
          <TooltipWrapper
            tooltip={
              <TransformationTooltip
                description="Transforms real to reciprocal coordinates"
                iconSrc="/icons/T_AB.svg"
                matrix={TAB}
                matrixMode="3D"
                iconSize={60}
              />
            }
          >
            <div className="bg-neutral-700/30 rounded p-2 hover:bg-neutral-700/50 transition-colors cursor-pointer flex items-center justify-center h-12">
              <CustomLucideIcon
                src="/icons/T_AB_matrix.svg"
                size={150}
                color="currentColor"
                className="text-gray-300"
              />
            </div>
          </TooltipWrapper>
          
          <TooltipWrapper
            tooltip={
              <TransformationTooltip
                description="Transforms reciprocal to real coordinates"
                iconSrc="/icons/T_BA.svg"
                matrix={TBA}
                matrixMode="3D"
                iconSize={60}
              />
            }
          >
            <div className="bg-neutral-700/30 rounded p-2 hover:bg-neutral-700/50 transition-colors cursor-pointer flex items-center justify-center h-12">
              <CustomLucideIcon
                src="/icons/T_BA_matrix.svg"
                size={150}
                color="currentColor"
                className="text-gray-300"
              />
            </div>
          </TooltipWrapper>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 pt-0 mt-auto">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {actionButtons.map((action, index) => {
            const Icon = action.icon;
            const isLastAndOdd = index === actionButtons.length - 1 && actionButtons.length % 2 === 1;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex flex-col items-center justify-center p-3 rounded bg-neutral-700/30 hover:bg-neutral-700/50 transition-colors group cursor-pointer ${
                  isLastAndOdd ? 'col-span-2' : ''
                }`}
              >
                <Icon 
                  size={20} 
                  className="text-gray-400 group-hover:text-gray-200 transition-colors mb-1"
                />
                <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors text-center">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Render dropdown portal */}
      {renderDropdown()}
    </div>
  );
};

export default RightLatticePanel;
