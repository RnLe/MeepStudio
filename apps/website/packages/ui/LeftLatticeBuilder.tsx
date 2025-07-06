import React, { useState, useEffect } from "react";
import { Square, RectangleHorizontal, Hexagon, Diamond, Triangle, Settings, Anchor, ChevronDown, ChevronRight, Superscript, Hash, Pi, CircleDot } from "lucide-react";
import LatticeVectorDisplay from "./LatticeVectorDisplay";
import { useEditorStateStore } from "../providers/EditorStateStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useProjectsStore } from "../stores/projects";
import { Vector3 } from "packages/types/meepBaseTypes";
import { useSpring, animated, config } from "@react-spring/web";

interface LeftLatticeBuilderProps {
  onCancel?: () => void;
}

type LatticeType = 'square' | 'rectangular' | 'hexagonal' | 'rhombic' | 'oblique' | 'custom';

const latticeTypes: { type: LatticeType; name: string; icon: React.ComponentType<any>; description: string }[] = [
  { 
    type: 'square', 
    name: 'Square', 
    icon: Square, 
    description: 'Orthogonal lattice with equal sides (a = b, α = 90°)'  // Changed γ to α
  },
  { 
    type: 'rectangular', 
    name: 'Rectangular', 
    icon: RectangleHorizontal, 
    description: 'Orthogonal lattice with unequal sides (a ≠ b, α = 90°)'  // Changed γ to α
  },
  { 
    type: 'hexagonal', 
    name: 'Hexagonal', 
    icon: Hexagon, 
    description: 'Six-fold symmetric lattice (a = b, α = 120°)'  // Changed γ to α
  },
  { 
    type: 'rhombic', 
    name: 'Rhombic', 
    icon: Diamond, 
    description: 'Equal sides with oblique angle (a = b, α ≠ 90°)'  // Changed γ to α
  },
  { 
    type: 'oblique', 
    name: 'Oblique', 
    icon: Triangle, 
    description: 'General case with unequal sides and angle (a ≠ b, α ≠ 90°)'  // Changed γ to α
  },
  { 
    type: 'custom', 
    name: 'Custom', 
    icon: Settings, 
    description: 'Custom lattice with user-defined basis vectors' 
  },
];

// Default values for each lattice type
const latticeDefaults = {
  square: { a: 1, b: 1, alpha: 90 },  // Changed gamma to alpha
  rectangular: { a: 1.5, b: 1, alpha: 90 },  // Changed gamma to alpha
  hexagonal: { a: 1, b: 1, alpha: 120 },  // Changed gamma to alpha
  rhombic: { a: 1, b: 1, alpha: 60 },  // Changed gamma to alpha
  oblique: { a: 1.2, b: 1, alpha: 75 },  // Changed gamma to alpha
  custom: { a: 1, b: 1, alpha: 90 }  // Changed gamma to alpha
};

// Helper functions for vector calculations
const vectorLength = (v: Vector3): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y + (v.z || 0) * (v.z || 0));
};

const vectorAngle = (v1: Vector3, v2: Vector3): number => {
  const dot = v1.x * v2.x + v1.y * v2.y + (v1.z || 0) * (v2.z || 0);
  const mag1 = vectorLength(v1);
  const mag2 = vectorLength(v2);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cosAngle = dot / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI;
};

const normalizeVector = (v: Vector3): Vector3 => {
  const len = vectorLength(v);
  if (len === 0) return { x: 0, y: 0, z: v.z };
  return { x: v.x / len, y: v.y / len, z: (v.z || 0) / len };
};

const scaleVector = (v: Vector3, length: number): Vector3 => {
  const normalized = normalizeVector(v);
  return { x: normalized.x * length, y: normalized.y * length, z: normalized.z! * length };
};

const rotateVector2D = (v: Vector3, angleDeg: number): Vector3 => {
  const angleRad = angleDeg * Math.PI / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
    z: v.z
  };
};

export default function LeftLatticeBuilder({ onCancel }: LeftLatticeBuilderProps) {
  // Only get the createLattice function (stable reference)
  const createLattice = useProjectsStore((state) => state.createLattice);
  const setLeftSidebarPanel = useEditorStateStore((state) => state.setLeftSidebarPanel);
  
  const [selectedLatticeType, setSelectedLatticeType] = useState<LatticeType>('square');
  const [hoveredLatticeType, setHoveredLatticeType] = useState<LatticeType | null>(null);
  const [showAdditionalProperties, setShowAdditionalProperties] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [a, setA] = useState(latticeDefaults.square.a);
  const [b, setB] = useState(latticeDefaults.square.b);
  const [alpha, setAlpha] = useState(latticeDefaults.square.alpha);  // Changed from gamma
  
  // Custom lattice fields
  const [basis1, setBasis1] = useState<Vector3>({ x: 1, y: 0, z: 0 });
  const [basis2, setBasis2] = useState<Vector3>({ x: 0, y: 1, z: 0 });
  const [length1, setLength1] = useState(1);
  const [length2, setLength2] = useState(1);
  const [angle, setAngle] = useState(90);
  const [anchorVector, setAnchorVector] = useState<1 | 2>(1);
  const [hoveredVector, setHoveredVector] = useState<1 | 2 | null>(null);
  
  // Notation preferences
  const [useExponentialNotation, setUseExponentialNotation] = useState(false);
  const [useRadians, setUseRadians] = useState(false);
  
  // Helper functions for formatting and parsing
  const formatNumber = (value: number, exponential: boolean = useExponentialNotation): string => {
    if (exponential) {
      return value.toExponential(2);
    }
    // For very small or very large numbers, use exponential anyway
    if (Math.abs(value) < 0.01 || Math.abs(value) > 1000) {
      return value.toExponential(2);
    }
    return value.toFixed(3);
  };
  
  const parseNumberInput = (input: string): number => {
    const parsed = parseFloat(input);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  const formatAngle = (degrees: number): string => {
    if (useRadians) {
      const radians = degrees * Math.PI / 180;
      return formatNumber(radians, false);
    }
    return formatNumber(degrees, false);
  };
  
  const parseAngleInput = (input: string): number => {
    const parsed = parseFloat(input);
    if (isNaN(parsed)) return 0;
    
    if (useRadians) {
      // Convert radians to degrees
      return parsed * 180 / Math.PI;
    }
    return parsed;
  };
  
  // Clamp values to limits
  const clampLength = (value: number): number => {
    return Math.max(1e-5, Math.min(1e3, value));
  };
  
  const clampAngle = (degrees: number): number => {
    return Math.max(1e-5, Math.min(360, degrees));
  };
  
  // Update lengths and angle when vectors change
  useEffect(() => {
    setLength1(vectorLength(basis1));
    setLength2(vectorLength(basis2));
    setAngle(vectorAngle(basis1, basis2));
  }, [basis1, basis2]);
  
  // Initialize form values when lattice type changes
  useEffect(() => {
    const defaults = latticeDefaults[selectedLatticeType];
    setA(defaults.a);
    setB(defaults.b);
    setAlpha(defaults.alpha);  // Changed from setGamma
    
    // Update custom vectors based on new type
    if (selectedLatticeType !== 'custom') {
      const newBasis1: Vector3 = { x: defaults.a, y: 0, z: 0 };
      let newBasis2: Vector3;
      
      switch (selectedLatticeType) {
        case 'square':
          newBasis2 = { x: 0, y: defaults.a, z: 0 };
          break;
        case 'rectangular':
          newBasis2 = { x: 0, y: defaults.b, z: 0 };
          break;
        case 'hexagonal':
          newBasis2 = { 
            x: defaults.a * Math.cos(120 * Math.PI / 180), 
            y: defaults.a * Math.sin(120 * Math.PI / 180), 
            z: 0 
          };
          break;
        case 'rhombic':
          newBasis2 = { 
            x: defaults.a * Math.cos(defaults.alpha * Math.PI / 180),  // Changed from gamma
            y: defaults.a * Math.sin(defaults.alpha * Math.PI / 180),  // Changed from gamma
            z: 0 
          };
          break;
        case 'oblique':
          newBasis2 = { 
            x: defaults.b * Math.cos(defaults.alpha * Math.PI / 180),  // Changed from gamma
            y: defaults.b * Math.sin(defaults.alpha * Math.PI / 180),  // Changed from gamma
            z: 0 
          };
          break;
        default:
          newBasis2 = { x: 0, y: 1, z: 0 };
      }
      
      setBasis1(newBasis1);
      setBasis2(newBasis2);
    }
  }, [selectedLatticeType]);
  
  // Get required fields based on lattice type
  const getRequiredFields = () => {
    switch (selectedLatticeType) {
      case 'square':
        return ['a'];
      case 'rectangular':
        return ['a', 'b'];
      case 'hexagonal':
        return ['a'];
      case 'rhombic':
        return ['a', 'alpha'];  // Changed from gamma
      case 'oblique':
        return ['a', 'b', 'alpha'];  // Changed from gamma
      case 'custom':
        return [];
      default:
        return [];
    }
  };
  
  const requiredFields = getRequiredFields();
  
  const displayedLatticeType = hoveredLatticeType || selectedLatticeType;
  
  const handleLatticeTypeClick = (latticeType: LatticeType) => {
    if (!showCreateForm) {
      setSelectedLatticeType(latticeType);
    }
  };
  
  const handleLengthChange = (vectorNum: 1 | 2, newLength: number) => {
    const clamped = clampLength(newLength);
    if (vectorNum === 1) {
      setBasis1(scaleVector(basis1, clamped));
    } else {
      setBasis2(scaleVector(basis2, clamped));
    }
  };
  
  const handleAngleChange = (newAngle: number) => {
    const clamped = clampAngle(newAngle);
    if (anchorVector === 1) {
      // Rotate basis2 relative to basis1
      const newBasis2 = rotateVector2D({ x: length2, y: 0, z: 0 }, clamped);
      setBasis2(newBasis2);
    } else {
      // Rotate basis1 relative to basis2
      const currentAngle = vectorAngle(basis1, basis2);
      const rotation = clamped - currentAngle;
      const newBasis1 = rotateVector2D(basis1, -rotation);
      setBasis1(newBasis1);
    }
  };
  
  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Please enter a title for the lattice');
      return;
    }
    
    let meepLattice;
    let parameters;
    
    if (selectedLatticeType === 'custom') {
      meepLattice = {
        basis1,
        basis2,
        basis3: { x: 0, y: 0, z: 1 }, // Add the missing basis3
        basis_size: { x: 1, y: 1, z: 1 }
      };
      parameters = { a: length1, b: length2, alpha: angle };
    } else {
      // Generate basis vectors based on lattice type and parameters
      let generatedBasis1: Vector3 = { x: a, y: 0, z: 0 };
      let generatedBasis2: Vector3 = { x: 0, y: 1, z: 0 };
      
      switch (selectedLatticeType) {
        case 'square':
          generatedBasis2 = { x: 0, y: a, z: 0 };
          parameters = { a, b: a, alpha: 90 };  // b = a for square
          break;
        case 'rectangular':
          generatedBasis2 = { x: 0, y: b, z: 0 };
          parameters = { a, b, alpha: 90 };
          break;
        case 'hexagonal':
          generatedBasis2 = { x: a * Math.cos(120 * Math.PI / 180), y: a * Math.sin(120 * Math.PI / 180), z: 0 };
          parameters = { a, b: a, alpha: 120 };  // b = a for hexagonal, alpha = 120
          break;
        case 'rhombic':
          generatedBasis2 = { x: a * Math.cos(alpha * Math.PI / 180), y: a * Math.sin(alpha * Math.PI / 180), z: 0 };  // Changed gamma to alpha
          parameters = { a, b: a, alpha };  // b = a for rhombic
          break;
        case 'oblique':
          generatedBasis2 = { x: b * Math.cos(alpha * Math.PI / 180), y: b * Math.sin(alpha * Math.PI / 180), z: 0 };  // Changed gamma to alpha
          parameters = { a, b, alpha };  // Changed gamma to alpha
          break;
      }
      
      meepLattice = {
        basis1: generatedBasis1,
        basis2: generatedBasis2,
        basis3: { x: 0, y: 0, z: 1 }, // Add the missing basis3
        basis_size: { x: 1, y: 1, z: 1 }
      };
    }
    
    await createLattice({
      title,
      description: description || undefined,
      latticeType: selectedLatticeType,
      meepLattice,
      parameters,
      displaySettings: {
        showWignerSeitz: false,
        showBrillouinZone: false,
        showHighSymmetryPoints: false,
        showReciprocal: false,
      }
    });
    
    // Reset form and close it
    setTitle('');
    setDescription('');
    setA(1);
    setB(1);
    setAlpha(90);  // Changed from setGamma
    setBasis1({ x: 1, y: 0, z: 0 });
    setBasis2({ x: 0, y: 1, z: 0 });
    setShowAdditionalProperties(false);
    setShowCreateForm(false);
    
    if (onCancel) {
      onCancel();
    } else {
      setLeftSidebarPanel("explorer");
    }
  };
  
  const selectedTypeInfo = latticeTypes.find(type => type.type === selectedLatticeType) || latticeTypes[0];
  
  // Calculate current vectors based on form values for display
  const getCurrentVectors = () => {
    if (selectedLatticeType === 'custom') {
      return { basis1, basis2 };
    }
    
    let currentBasis1: Vector3 = { x: a, y: 0, z: 0 };
    let currentBasis2: Vector3;
    
    switch (selectedLatticeType) {
      case 'square':
        currentBasis2 = { x: 0, y: a, z: 0 };
        break;
      case 'rectangular':
        currentBasis2 = { x: 0, y: b, z: 0 };
        break;
      case 'hexagonal':
        currentBasis2 = { 
          x: a * Math.cos(120 * Math.PI / 180), 
          y: a * Math.sin(120 * Math.PI / 180), 
          z: 0 
        };
        break;
      case 'rhombic':
        currentBasis2 = { 
          x: a * Math.cos(alpha * Math.PI / 180), 
          y: a * Math.sin(alpha * Math.PI / 180), 
          z: 0 
        };
        break;
      case 'oblique':
        currentBasis2 = { 
          x: b * Math.cos(alpha * Math.PI / 180), 
          y: b * Math.sin(alpha * Math.PI / 180), 
          z: 0 
        };
        break;
      default:
        currentBasis2 = { x: 0, y: 1, z: 0 };
    }
    
    return { basis1: currentBasis1, basis2: currentBasis2 };
  };
  
  // Animation for vector display
  const vectorDisplaySpring = useSpring({
    transform: showCreateForm ? 'translateY(-20px)' : 'translateY(0px)',
    opacity: showCreateForm ? 0.8 : 1,
    config: config.gentle,
  });
  
  // Animation for create button
  const createButtonSpring = useSpring({
    opacity: showCreateForm ? 0 : 1,
    transform: showCreateForm ? 'scale(0.9)' : 'scale(1)',
    config: config.gentle,
  });
  
  // Animation for form
  const formSpring = useSpring({
    opacity: showCreateForm ? 1 : 0,
    maxHeight: showCreateForm ? '500px' : '0px',
    config: config.gentle,
  });
  
  // Animation for selected type
  const selectedTypeSpring = useSpring({
    opacity: showCreateForm ? 1 : 0,
    transform: showCreateForm ? 'translateY(0px)' : 'translateY(-10px)',
    config: config.gentle,
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-2 py-3">
      <h4 className="text-xs font-medium text-gray-300 mb-2">Select Lattice Type</h4>
      
      {/* Selected lattice type at top when form is shown */}
      {showCreateForm && (
        <animated.div style={selectedTypeSpring} className="flex flex-col items-center mb-3">
          <div className="flex flex-col items-center">
            <div className="p-1 rounded-lg bg-gray-700/50">
              <div className="w-12 h-12 flex items-center justify-center">
                <selectedTypeInfo.icon className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            <h3 className="text-xs font-medium text-gray-200 text-center mt-1">
              {selectedTypeInfo.name}
            </h3>
          </div>
          
          {/* Vector Display right under selected icon */}
          <div className="mt-3 w-full">
            <LatticeVectorDisplay 
              latticeType={selectedLatticeType}
              customVectors={showCreateForm ? getCurrentVectors() : undefined}
              customAngle={showCreateForm && selectedLatticeType !== 'custom' ? 
                (selectedLatticeType === 'hexagonal' ? 120 : alpha) : undefined}  // Changed gamma to alpha
            />
          </div>
        </animated.div>
      )}
      
      {/* Lattice type grid - completely hidden when form is shown */}
      {!showCreateForm && (
        <div className="mb-3">
          <div className="grid grid-cols-2 gap-1.5">
            {latticeTypes.map((latticeType) => {
              const IconComponent = latticeType.icon;
              const isSelected = selectedLatticeType === latticeType.type;
              const isHovered = hoveredLatticeType === latticeType.type;
              
              return (
                <div key={latticeType.type} className="flex flex-col">
                  <button
                    onClick={() => handleLatticeTypeClick(latticeType.type)}
                    onMouseEnter={() => setHoveredLatticeType(latticeType.type)}
                    onMouseLeave={() => setHoveredLatticeType(null)}
                    className={`group flex items-center justify-center p-0.5 rounded-lg transition-all mb-0.5 cursor-pointer ${
                      isSelected 
                        ? 'bg-gray-700/50' 
                        : isHovered
                        ? 'bg-gray-700/30'
                        : 'hover:bg-gray-700/30'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <IconComponent className={`w-8 h-8 transition-colors ${
                        isSelected 
                          ? 'text-blue-400' 
                          : 'text-gray-400 group-hover:text-blue-400'
                      }`} />
                    </div>
                  </button>
                  <h3 className="text-xs font-medium text-gray-200 text-center">
                    {latticeType.name}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vector Display when form is not shown */}
      {!showCreateForm && (
        <div className="mb-3">
          <LatticeVectorDisplay latticeType={displayedLatticeType} />
        </div>
      )}

      {/* Create Button */}
      {!showCreateForm && (
        <animated.div className="mb-3" style={createButtonSpring}>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full px-2 py-1.5 bg-transparent border-2 border-dashed border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white rounded text-xs font-medium transition-all cursor-pointer"
          >
            Create {selectedTypeInfo.name} Lattice
          </button>
        </animated.div>
      )}

      {/* Creation Form */}
      <animated.div className="overflow-hidden" style={formSpring}>
        {showCreateForm && (
          <div className="border-t border-gray-700 pt-2">
            <h4 className="text-xs font-medium text-gray-300 mb-2">Create {selectedTypeInfo.name} Lattice</h4>
            
            {/* Notation toggles */}
            <div className="flex items-center justify-end gap-2 mb-2">
              <button
                onClick={() => setUseExponentialNotation(!useExponentialNotation)}
                className={`p-1 rounded text-xs ${useExponentialNotation ? 'bg-gray-700 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                title={useExponentialNotation ? "Switch to decimal notation" : "Switch to exponential notation"}
              >
                {useExponentialNotation ? <Superscript size={12} /> : <Hash size={12} />}
              </button>
              {(requiredFields.includes('alpha') || selectedLatticeType === 'custom') && (  // Changed from gamma
                <button
                  onClick={() => setUseRadians(!useRadians)}
                  className={`p-1 rounded text-xs ${useRadians ? 'bg-gray-700 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                  title={useRadians ? "Switch to degrees" : "Switch to radians"}
                >
                  {useRadians ? <Pi size={12} /> : <CircleDot size={12} />}
                </button>
              )}
            </div>
            
            {/* Title (always required) */}
            <div className="mb-2">
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-400 whitespace-nowrap">Title =</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter title"
                />
              </div>
            </div>
            
            {/* Lattice-specific required fields */}
            {selectedLatticeType !== 'custom' && (
              <div className="space-y-1.5 mb-2">
                {requiredFields.includes('a') && (
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-400 whitespace-nowrap">a =</label>
                    <input
                      type="text"
                      value={formatNumber(a)}
                      onChange={(e) => {
                        const value = parseNumberInput(e.target.value);
                        setA(clampLength(value));
                      }}
                      className="flex-1 px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
                {requiredFields.includes('b') && (
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-400 whitespace-nowrap">b =</label>
                    <input
                      type="text"
                      value={formatNumber(b)}
                      onChange={(e) => {
                        const value = parseNumberInput(e.target.value);
                        setB(clampLength(value));
                      }}
                      className="flex-1 px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
                {requiredFields.includes('alpha') && (  // Changed from gamma
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-400 whitespace-nowrap">α =</label>
                    <input
                      type="text"
                      value={formatAngle(alpha)}  // Changed from gamma
                      onChange={(e) => {
                        const value = parseAngleInput(e.target.value);
                        setAlpha(clampAngle(value));  // Changed from setGamma
                      }}
                      className="flex-1 px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500">{useRadians ? 'rad' : '°'}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Custom lattice vector inputs */}
            {selectedLatticeType === 'custom' && (
              <div className="space-y-2 mb-2">
                {/* Basis 1 */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredVector(1)}
                  onMouseLeave={() => setHoveredVector(null)}
                >
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-400 whitespace-nowrap flex items-center">
                      a₁ =
                      {anchorVector === 1 && (
                        <Anchor size={10} className="ml-1 text-blue-400" />
                      )}
                    </label>
                    <div className="flex items-center space-x-0.5 flex-1">
                      <span className="text-gray-400 text-xs">[</span>
                      <input
                        type="text"
                        value={formatNumber(basis1.x)}
                        onChange={(e) => {
                          const value = parseNumberInput(e.target.value);
                          setBasis1({ ...basis1, x: value });
                        }}
                        className="flex-1 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none min-w-0"
                      />
                      <span className="text-gray-400 text-xs">,</span>
                      <input
                        type="text"
                        value={formatNumber(basis1.y)}
                        onChange={(e) => {
                          const value = parseNumberInput(e.target.value);
                          setBasis1({ ...basis1, y: value });
                        }}
                        className="flex-1 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none min-w-0"
                      />
                      <span className="text-gray-400 text-xs">]</span>
                    </div>
                  </div>
                  {hoveredVector === 1 && anchorVector !== 1 && (
                    <button
                      onClick={() => setAnchorVector(1)}
                      className="absolute right-0 top-0 p-0.5 text-gray-400 hover:text-blue-400"
                    >
                      <Anchor size={10} />
                    </button>
                  )}
                </div>
                
                {/* Basis 2 */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredVector(2)}
                  onMouseLeave={() => setHoveredVector(null)}
                >
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-400 whitespace-nowrap flex items-center">
                      a₂ =
                      {anchorVector === 2 && (
                        <Anchor size={10} className="ml-1 text-blue-400" />
                      )}
                    </label>
                    <div className="flex items-center space-x-0.5 flex-1">
                      <span className="text-gray-400 text-xs">[</span>
                      <input
                        type="text"
                        value={formatNumber(basis2.x)}
                        onChange={(e) => {
                          const value = parseNumberInput(e.target.value);
                          setBasis2({ ...basis2, x: value });
                        }}
                        className="flex-1 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none min-w-0"
                      />
                      <span className="text-gray-400 text-xs">,</span>
                      <input
                        type="text"
                        value={formatNumber(basis2.y)}
                        onChange={(e) => {
                          const value = parseNumberInput(e.target.value);
                          setBasis2({ ...basis2, y: value });
                        }}
                        className="flex-1 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none min-w-0"
                      />
                      <span className="text-gray-400 text-xs">]</span>
                    </div>
                  </div>
                  {hoveredVector === 2 && anchorVector !== 2 && (
                    <button
                      onClick={() => setAnchorVector(2)}
                      className="absolute right-0 top-0 p-0.5 text-gray-400 hover:text-blue-400"
                    >
                      <Anchor size={10} />
                    </button>
                  )}
                </div>
                
                {/* Length and angle controls */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-400 whitespace-nowrap">|a₁| =</label>
                    <input
                      type="text"
                      value={formatNumber(length1)}
                      onChange={(e) => {
                        const value = parseNumberInput(e.target.value);
                        handleLengthChange(1, value);
                      }}
                      className="flex-1 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-400 whitespace-nowrap">|a₂| =</label>
                    <input
                      type="text"
                      value={formatNumber(length2)}
                      onChange={(e) => {
                        const value = parseNumberInput(e.target.value);
                        handleLengthChange(2, value);
                      }}
                      className="flex-1 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-400 whitespace-nowrap">∠(a₁,a₂) =</label>
                    <input
                      type="text"
                      value={formatAngle(angle)}
                      onChange={(e) => {
                        const value = parseAngleInput(e.target.value);
                        handleAngleChange(value);
                      }}
                      className="flex-1 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500">{useRadians ? 'rad' : '°'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional Properties */}
            <button
              onClick={() => setShowAdditionalProperties(!showAdditionalProperties)}
              className="w-full flex items-center justify-between px-1 py-0.5 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors mb-1"
            >
              <span>Additional Properties</span>
              {showAdditionalProperties ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </button>
            
            {showAdditionalProperties && (
              <div className="mb-2">
                <div className="flex items-start gap-1">
                  <label className="text-xs text-gray-400 whitespace-nowrap mt-1">Desc =</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1 px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none resize-none"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-1">
              <button
                onClick={handleCreate}
                className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setTitle('');
                  setDescription('');
                  setShowAdditionalProperties(false);
                }}
                className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </animated.div>
    </div>
  );
}
