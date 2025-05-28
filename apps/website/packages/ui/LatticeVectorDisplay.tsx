"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSpring, animated } from "@react-spring/web";
import { Vector3 } from "packages/types/meepBaseTypes";

type LatticeType = 'square' | 'rectangular' | 'hexagonal' | 'rhombic' | 'oblique' | 'custom';

interface LatticeVectorDisplayProps {
  latticeType: LatticeType;
  customVectors?: {
    basis1: Vector3;
    basis2: Vector3;
  };
  customAngle?: number;
  realSpaceMode?: boolean;
}

interface LatticeParams {
  a1: { x: number; y: number };
  a2: { x: number; y: number };
  angle: number; // in degrees
  conditions: string[];
}

const latticeParams: Record<LatticeType, LatticeParams> = {
  square: {
    a1: { x: 60, y: 0 },
    a2: { x: 0, y: 60 },
    angle: 90,
    conditions: ["a = b", "γ = 90°"]
  },
  rectangular: {
    a1: { x: 80, y: 0 },
    a2: { x: 0, y: 50 },
    angle: 90,
    conditions: ["a ≠ b", "γ = 90°"]
  },
  hexagonal: {
    a1: { x: 60, y: 0 },
    a2: { x: -30, y: 52 },
    angle: 120,
    conditions: ["a = b", "γ = 120°"]
  },
  rhombic: {
    a1: { x: 60, y: 0 },
    a2: { x: 30, y: 52 },
    angle: 60,
    conditions: ["a = b", "γ ≠ 90°"]
  },
  oblique: {
    a1: { x: 70, y: 0 },
    a2: { x: 20, y: 50 },
    angle: 75,
    conditions: ["a ≠ b", "γ ≠ 90°"]
  },
  custom: {
    a1: { x: 60, y: 0 },
    a2: { x: 0, y: 60 },
    angle: 90,
    conditions: ["User defined", "¯\\_(ツ)_/¯"]
  }
};

export default function LatticeVectorDisplay({ latticeType, customVectors, customAngle, realSpaceMode = true }: LatticeVectorDisplayProps) {
  const params = latticeParams[latticeType];
  const centerX = 80;
  const centerY = 60;

  // Persistent state for custom rotation
  const [customRotationValue, setCustomRotationValue] = useState(0);
  const lastRotationRef = useRef(0);
  const isCustomRef = useRef(false);

  // For custom lattice, create a rotating vector
  const customRotation = useSpring({
    from: { rotation: lastRotationRef.current },
    to: { rotation: latticeType === 'custom' ? lastRotationRef.current + 360 : lastRotationRef.current },
    loop: latticeType === 'custom',
    config: { duration: 10000 }, // 10 seconds for full rotation
    onChange: ({ value }) => {
      if (latticeType === 'custom' && value.rotation !== undefined) {
        setCustomRotationValue(value.rotation % 360);
        lastRotationRef.current = value.rotation;
      }
    },
    immediate: latticeType !== 'custom' && !isCustomRef.current,
  });

  // Track when we switch to/from custom
  useEffect(() => {
    isCustomRef.current = latticeType === 'custom';
  }, [latticeType]);

  // Calculate custom lattice a2 vector based on rotation
  const getCustomA2 = (rotation: number) => {
    const angle = (rotation * Math.PI) / 180;
    const length = 50;
    return {
      x: length * Math.cos(angle),
      y: length * Math.sin(angle)
    };
  };

  // Calculate dynamic angle for custom lattice - angle between a1 and a2
  const getCustomAngle = (rotation: number) => {
    // Since a1 is along x-axis (0°), the angle is just the rotation
    return rotation % 360;
  };

  // Use custom vectors if provided, otherwise use default params
  const displayVectors = customVectors ? {
    a1: { x: customVectors.basis1.x * 60, y: customVectors.basis1.y * 60 },
    a2: { x: customVectors.basis2.x * 60, y: customVectors.basis2.y * 60 }
  } : {
    a1: params.a1,
    a2: params.a2
  };
  
  // Calculate scale factor for grid based on vector magnitudes
  const calculateScaleFactor = () => {
    const maxComponent = Math.max(
      Math.abs(displayVectors.a1.x),
      Math.abs(displayVectors.a1.y),
      Math.abs(displayVectors.a2.x),
      Math.abs(displayVectors.a2.y)
    );
    
    // If vectors exceed 4 grid units (80px), scale down
    const threshold = 80; // 4 * 20px grid
    if (maxComponent > threshold) {
      return threshold / maxComponent;
    }
    return 1;
  };
  
  const scaleFactor = calculateScaleFactor();
  const gridSize = 20 * scaleFactor; // Scale grid with vectors
  
  // Calculate angle from vectors if custom vectors provided
  const calculateAngle = (v1: { x: number; y: number }, v2: { x: number; y: number }) => {
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    if (mag1 === 0 || mag2 === 0) return 0;
    const cosAngle = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI;
  };
  
  const displayAngle = customAngle !== undefined ? customAngle : 
    (customVectors ? calculateAngle(displayVectors.a1, displayVectors.a2) : params.angle);

  // Animate vectors with smooth transition
  const vectorSpring = useSpring({
    a1x: displayVectors.a1.x * 0.8 * scaleFactor,
    a1y: displayVectors.a1.y * 0.8 * scaleFactor,
    a2x: latticeType === 'custom' && !customVectors ? getCustomA2(customRotationValue).x * scaleFactor : displayVectors.a2.x * 0.8 * scaleFactor,
    a2y: latticeType === 'custom' && !customVectors ? getCustomA2(customRotationValue).y * scaleFactor : displayVectors.a2.y * 0.8 * scaleFactor,
    angle: latticeType === 'custom' && !customVectors ? getCustomAngle(customRotationValue) : displayAngle,
    scale: scaleFactor,
    config: { tension: 120, friction: 14 }
  });

  // Animate conditions text
  const conditionSprings = params.conditions.map((_, index) => 
    useSpring({
      from: { opacity: 0, transform: 'translateY(-5px)' },
      to: { opacity: 1, transform: 'translateY(0px)' },
      delay: index * 50,
      config: { tension: 200, friction: 20 }
    })
  );

  // Calculate arc path for angle indicator between two arbitrary vectors
  const getArcPath = (angle: number, v1x: number, v1y: number, v2x: number, v2y: number) => {
    const angleRadius = 20;

    // Angles in SVG space (y down)
    const v1Angle = Math.atan2(-v1y, v1x);
    const v2Angle = Math.atan2(-v2y, v2x);

    const startX = centerX + angleRadius * Math.cos(v1Angle);
    const startY = centerY + angleRadius * Math.sin(v1Angle);
    const endX   = centerX + angleRadius * Math.cos(v2Angle);
    const endY   = centerY + angleRadius * Math.sin(v2Angle);

    // Direction taken from cross-product sign …
    const crossSvg = v1x * (-v2y) - (-v1y) * v2x; // >0 ⇒ clockwise in SVG
    // … but flip it when the desired arc is the long one (angle ≥ 180°)
    const sweepFlag = (crossSvg > 0 ? 1 : 0) ^ (angle > 180 ? 1 : 0); // XOR
    const largeArcFlag = angle > 180 ? 1 : 0;

    return `M ${startX} ${startY} A ${angleRadius} ${angleRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
  };

  // Colors based on mode
  const vector1Color = realSpaceMode ? "#10B981" : "#60A5FA"; // green -> blue
  const vector2Color = realSpaceMode ? "#F59E0B" : "#A78BFA"; // amber -> purple
  const angleLabel = realSpaceMode ? "α" : "β";
  const vector1Label = realSpaceMode ? "a₁" : "b₁";
  const vector2Label = realSpaceMode ? "a₂" : "b₂";

  // helper – returns bisector angle that lies inside the drawn arc
  const getMidAngle = (
    v1Angle: number,
    v2Angle: number,
    fullAngleDeg: number
  ): number => {
    let diff = v2Angle - v1Angle;
    // wrap into [-π, π]
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    let mid = v1Angle + diff / 2;      // bisects the smaller arc
    if (fullAngleDeg > 180) mid += Math.PI; // flip to bisect the large arc
    return mid;
  };

  return (
    <div className="flex flex-col p-3 bg-gray-800 rounded-lg border border-gray-700">
      {/* Vector visualization */}
      <div className="flex items-center justify-center mb-3">
        <svg width="160" height="120" className="overflow-visible">
          {/* Grid lines with dynamic scaling */}
          <defs>
            <pattern id={`grid-scaled-${scaleFactor}`} width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#374151" strokeWidth="0.5" />
            </pattern>
            {/* Arrowheads */}
            <marker id={`arrowhead-v1-${realSpaceMode ? 'real' : 'reciprocal'}`} markerWidth="8" markerHeight="8" refX="6" refY="2.5" orient="auto">
              <polygon points="0 0, 8 2.5, 0 5" fill={vector1Color} />
            </marker>
            <marker id={`arrowhead-v2-${realSpaceMode ? 'real' : 'reciprocal'}`} markerWidth="8" markerHeight="8" refX="6" refY="2.5" orient="auto">
              <polygon points="0 0, 8 2.5, 0 5" fill={vector2Color} />
            </marker>
          </defs>
          <rect x="-10" y="-10" width="180" height="140" fill={`url(#grid-scaled-${scaleFactor})`} />

          {/* Angle arc */}
          {(latticeType === 'custom' && !customVectors) ? (
            <animated.path
              d={customRotation.rotation.to(rotation => {
                const angle = getCustomAngle(rotation);
                const v1x = 60 * scaleFactor;
                const v1y = 0;
                const vec2 = getCustomA2(rotation);
                const v2x = vec2.x * scaleFactor;
                const v2y = vec2.y * scaleFactor;
                return getArcPath(angle, v1x, v1y, v2x, v2y);
              })}
              fill="none"
              stroke="#60A5FA"
              strokeWidth="1.5"
              opacity="0.5"
            />
          ) : (
            <animated.path
              d={vectorSpring.angle.to(angle => {
                const a1x = vectorSpring.a1x.get();
                const a1y = vectorSpring.a1y.get();
                const a2x = vectorSpring.a2x.get();
                const a2y = vectorSpring.a2y.get();
                return getArcPath(angle, a1x, a1y, a2x, a2y);
              })}
              fill="none"
              stroke="#60A5FA"
              strokeWidth="1.5"
              opacity="0.5"
            />
          )}

          {/* Angle label positioned at the middle of the arc */}
          {(latticeType === 'custom' && !customVectors) ? (
            <animated.text
              x={customRotation.rotation.to(rotation => {
                const v1x = 60 * scaleFactor;
                const v1y = 0;
                const vec2 = getCustomA2(rotation);
                const v2x = vec2.x * scaleFactor;
                const v2y = vec2.y * scaleFactor;
                
                // Calculate angles in SVG coordinates
                const v1Angle = Math.atan2(-v1y, v1x);
                const v2Angle = Math.atan2(-v2y, v2x);
                const midAngle = getMidAngle(v1Angle, v2Angle, getCustomAngle(rotation));
                return centerX + 30 * Math.cos(midAngle);
              })}
              y={customRotation.rotation.to(rotation => {
                const v1x = 60 * scaleFactor;
                const v1y = 0;
                const vec2 = getCustomA2(rotation);
                const v2x = vec2.x * scaleFactor;
                const v2y = vec2.y * scaleFactor;
                
                // Calculate angles in SVG coordinates
                const v1Angle = Math.atan2(-v1y, v1x);
                const v2Angle = Math.atan2(-v2y, v2x);
                const midAngle = getMidAngle(v1Angle, v2Angle, getCustomAngle(rotation));
                return centerY + 30 * Math.sin(midAngle) + 3;
              })}
              className="fill-blue-400 text-[10px] font-medium"
              textAnchor="middle"
            >
              {angleLabel}
            </animated.text>
          ) : (
            <animated.text
              x={vectorSpring.angle.to(angle => {
                const a1x = vectorSpring.a1x.get();
                const a1y = vectorSpring.a1y.get();
                const a2x = vectorSpring.a2x.get();
                const a2y = vectorSpring.a2y.get();
                
                // Calculate angles in SVG coordinates
                const v1Angle = Math.atan2(-a1y, a1x);
                const v2Angle = Math.atan2(-a2y, a2x);
                const midAngle = getMidAngle(v1Angle, v2Angle, angle);
                return centerX + 30 * Math.cos(midAngle);
              })}
              y={vectorSpring.angle.to(angle => {
                const a1x = vectorSpring.a1x.get();
                const a1y = vectorSpring.a1y.get();
                const a2x = vectorSpring.a2x.get();
                const a2y = vectorSpring.a2y.get();
                
                // Calculate angles in SVG coordinates
                const v1Angle = Math.atan2(-a1y, a1x);
                const v2Angle = Math.atan2(-a2y, a2x);
                const midAngle = getMidAngle(v1Angle, v2Angle, angle);
                return centerY + 30 * Math.sin(midAngle) + 3;
              })}
              className="fill-blue-400 text-[10px] font-medium"
              textAnchor="middle"
            >
              {angleLabel}
            </animated.text>
          )}

          {/* Origin point */}
          <circle cx={centerX} cy={centerY} r="2.5" className="fill-gray-400" />

          {/* Vector a1/b1 */}
          <animated.line
            x1={centerX}
            y1={centerY}
            x2={vectorSpring.a1x.to(x => centerX + x)}
            y2={vectorSpring.a1y.to(y => centerY - y)}
            stroke={vector1Color}
            strokeWidth="2"
            markerEnd={`url(#arrowhead-v1-${realSpaceMode ? 'real' : 'reciprocal'})`}
          />
          
          {/* Vector a2/b2 */}
          {latticeType === 'custom' ? (
            <animated.line
              x1={centerX}
              y1={centerY}
              x2={customRotation.rotation.to(rotation => {
                const vec = getCustomA2(rotation);
                return centerX + vec.x * scaleFactor;
              })}
              y2={customRotation.rotation.to(rotation => {
                const vec = getCustomA2(rotation);
                return centerY - vec.y * scaleFactor;
              })}
              stroke={vector2Color}
              strokeWidth="2"
              markerEnd={`url(#arrowhead-v2-${realSpaceMode ? 'real' : 'reciprocal'})`}
            />
          ) : (
            <animated.line
              x1={centerX}
              y1={centerY}
              x2={vectorSpring.a2x.to(x => centerX + x)}
              y2={vectorSpring.a2y.to(y => centerY - y)}
              stroke={vector2Color}
              strokeWidth="2"
              markerEnd={`url(#arrowhead-v2-${realSpaceMode ? 'real' : 'reciprocal'})`}
            />
          )}

          {/* Labels */}
          <animated.text
            x={vectorSpring.a1x.to(x => centerX + x + 8)}
            y={vectorSpring.a1y.to(y => centerY - y + 3)}
            className="text-xs font-medium"
            fill={vector1Color}
          >
            {vector1Label}
          </animated.text>
          
          {latticeType === 'custom' ? (
            <animated.text
              x={customRotation.rotation.to(rotation => {
                const vec = getCustomA2(rotation);
                return centerX + vec.x * scaleFactor + 8;
              })}
              y={customRotation.rotation.to(rotation => {
                const vec = getCustomA2(rotation);
                return centerY - vec.y * scaleFactor + 3;
              })}
              className="text-xs font-medium"
              fill={vector2Color}
            >
              {vector2Label}
            </animated.text>
          ) : (
            <animated.text
              x={vectorSpring.a2x.to(x => centerX + x + 8)}
              y={vectorSpring.a2y.to(y => centerY - y + 3)}
              className="text-xs font-medium"
              fill={vector2Color}
            >
              {vector2Label}
            </animated.text>
          )}
        </svg>
      </div>

      {/* Conditions below */}
      <div className="space-y-1">
        <h4 className="text-xs font-medium text-gray-400">Conditions:</h4>
        <div className="flex flex-wrap gap-1">
          {params.conditions.map((condition, index) => (
            <animated.span
              key={`${latticeType}-${index}`}
              className="text-xs text-gray-300 px-2 py-0.5 bg-gray-700 rounded"
              style={conditionSprings[index]}
            >
              {condition}
            </animated.span>
          ))}
        </div>
      </div>
    </div>
  );
}
