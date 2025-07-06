"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { scaleLinear } from "@visx/scale";
import { LinePath, Line } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Grid } from "@visx/grid";
import { useSpring, animated, config } from "@react-spring/web";
import { curveMonotoneX } from "@visx/curve";
import { Circle } from "@visx/shape";
import { LengthUnit } from "../../types/meepProjectTypes";
import { convertTime, convertFrequency, convertWavelength } from "../../utils/physicalUnitsHelper";

interface GaussianPulsePlotProps {
  frequency: number;
  pulseWidth: number;
  startTime: number;
  cutoff: number;
  amplitude: { real: number; imag: number };
  width?: number;
  height?: number;
  showUnits?: boolean;
  projectUnit?: LengthUnit;
  projectA?: number;
  assemblyDuration?: number;
}

type PlotDomain = 'time' | 'frequency' | 'spatial';

export const GaussianPulsePlot: React.FC<GaussianPulsePlotProps> = ({
  frequency,
  pulseWidth,
  startTime,
  cutoff,
  amplitude,
  width = 280,
  height = 160,
  showUnits = false,
  projectUnit = LengthUnit.NM,
  projectA = 1,
  assemblyDuration = 600,
}) => {
  const [currentDomain, setCurrentDomain] = useState<PlotDomain>('time');
  const [pendingDomain, setPendingDomain] = useState<PlotDomain | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const margin = { top: 20, right: 20, bottom: 35, left: 45 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Handle domain switch with proper sequencing
  const switchDomain = useCallback((newDomain: PlotDomain) => {
    if (newDomain === currentDomain) return;
    
    // Start transition immediately
    setIsTransitioning(true);
    setPendingDomain(newDomain);
    
    // Small delay to ensure transition state is applied
    setTimeout(() => {
      setCurrentDomain(newDomain);
      setHasAnimated(false);
      
      // Start animation after domain switch
      setTimeout(() => {
        setHasAnimated(true);
        setIsTransitioning(false);
        setPendingDomain(null);
      }, 50);
    }, 50);
  }, [currentDomain]);

  // Initial animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Ensure values are valid numbers
  const safeFrequency = isNaN(frequency) || frequency <= 0 ? 1 : frequency;
  const safePulseWidth = isNaN(pulseWidth) || pulseWidth <= 0 ? 0.1 : pulseWidth;
  const safeStartTime = isNaN(startTime) ? 0 : startTime;
  const safeCutoff = isNaN(cutoff) || cutoff <= 0 ? 5 : cutoff;
  const safeAmplitude = {
    real: isNaN(amplitude?.real) ? 1 : amplitude.real,
    imag: isNaN(amplitude?.imag) ? 0 : amplitude.imag
  };

  // Calculate amplitude magnitude
  const ampMagnitude = Math.sqrt(safeAmplitude.real ** 2 + safeAmplitude.imag ** 2);

  // Calculate derived values with safe inputs
  const peakTime = safeStartTime + safeCutoff * safePulseWidth;
  const endTime = peakTime + 3 * safePulseWidth;

  // Calculate spectral width for frequency domain
  const spectralWidth = 1 / (2 * Math.PI * safePulseWidth);
  const fwidth = 1 / safePulseWidth;
  
  // Calculate wavelength values for spatial domain
  const centralWavelength = 1 / safeFrequency;
  const spectralWidthWavelength = spectralWidth / (safeFrequency * safeFrequency); // dλ = df/f²

  // Generate time points
  const timePoints = useMemo(() => {
    const points = [];
    const dt = endTime / 200;
    for (let t = 0; t <= endTime; t += dt) {
      points.push(t);
    }
    return points;
  }, [endTime]);

  // Calculate envelope and carrier wave with safe values
  const envelopeData = useMemo(() => {
    return timePoints.map(t => ({
      t,
      value: gaussian(t, safePulseWidth, peakTime)
    }));
  }, [timePoints, safePulseWidth, peakTime]);

  const carrierData = useMemo(() => {
    return timePoints.map(t => {
      const env = gaussian(t, safePulseWidth, peakTime);
      const carrier = Math.cos(2 * Math.PI * safeFrequency * (t - peakTime));
      return {
        t,
        value: env * carrier * safeAmplitude.real
      };
    });
  }, [timePoints, safePulseWidth, peakTime, safeFrequency, safeAmplitude.real]);

  // Generate time domain data
  const timeData = useMemo(() => {
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

  // Generate frequency domain data
  const frequencyData = useMemo(() => {
    const points = [];
    const fMin = Math.max(0, frequency - 5 * spectralWidth);
    const fMax = frequency + 5 * spectralWidth;
    const steps = 200;
    
    for (let i = 0; i <= steps; i++) {
      const f = fMin + (i / steps) * (fMax - fMin);
      
      // Gaussian spectrum centered at carrier frequency
      const deltaF = f - frequency;
      const spectrum = ampMagnitude * pulseWidth * Math.sqrt(2 * Math.PI) * 
        Math.exp(-deltaF * deltaF / (2 * spectralWidth * spectralWidth));
      
      points.push({
        f,
        spectrum,
        phase: 0, // Simplified phase representation
      });
    }
    
    return points;
  }, [frequency, pulseWidth, ampMagnitude, spectralWidth]);

  // Generate spatial domain data
  const spatialData = useMemo(() => {
    const points = [];
    // Center around the central wavelength
    const lambdaMin = Math.max(0.1, centralWavelength - 5 * spectralWidthWavelength);
    const lambdaMax = centralWavelength + 5 * spectralWidthWavelength;
    const steps = 200;
    
    for (let i = 0; i <= steps; i++) {
      const lambda = lambdaMin + (i / steps) * (lambdaMax - lambdaMin);
      const f = 1 / lambda; // frequency from wavelength
      
      // Gaussian spectrum in frequency domain, transformed to wavelength domain
      const deltaF = f - frequency;
      const spectrumF = ampMagnitude * pulseWidth * Math.sqrt(2 * Math.PI) * 
        Math.exp(-deltaF * deltaF / (2 * spectralWidth * spectralWidth));
      
      // Jacobian for f → λ transformation: |df/dλ| = 1/λ²
      const spectrum = spectrumF / (lambda * lambda);
      
      points.push({
        lambda,
        spectrum,
      });
    }
    
    return points;
  }, [frequency, pulseWidth, ampMagnitude, spectralWidth, centralWavelength, spectralWidthWavelength]);

  // Choose data based on domain
  const data = currentDomain === 'time' ? timeData : 
               currentDomain === 'frequency' ? frequencyData : spatialData;

  // Scales for time domain
  const xScaleTime = scaleLinear({
    domain: [Math.max(0, startTime - pulseWidth * 2), endTime + pulseWidth * 2],
    range: [0, innerWidth],
  });

  const yScaleTime = scaleLinear({
    domain: [-ampMagnitude * 1.2, ampMagnitude * 1.2],
    range: [innerHeight, 0],
  });

  // Scales for frequency domain
  const xScaleFreq = scaleLinear({
    domain: [Math.max(0, frequency - 5 * spectralWidth), frequency + 5 * spectralWidth],
    range: [0, innerWidth],
  });

  const yScaleFreq = scaleLinear({
    domain: [0, ampMagnitude * pulseWidth * Math.sqrt(2 * Math.PI) * 1.2],
    range: [innerHeight, 0],
  });

  // Scales for spatial domain
  const xScaleSpatial = scaleLinear({
    domain: [Math.max(0.1, centralWavelength - 5 * spectralWidthWavelength), 
             centralWavelength + 5 * spectralWidthWavelength],
    range: [0, innerWidth],
  });

  const yScaleSpatial = scaleLinear({
    domain: [0, Math.max(...spatialData.map(d => d.spectrum)) * 1.2],
    range: [innerHeight, 0],
  });

  // Use the pending domain for scale calculations during transition
  const effectiveDomain = pendingDomain !== null ? pendingDomain : currentDomain;
  const xScale = effectiveDomain === 'time' ? xScaleTime : 
                 effectiveDomain === 'frequency' ? xScaleFreq : xScaleSpatial;
  const yScale = effectiveDomain === 'time' ? yScaleTime : 
                 effectiveDomain === 'frequency' ? yScaleFreq : yScaleSpatial;

  // Animation spring for drawing lines progressively
  const drawAnimation = useSpring({
    from: { progress: 0 },
    to: { progress: hasAnimated ? 1 : 0 },
    config: { duration: assemblyDuration, easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t },
    reset: !hasAnimated,
  });

  // Animation for vertical lines - they grow from bottom to top
  const verticalLineAnimation = useSpring({
    from: { progress: 0 },
    to: { progress: hasAnimated ? 1 : 0 },
    config: { duration: assemblyDuration * 0.75, delay: assemblyDuration * 0.25 }, // Start after main lines begin drawing
    reset: !hasAnimated,
  });

  // Animation for labels - fade in with slight upward movement
  const labelAnimation = useSpring({
    from: { opacity: 0, y: 5 },
    to: { opacity: hasAnimated ? 1 : 0, y: hasAnimated ? 0 : 5 },
    config: { duration: assemblyDuration * 0.5, delay: assemblyDuration * 0.75 }, // Start after vertical lines
    reset: !hasAnimated,
  });

  // Helper function to get a subset of data based on animation progress
  const getAnimatedData = (data: any[], progress: number) => {
    const endIndex = Math.floor(data.length * progress);
    return data.slice(0, endIndex);
  };

  // Animate transitions for markers
  const springProps = useSpring({
    peakTimeX: xScaleTime(peakTime),
    startTimeX: xScaleTime(startTime),
    endTimeX: xScaleTime(endTime),
    freqCenterX: xScaleFreq(frequency),
    freqWidthX1: xScaleFreq(frequency - spectralWidth),
    freqWidthX2: xScaleFreq(frequency + spectralWidth),
    lambdaCenterX: xScaleSpatial(centralWavelength),
    lambdaWidthX1: xScaleSpatial(centralWavelength - spectralWidthWavelength),
    lambdaWidthX2: xScaleSpatial(centralWavelength + spectralWidthWavelength),
    config: { tension: 120, friction: 14 },
  });

  // Helper function to format axis tick labels (without units)
  const formatAxisValue = (value: number, domain: PlotDomain = 'time'): string => {
    if (!showUnits) {
      // Scale-free display
      if (Math.abs(value) >= 1000) {
        return value.toExponential(1);
      } else if (Math.abs(value) < 0.01 && value !== 0) {
        return value.toExponential(1);
      }
      return value.toFixed(2);
    } else {
      // Physical units display - extract just the number part
      if (domain === 'time') {
        const converted = convertTime(value, projectA, projectUnit);
        const match = converted.match(/^([\d.]+)\s*(.*)$/);
        if (match) {
          const num = parseFloat(match[1]);
          if (num >= 100) {
            return num.toFixed(0);
          } else if (num >= 10) {
            return num.toFixed(1);
          } else if (num >= 1) {
            return num.toFixed(2);
          }
          return match[1]; // Return just the number
        }
      } else if (domain === 'frequency') {
        const converted = convertFrequency(value, projectA, projectUnit);
        const match = converted.match(/^([\d.]+)\s*(.*)$/);
        if (match) {
          const num = parseFloat(match[1]);
          if (num >= 100) {
            return num.toFixed(0);
          } else if (num >= 10) {
            return num.toFixed(1);
          } else if (num >= 1) {
            return num.toFixed(2);
          }
          return match[1]; // Return just the number
        }
      } else if (domain === 'spatial') {
        const converted = convertWavelength(value, projectA, projectUnit);
        const match = converted.match(/^([\d.]+)\s*(.*)$/);
        if (match) {
          const num = parseFloat(match[1]);
          if (num >= 100) {
            return num.toFixed(0);
          } else if (num >= 10) {
            return num.toFixed(1);
          } else if (num >= 1) {
            return num.toFixed(2);
          }
          return match[1]; // Return just the number
        }
      }
      return value.toFixed(2);
    }
  };

  // Calculate optimal number of ticks based on available width
  const calculateOptimalTicks = (scale: any, availableWidth: number): number => {
    const domain = scale.domain();
    const range = domain[1] - domain[0];
    
    // Estimate tick label width (assumes ~8px per character on average)
    const sampleValue = domain[1];
    const formattedSample = formatAxisValue(sampleValue, currentDomain);
    const estimatedLabelWidth = formattedSample.length * 8 + 10; // +10 for padding
    
    // Calculate maximum ticks that can fit
    const maxTicks = Math.floor(availableWidth / estimatedLabelWidth);
    
    // Set bounds: minimum 3 ticks, maximum 8 ticks
    const minTicks = 3;
    const maxAllowedTicks = 8;
    
    // Choose optimal number
    let optimalTicks = Math.min(maxTicks, maxAllowedTicks);
    optimalTicks = Math.max(optimalTicks, minTicks);
    
    return optimalTicks;
  };

  const xTickCount = useMemo(() => {
    return calculateOptimalTicks(xScale, innerWidth);
  }, [xScale, innerWidth, currentDomain]);

  // Get axis labels
  const getTimeAxisLabel = () => {
    if (!showUnits) {
      return "Time (t)";
    } else {
      // Get the unit from a sample conversion
      const sampleTime = convertTime(1, projectA, projectUnit);
      const unitMatch = sampleTime.match(/\s+(.+)$/);
      return `Time (${unitMatch ? unitMatch[1] : 't'})`;
    }
  };

  const getFrequencyAxisLabel = () => {
    if (!showUnits) {
      return "Frequency (ω)";
    } else {
      // Get the unit from a sample conversion
      const sampleFreq = convertFrequency(1, projectA, projectUnit);
      const unitMatch = sampleFreq.match(/\s+(.+)$/);
      return `Frequency (${unitMatch ? unitMatch[1] : 'ω'})`;
    }
  };

  const getWavelengthAxisLabel = () => {
    if (!showUnits) {
      return "Wavelength (λ)";
    } else {
      // Get the unit from a sample conversion
      const sampleWavelength = convertWavelength(1, projectA, projectUnit);
      const unitMatch = sampleWavelength.match(/\s+(.+)$/);
      return `Wavelength (${unitMatch ? unitMatch[1] : 'λ'})`;
    }
  };

  return (
    <div>
      {/* Domain toggle buttons */}
      <div className="flex w-full gap-1 mb-2">
        <button
          onClick={() => switchDomain('time')}
          className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
            currentDomain === 'time'
              ? "bg-neutral-600 text-white" 
              : "bg-neutral-700/30 text-gray-400 hover:bg-neutral-700/50"
          }`}
        >
          Time
        </button>
        <button
          onClick={() => switchDomain('frequency')}
          className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
            currentDomain === 'frequency'
              ? "bg-neutral-600 text-white" 
              : "bg-neutral-700/30 text-gray-400 hover:bg-neutral-700/50"
          }`}
        >
          Frequency
        </button>
        <button
          onClick={() => switchDomain('spatial')}
          className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
            currentDomain === 'spatial'
              ? "bg-neutral-600 text-white" 
              : "bg-neutral-700/30 text-gray-400 hover:bg-neutral-700/50"
          }`}
        >
          Spatial
        </button>
      </div>

      <svg width={width} height={height} style={{ cursor: 'default' }}>
        <defs>
          <clipPath id="plot-area">
            <rect x={0} y={0} width={innerWidth} height={innerHeight} />
          </clipPath>
          <mask id="line-reveal-mask">
            <animated.rect
              x={0}
              y={0}
              width={drawAnimation.progress.to(p => innerWidth * p)}
              height={innerHeight}
              fill="white"
            />
          </mask>
        </defs>
        
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Grid - hide during transition */}
          {!isTransitioning && (
            <Grid
              xScale={xScale}
              yScale={yScale}
              width={innerWidth}
              height={innerHeight}
              stroke="#374151"
              strokeOpacity={0.3}
              strokeDasharray="2,2"
              numTicksRows={5}
              numTicksColumns={xTickCount}
            />
          )}
          
          {/* Axes - hide during transition */}
          {!isTransitioning && (
            <>
              <AxisBottom
                scale={xScale}
                top={innerHeight}
                stroke="#9CA3AF"
                tickStroke="#9CA3AF"
                numTicks={xTickCount}
                tickFormat={(value) => formatAxisValue(value as number, currentDomain)}
                tickLabelProps={() => ({
                  fill: "#9CA3AF",
                  fontSize: 10,
                  textAnchor: "middle",
                  style: { userSelect: 'none', cursor: 'default' },
                })}
              />
              <AxisLeft
                scale={yScale}
                stroke="#9CA3AF"
                tickStroke="#9CA3AF"
                numTicks={5}
                tickLabelProps={() => ({
                  fill: "#9CA3AF",
                  fontSize: 10,
                  textAnchor: "end",
                  dy: "0.3em",
                  style: { userSelect: 'none', cursor: 'default' },
                })}
              />
            </>
          )}
          
          {/* Axis labels - hide during transition */}
          {!isTransitioning && (
            <>
              <text
                x={innerWidth / 2}
                y={innerHeight + 30}
                textAnchor="middle"
                fontSize={11}
                fill="#9CA3AF"
                style={{ userSelect: 'none', cursor: 'default' }}
              >
                {currentDomain === 'time' ? getTimeAxisLabel() : 
                 currentDomain === 'frequency' ? getFrequencyAxisLabel() : getWavelengthAxisLabel()}
              </text>
              <text
                transform={`translate(-35, ${innerHeight / 2}) rotate(-90)`}
                textAnchor="middle"
                fontSize={11}
                fill="#9CA3AF"
                style={{ userSelect: 'none', cursor: 'default' }}
              >
                {currentDomain === 'time' ? "Amplitude" : "Spectral Magnitude"}
              </text>
            </>
          )}
          
          {/* Plot area */}
          <g clipPath="url(#plot-area)">
            {!isTransitioning && (
              <>
                {currentDomain === 'time' ? (
                  <g mask="url(#line-reveal-mask)">
                    {/* Gaussian envelope */}
                    <LinePath
                      data={timeData}
                      x={(d) => xScale(d.t)}
                      y={(d) => yScale(d.envelope)}
                      stroke="#10B981"
                      strokeWidth={1.5}
                      strokeOpacity={0.5}
                      strokeDasharray="4,2"
                      curve={curveMonotoneX}
                    />
                    <LinePath
                      data={timeData}
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
                      data={timeData}
                      x={(d) => xScale(d.t)}
                      y={(d) => yScale(d.signal)}
                      stroke="#60A5FA"
                      strokeWidth={2}
                      curve={curveMonotoneX}
                    />
                  </g>
                ) : currentDomain === 'frequency' ? (
                  <g mask="url(#line-reveal-mask)">
                    {/* Frequency domain visualization */}
                    <LinePath
                      data={frequencyData}
                      x={(d) => xScaleFreq(d.f)}
                      y={(d) => yScaleFreq(d.spectrum)}
                      stroke="#60A5FA"
                      strokeWidth={2}
                      curve={curveMonotoneX}
                    />
                  </g>
                ) : (
                  <g mask="url(#line-reveal-mask)">
                    {/* Spatial domain visualization */}
                    <LinePath
                      data={spatialData}
                      x={(d) => xScaleSpatial(d.lambda)}
                      y={(d) => yScaleSpatial(d.spectrum)}
                      stroke="#60A5FA"
                      strokeWidth={2}
                      curve={curveMonotoneX}
                    />
                  </g>
                )}
              </>
            )}
            
            {/* Markers with animated assembly */}
            {!isTransitioning && (
              <>
                {currentDomain === 'time' ? (
                  <>
                    {/* Time markers - grow from bottom to top */}
                    <animated.line
                      x1={springProps.startTimeX}
                      y1={innerHeight}
                      x2={springProps.startTimeX}
                      y2={verticalLineAnimation.progress.to(p => innerHeight * (1 - p))}
                      stroke="#F59E0B"
                      strokeWidth={1.5}
                      strokeDasharray="3,3"
                      opacity={verticalLineAnimation.progress}
                    />
                    
                    <animated.line
                      x1={springProps.peakTimeX}
                      y1={innerHeight}
                      x2={springProps.peakTimeX}
                      y2={verticalLineAnimation.progress.to(p => innerHeight * (1 - p))}
                      stroke="#EF4444"
                      strokeWidth={2}
                      opacity={verticalLineAnimation.progress}
                    />
                    
                    <animated.line
                      x1={springProps.endTimeX}
                      y1={innerHeight}
                      x2={springProps.endTimeX}
                      y2={verticalLineAnimation.progress.to(p => innerHeight * (1 - p))}
                      stroke="#F59E0B"
                      strokeWidth={1.5}
                      strokeDasharray="3,3"
                      opacity={verticalLineAnimation.progress.to(p => p * 0.5)}
                    />
                  </>
                ) : currentDomain === 'frequency' ? (
                  <>
                    {/* Center frequency marker - grows from center outward */}
                    <animated.g opacity={verticalLineAnimation.progress}>
                      <animated.line
                        x1={springProps.freqCenterX}
                        y1={verticalLineAnimation.progress.to(p => innerHeight / 2 - (innerHeight / 2) * p)}
                        x2={springProps.freqCenterX}
                        y2={verticalLineAnimation.progress.to(p => innerHeight / 2 + (innerHeight / 2) * p)}
                        stroke="#EF4444"
                        strokeWidth={2}
                      />
                    </animated.g>
                    
                    {/* Spectral width indicators - grow from center outward */}
                    <animated.g opacity={verticalLineAnimation.progress}>
                      <animated.line
                        x1={springProps.freqWidthX1}
                        y1={verticalLineAnimation.progress.to(p => innerHeight / 2 - (innerHeight / 2) * p)}
                        x2={springProps.freqWidthX1}
                        y2={verticalLineAnimation.progress.to(p => innerHeight / 2 + (innerHeight / 2) * p)}
                        stroke="#A78BFA"
                        strokeWidth={1.5}
                        strokeDasharray="3,3"
                      />
                      <animated.line
                        x1={springProps.freqWidthX2}
                        y1={verticalLineAnimation.progress.to(p => innerHeight / 2 - (innerHeight / 2) * p)}
                        x2={springProps.freqWidthX2}
                        y2={verticalLineAnimation.progress.to(p => innerHeight / 2 + (innerHeight / 2) * p)}
                        stroke="#A78BFA"
                        strokeWidth={1.5}
                        strokeDasharray="3,3"
                      />
                    </animated.g>
                  </>
                ) : (
                  <>
                    {/* Center wavelength marker - grows from center outward */}
                    <animated.g opacity={verticalLineAnimation.progress}>
                      <animated.line
                        x1={springProps.lambdaCenterX}
                        y1={verticalLineAnimation.progress.to(p => innerHeight / 2 - (innerHeight / 2) * p)}
                        x2={springProps.lambdaCenterX}
                        y2={verticalLineAnimation.progress.to(p => innerHeight / 2 + (innerHeight / 2) * p)}
                        stroke="#EF4444"
                        strokeWidth={2}
                      />
                    </animated.g>
                    
                    {/* Spectral width indicators - grow from center outward */}
                    <animated.g opacity={verticalLineAnimation.progress}>
                      <animated.line
                        x1={springProps.lambdaWidthX1}
                        y1={verticalLineAnimation.progress.to(p => innerHeight / 2 - (innerHeight / 2) * p)}
                        x2={springProps.lambdaWidthX1}
                        y2={verticalLineAnimation.progress.to(p => innerHeight / 2 + (innerHeight / 2) * p)}
                        stroke="#A78BFA"
                        strokeWidth={1.5}
                        strokeDasharray="3,3"
                      />
                      <animated.line
                        x1={springProps.lambdaWidthX2}
                        y1={verticalLineAnimation.progress.to(p => innerHeight / 2 - (innerHeight / 2) * p)}
                        x2={springProps.lambdaWidthX2}
                        y2={verticalLineAnimation.progress.to(p => innerHeight / 2 + (innerHeight / 2) * p)}
                        stroke="#A78BFA"
                        strokeWidth={1.5}
                        strokeDasharray="3,3"
                      />
                    </animated.g>
                  </>
                )}
              </>
            )}
          </g>
          
          {/* Labels with fade and slide animation */}
          {!isTransitioning && (
            <>
              {currentDomain === 'time' ? (
                <>
                  <animated.text
                    x={springProps.startTimeX}
                    y={labelAnimation.y.to(y => -5 - y)}
                    fontSize={10}
                    fill="#F59E0B"
                    textAnchor="middle"
                    opacity={labelAnimation.opacity}
                    style={{ userSelect: 'none', cursor: 'default' }}
                  >
                    start
                  </animated.text>
                  <animated.text
                    x={springProps.peakTimeX}
                    y={labelAnimation.y.to(y => -5 - y)}
                    fontSize={10}
                    fill="#EF4444"
                    textAnchor="middle"
                    opacity={labelAnimation.opacity}
                    style={{ userSelect: 'none', cursor: 'default' }}
                  >
                    peak
                  </animated.text>
                </>
              ) : currentDomain === 'frequency' ? (
                <>
                  <animated.text
                    x={springProps.freqCenterX}
                    y={labelAnimation.y.to(y => -5 - y)}
                    fontSize={10}
                    fill="#EF4444"
                    textAnchor="middle"
                    opacity={labelAnimation.opacity}
                    style={{ userSelect: 'none', cursor: 'default' }}
                  >
                    {showUnits 
                      ? `f₀ = ${convertFrequency(frequency, projectA, projectUnit)}`
                      : "ω₀"}
                  </animated.text>
                  {/* Spectral width legend in top right - fade in */}
                  <animated.text
                    x={innerWidth - 5}
                    y={15}
                    fontSize={10}
                    fill="#A78BFA"
                    textAnchor="end"
                    opacity={labelAnimation.opacity}
                    style={{ userSelect: 'none', cursor: 'default' }}
                  >
                    {showUnits 
                      ? `Δf = ${convertFrequency(spectralWidth, projectA, projectUnit)}`
                      : `Δω = ${spectralWidth.toFixed(3)}`
                    }
                  </animated.text>
                </>
              ) : (
                <>
                  <animated.text
                    x={springProps.lambdaCenterX}
                    y={labelAnimation.y.to(y => -5 - y)}
                    fontSize={10}
                    fill="#EF4444"
                    textAnchor="middle"
                    opacity={labelAnimation.opacity}
                    style={{ userSelect: 'none', cursor: 'default' }}
                  >
                    {showUnits 
                      ? `λ₀ = ${convertWavelength(centralWavelength, projectA, projectUnit)}`
                      : `λ₀ = ${centralWavelength.toFixed(3)}`}
                  </animated.text>
                  {/* Spectral width legend in top right - fade in */}
                  <animated.text
                    x={innerWidth - 5}
                    y={15}
                    fontSize={10}
                    fill="#A78BFA"
                    textAnchor="end"
                    opacity={labelAnimation.opacity}
                    style={{ userSelect: 'none', cursor: 'default' }}
                  >
                    {showUnits 
                      ? `Δλ = ${convertWavelength(spectralWidthWavelength, projectA, projectUnit)}`
                      : `Δλ = ${spectralWidthWavelength.toFixed(3)}`
                    }
                  </animated.text>
                </>
              )}
            </>
          )}
        </g>
      </svg>
    </div>
  );
};

function gaussian(x: number, width: number, t0: number) {
  return Math.exp(-Math.pow(x - t0, 2) / (2 * Math.pow(width, 2)));
}
