"use client";

import React, { useMemo } from "react";
import { scaleLinear } from "@visx/scale";
import { LinePath, Line } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Grid } from "@visx/grid";
import { useSpring, animated } from "@react-spring/web";
import { curveMonotoneX } from "@visx/curve";
import { Circle } from "@visx/shape";

interface GaussianPulsePlotProps {
  frequency: number;
  pulseWidth: number;
  startTime: number;
  cutoff: number;
  amplitude: { real: number; imag: number };
  width?: number;
  height?: number;
}

export const GaussianPulsePlot: React.FC<GaussianPulsePlotProps> = ({
  frequency,
  pulseWidth,
  startTime,
  cutoff,
  amplitude,
  width = 280,
  height = 160,
}) => {
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Calculate derived values
  const peakTime = startTime + cutoff * pulseWidth;
  const endTime = startTime + 2 * cutoff * pulseWidth;
  const ampMagnitude = Math.sqrt(amplitude.real ** 2 + amplitude.imag ** 2);

  // Generate data points
  const data = useMemo(() => {
    const points = [];
    const tMin = Math.max(0, startTime - pulseWidth * 2);
    const tMax = endTime + pulseWidth * 2;
    const steps = 200;
    
    for (let i = 0; i <= steps; i++) {
      const t = tMin + (i / steps) * (tMax - tMin);
      
      // Gaussian envelope: A * exp(-((t - t0 - cutoff*width)^2) / (2*width^2))
      const envelope = t >= startTime 
        ? ampMagnitude * Math.exp(-Math.pow(t - peakTime, 2) / (2 * Math.pow(pulseWidth, 2)))
        : 0;
      
      // Carrier wave
      const carrier = Math.cos(2 * Math.PI * frequency * t);
      
      points.push({
        t,
        envelope,
        negEnvelope: -envelope,
        signal: envelope * carrier,
      });
    }
    
    return points;
  }, [frequency, pulseWidth, startTime, cutoff, ampMagnitude, peakTime, endTime]);

  // Scales
  const xScale = scaleLinear({
    domain: [Math.max(0, startTime - pulseWidth * 2), endTime + pulseWidth * 2],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [-ampMagnitude * 1.2, ampMagnitude * 1.2],
    range: [innerHeight, 0],
  });

  // Animate transitions
  const springProps = useSpring({
    peakTimeX: xScale(peakTime),
    startTimeX: xScale(startTime),
    endTimeX: xScale(endTime),
    widthMarkerX1: xScale(peakTime - pulseWidth),
    widthMarkerX2: xScale(peakTime + pulseWidth),
    config: { tension: 120, friction: 14 },
  });

  return (
    <svg width={width} height={height}>
      <defs>
        <clipPath id="plot-area">
          <rect x={0} y={0} width={innerWidth} height={innerHeight} />
        </clipPath>
      </defs>
      
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Grid */}
        <Grid
          xScale={xScale}
          yScale={yScale}
          width={innerWidth}
          height={innerHeight}
          stroke="#374151"
          strokeOpacity={0.3}
          strokeDasharray="2,2"
        />
        
        {/* Axes */}
        <AxisBottom
          scale={xScale}
          top={innerHeight}
          stroke="#9CA3AF"
          tickStroke="#9CA3AF"
          tickLabelProps={() => ({
            fill: "#9CA3AF",
            fontSize: 10,
            textAnchor: "middle",
          })}
        />
        <AxisLeft
          scale={yScale}
          stroke="#9CA3AF"
          tickStroke="#9CA3AF"
          tickLabelProps={() => ({
            fill: "#9CA3AF",
            fontSize: 10,
            textAnchor: "end",
            dy: "0.3em",
          })}
        />
        
        {/* Plot area */}
        <g clipPath="url(#plot-area)">
          {/* Gaussian envelope */}
          <LinePath
            data={data}
            x={(d) => xScale(d.t)}
            y={(d) => yScale(d.envelope)}
            stroke="#10B981"
            strokeWidth={1.5}
            strokeOpacity={0.5}
            strokeDasharray="4,2"
            curve={curveMonotoneX}
          />
          <LinePath
            data={data}
            x={(d) => xScale(d.t)}
            y={(d) => yScale(d.negEnvelope)}
            stroke="#10B981"
            strokeWidth={1.5}
            strokeOpacity={0.5}
            strokeDasharray="4,2"
            curve={curveMonotoneX}
          />
          
          {/* Signal */}
          <LinePath
            data={data}
            x={(d) => xScale(d.t)}
            y={(d) => yScale(d.signal)}
            stroke="#60A5FA"
            strokeWidth={2}
            curve={curveMonotoneX}
          />
          
          {/* Start time marker */}
          <animated.line
            x1={springProps.startTimeX}
            y1={0}
            x2={springProps.startTimeX}
            y2={innerHeight}
            stroke="#F59E0B"
            strokeWidth={1.5}
            strokeDasharray="3,3"
          />
          
          {/* Peak time marker */}
          <animated.line
            x1={springProps.peakTimeX}
            y1={0}
            x2={springProps.peakTimeX}
            y2={innerHeight}
            stroke="#EF4444"
            strokeWidth={2}
          />
          
          {/* End time marker */}
          <animated.line
            x1={springProps.endTimeX}
            y1={0}
            x2={springProps.endTimeX}
            y2={innerHeight}
            stroke="#F59E0B"
            strokeWidth={1.5}
            strokeDasharray="3,3"
            opacity={0.5}
          />
          
          {/* Width indicator */}
          <animated.g transform={`translate(0, ${yScale(0)})`}>
            <animated.line
              x1={springProps.widthMarkerX1}
              y1={0}
              x2={springProps.widthMarkerX2}
              y2={0}
              stroke="#A78BFA"
              strokeWidth={2}
              markerStart="url(#width-marker-start)"
              markerEnd="url(#width-marker-end)"
            />
          </animated.g>
        </g>
        
        {/* Markers */}
        <defs>
          <marker
            id="width-marker-start"
            markerWidth="8"
            markerHeight="8"
            refX="8"
            refY="4"
            orient="auto"
          >
            <path d="M8,4 L0,0 L0,8 Z" fill="#A78BFA" />
          </marker>
          <marker
            id="width-marker-end"
            markerWidth="8"
            markerHeight="8"
            refX="0"
            refY="4"
            orient="auto"
          >
            <path d="M0,4 L8,0 L8,8 Z" fill="#A78BFA" />
          </marker>
        </defs>
        
        {/* Labels */}
        <animated.text
          x={springProps.startTimeX}
          y={-5}
          fontSize={10}
          fill="#F59E0B"
          textAnchor="middle"
        >
          start
        </animated.text>
        <animated.text
          x={springProps.peakTimeX}
          y={-5}
          fontSize={10}
          fill="#EF4444"
          textAnchor="middle"
        >
          peak
        </animated.text>
        <animated.text
          x={springProps.peakTimeX}
          y={yScale(0) + 15}
          fontSize={10}
          fill="#A78BFA"
          textAnchor="middle"
        >
          width
        </animated.text>
      </g>
    </svg>
  );
};
