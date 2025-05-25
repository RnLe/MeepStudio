"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSpring, animated } from "@react-spring/web";
import { Vector3 } from "../types/meepProjectTypes";

type LatticeType = 'square' | 'rectangular' | 'hexagonal' | 'rhombic' | 'oblique' | 'custom';

interface LatticeVectorDisplayProps {
  latticeType: LatticeType;
  customVectors?: {
    basis1: Vector3;
    basis2: Vector3;
  };
  customAngle?: number;
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

export default function LatticeVectorDisplay({ latticeType, customVectors, customAngle }: LatticeVectorDisplayProps) {
  const params = latticeParams[latticeType];
  const centerX = 80; // Adjusted to align with grid (multiple of 20)
  const centerY = 60; // Already aligned with grid (multiple of 20)

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
    a1x: displayVectors.a1.x * 0.8,
    a1y: displayVectors.a1.y * 0.8,
    a2x: latticeType === 'custom' && !customVectors ? getCustomA2(customRotationValue).x : displayVectors.a2.x * 0.8,
    a2y: latticeType === 'custom' && !customVectors ? getCustomA2(customRotationValue).y : displayVectors.a2.y * 0.8,
    angle: latticeType === 'custom' && !customVectors ? getCustomAngle(customRotationValue) : displayAngle,
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

  // Calculate arc path for angle indicator
  const angleRadius = 20;
  const angleStartX = centerX + angleRadius;
  const angleStartY = centerY;
  
  const getArcPath = (angle: number) => {
    const endAngle = angle * Math.PI / 180;
    const endX = centerX + angleRadius * Math.cos(endAngle);
    const endY = centerY - angleRadius * Math.sin(endAngle);
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    return `M ${angleStartX} ${angleStartY} A ${angleRadius} ${angleRadius} 0 ${largeArcFlag} 0 ${endX} ${endY}`;
  };

  return (
    <div className="flex flex-col p-3 bg-gray-800 rounded-lg border border-gray-700">
      {/* Vector visualization */}
      <div className="flex items-center justify-center mb-3">
        <svg width="160" height="120" className="overflow-visible">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x="-10" y="-10" width="180" height="140" fill="url(#grid)" />

          {/* Angle arc */}
          {(latticeType === 'custom' && !customVectors) ? (
            <animated.path
              d={customRotation.rotation.to(rotation => getArcPath(getCustomAngle(rotation)))}
              fill="none"
              stroke="#60A5FA"
              strokeWidth="1.5"
              opacity="0.5"
            />
          ) : (
            <animated.path
              d={vectorSpring.angle.to(angle => getArcPath(angle))}
              fill="none"
              stroke="#60A5FA"
              strokeWidth="1.5"
              opacity="0.5"
            />
          )}

          {/* Angle label */}
          {latticeType === 'custom' ? (
            <animated.text
              x={customRotation.rotation.to(rotation => {
                const angle = getCustomAngle(rotation);
                const midAngle = (angle / 2) * Math.PI / 180;
                return centerX + (angleRadius + 12) * Math.cos(midAngle);
              })}
              y={customRotation.rotation.to(rotation => {
                const angle = getCustomAngle(rotation);
                const midAngle = (angle / 2) * Math.PI / 180;
                return centerY - (angleRadius + 12) * Math.sin(midAngle) + 3;
              })}
              className="fill-blue-400 text-[10px] font-medium"
              textAnchor="middle"
            >
              γ
            </animated.text>
          ) : (
            <animated.text
              x={vectorSpring.angle.to(angle => {
                const midAngle = (angle / 2) * Math.PI / 180;
                return centerX + (angleRadius + 12) * Math.cos(midAngle);
              })}
              y={vectorSpring.angle.to(angle => {
                const midAngle = (angle / 2) * Math.PI / 180;
                return centerY - (angleRadius + 12) * Math.sin(midAngle) + 3;
              })}
              className="fill-blue-400 text-[10px] font-medium"
              textAnchor="middle"
            >
              γ
            </animated.text>
          )}

          {/* Origin point */}
          <circle cx={centerX} cy={centerY} r="2.5" className="fill-gray-400" />

          {/* Vector a1 */}
          <animated.line
            x1={centerX}
            y1={centerY}
            x2={vectorSpring.a1x.to(x => centerX + x)}
            y2={vectorSpring.a1y.to(y => centerY - y)}
            stroke="#10B981"
            strokeWidth="2"
            markerEnd="url(#arrowhead-a1)"
          />
          
          {/* Vector a2 */}
          {latticeType === 'custom' ? (
            <animated.line
              x1={centerX}
              y1={centerY}
              x2={customRotation.rotation.to(rotation => {
                const vec = getCustomA2(rotation);
                return centerX + vec.x;
              })}
              y2={customRotation.rotation.to(rotation => {
                const vec = getCustomA2(rotation);
                return centerY - vec.y;
              })}
              stroke="#F59E0B"
              strokeWidth="2"
              markerEnd="url(#arrowhead-a2)"
            />
          ) : (
            <animated.line
              x1={centerX}
              y1={centerY}
              x2={vectorSpring.a2x.to(x => centerX + x)}
              y2={vectorSpring.a2y.to(y => centerY - y)}
              stroke="#F59E0B"
              strokeWidth="2"
              markerEnd="url(#arrowhead-a2)"
            />
          )}

          {/* Arrowheads */}
          <defs>
            <marker id="arrowhead-a1" markerWidth="8" markerHeight="8" refX="6" refY="2.5" orient="auto">
              <polygon points="0 0, 8 2.5, 0 5" fill="#10B981" />
            </marker>
            <marker id="arrowhead-a2" markerWidth="8" markerHeight="8" refX="6" refY="2.5" orient="auto">
              <polygon points="0 0, 8 2.5, 0 5" fill="#F59E0B" />
            </marker>
          </defs>

          {/* Labels */}
          <animated.text
            x={vectorSpring.a1x.to(x => centerX + x + 8)}
            y={vectorSpring.a1y.to(y => centerY - y + 3)}
            className="fill-green-400 text-xs font-medium"
          >
            a₁
          </animated.text>
          
          {latticeType === 'custom' ? (
            <animated.text
              x={customRotation.rotation.to(rotation => {
                const vec = getCustomA2(rotation);
                return centerX + vec.x + 8;
              })}
              y={customRotation.rotation.to(rotation => {
                const vec = getCustomA2(rotation);
                return centerY - vec.y + 3;
              })}
              className="fill-amber-400 text-xs font-medium"
            >
              a₂
            </animated.text>
          ) : (
            <animated.text
              x={vectorSpring.a2x.to(x => centerX + x + 8)}
              y={vectorSpring.a2y.to(y => centerY - y + 3)}
              className="fill-amber-400 text-xs font-medium"
            >
              a₂
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
