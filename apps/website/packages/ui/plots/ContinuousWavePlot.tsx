"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Grid } from "@visx/grid";
import { useSpring, animated } from "@react-spring/web";
import { curveMonotoneX } from "@visx/curve";
import { LengthUnit } from "../../types/meepProjectTypes";
import { convertTime, convertFrequency, convertWavelength } from "../../utils/physicalUnitsHelper";

interface ContinuousWavePlotProps {
  frequency: number;
  startTime: number;
  endTime: number;
  width: number; // smoothing width
  slowness?: number; // slowness parameter for tanh function
  amplitude: { real: number; imag: number };
  plotWidth?: number;
  plotHeight?: number;
  showUnits?: boolean;
  projectUnit?: LengthUnit;
  projectA?: number;
  assemblyDuration?: number;
}

type PlotDomain = 'time' | 'frequency' | 'spatial';

export const ContinuousWavePlot: React.FC<ContinuousWavePlotProps> = ({
  frequency,
  startTime,
  endTime,
  width,
  slowness = 3.0,
  amplitude,
  plotWidth = 280,
  plotHeight = 160,
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
  const innerWidth = plotWidth - margin.left - margin.right;
  const innerHeight = plotHeight - margin.top - margin.bottom;

  // Handle domain switch with proper sequencing
  const switchDomain = useCallback((newDomain: PlotDomain) => {
    if (newDomain === currentDomain) return;
    
    setIsTransitioning(true);
    setPendingDomain(newDomain);
    
    setTimeout(() => {
      setCurrentDomain(newDomain);
      setHasAnimated(false);
      
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
  const safeStartTime = isNaN(startTime) ? 0 : startTime;
  const safeEndTime = isNaN(endTime) || endTime >= 1e20 ? Infinity : endTime;
  const safeWidth = isNaN(width) || width < 0 ? 0 : width;
  const safeSlowness = isNaN(slowness) || slowness < 1 ? 3.0 : slowness;
  const safeAmplitude = {
    real: isNaN(amplitude?.real) ? 1 : amplitude.real,
    imag: isNaN(amplitude?.imag) ? 0 : amplitude.imag
  };

  // Calculate amplitude magnitude
  const ampMagnitude = Math.sqrt(safeAmplitude.real ** 2 + safeAmplitude.imag ** 2);

  // Calculate wavelength for display
  const wavelength = safeFrequency > 0 ? 1 / safeFrequency : 0;
  
  // Calculate wavelength values for spatial domain
  const centralWavelength = 1 / safeFrequency;

  // Helper function to format values
  const formatValue = (value: number, decimals: number = 2) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Calculate time range for plot
  // When width × slowness is large, we need more time range to see the turn-on
  const turnOnTime = safeWidth * safeSlowness;
  // For slow turn-on, we need to go further back to see the rise
  // The signal reaches ~95% at t = startTime + width * (slowness + 2)
  const timeToReach95Percent = safeWidth * (safeSlowness + 2);
  const plotStartTime = Math.max(0, safeStartTime - Math.max(timeToReach95Percent, turnOnTime * 3, 1));
  const plotEndTime = isFinite(safeEndTime) 
    ? safeEndTime + Math.max(timeToReach95Percent, turnOnTime * 3, 1)
    : safeStartTime + 10 / safeFrequency; // Show 10 periods if infinite

  // Generate time domain data
  const timeData = useMemo(() => {
    const points = [];
    const steps = 400;
    const dt = (plotEndTime - plotStartTime) / steps;
    
    for (let i = 0; i <= steps; i++) {
      const t = plotStartTime + i * dt;
      
      // Hyperbolic tangent turn-on/off envelope as per Meep documentation
      let envelope = 0;
      if (safeWidth > 0) {
        // Smooth turn-on: (1 + tanh(t/width - slowness))/2
        // Note: t is relative to startTime for turn-on
        if (t >= safeStartTime) {
          const turnOnArg = (t - safeStartTime) / safeWidth - safeSlowness;
          const turnOnFactor = (1 + Math.tanh(turnOnArg)) / 2;
          
          // Turn-off phase (if endTime is finite)
          let turnOffFactor = 1;
          if (isFinite(safeEndTime) && t >= safeEndTime) {
            // For turn-off, we use negative argument to create decay
            const turnOffArg = -(t - safeEndTime) / safeWidth - safeSlowness;
            turnOffFactor = (1 + Math.tanh(turnOffArg)) / 2;
          }
          
          envelope = ampMagnitude * turnOnFactor * turnOffFactor;
        }
      } else {
        // No smoothing - sharp on/off
        envelope = (t >= safeStartTime && (!isFinite(safeEndTime) || t <= safeEndTime)) ? ampMagnitude : 0;
      }
      
      // Carrier wave
      const carrier = Math.cos(2 * Math.PI * safeFrequency * t);
      
      points.push({
        t,
        envelope,
        negEnvelope: -envelope,
        signal: envelope * carrier,
      });
    }
    
    return points;
  }, [safeFrequency, safeStartTime, safeEndTime, safeWidth, safeSlowness, ampMagnitude, plotStartTime, plotEndTime]);

  // ---- frequency-domain helpers -----------------------------------------
  // ---- frequency-domain helpers -----------------------------------------
  const effectiveTimeConstant = safeWidth > 0 ? safeWidth * safeSlowness : 0.1;
  const sigma        = 1 / (2 * Math.PI * effectiveTimeConstant);   // previously spectralWidth
  const fwhmBandwidth = 2 * Math.sqrt(2 * Math.log(2)) * sigma;     // Δf  (FWHM)
  
  // Calculate wavelength values for spatial domain
  const spectralWidthWavelength = sigma / (safeFrequency * safeFrequency); // dλ = df/f²
  // Generate frequency-domain data
  const frequencyData = useMemo(() => {
    const points = [];
    const fMin = Math.max(0, safeFrequency * 0.8);
    const fMax = safeFrequency * 1.2;
    const steps = 200;
    
    for (let i = 0; i <= steps; i++) {
      const f = fMin + (i / steps) * (fMax - fMin);
      
      let spectrum;
      if (safeWidth === 0) {
        // When width is 0, we have infinite spectral width - show flat line at amplitude level
        spectrum = ampMagnitude;
      } else {
        // For non-zero width, show Gaussian spectrum
        const deltaF = f - safeFrequency;
        spectrum = ampMagnitude * Math.exp(-deltaF * deltaF / (2 * sigma * sigma));
      }
      
      points.push({
        f,
        spectrum,
      });
    }
    
    return points;
  }, [safeFrequency, safeWidth, safeSlowness, ampMagnitude, sigma]);

  // Generate spatial domain data
  const spatialData = useMemo(() => {
    const points = [];
    // Center around the central wavelength
    const lambdaMin = Math.max(0.1, centralWavelength * 0.8);
    const lambdaMax = centralWavelength * 1.2;
    const steps = 200;
    
    for (let i = 0; i <= steps; i++) {
      const lambda = lambdaMin + (i / steps) * (lambdaMax - lambdaMin);
      const f = 1 / lambda; // frequency from wavelength
      
      let spectrumF;
      if (safeWidth === 0) {
        // When width is 0, we have infinite spectral width - show flat line
        spectrumF = ampMagnitude;
      } else {
        // Gaussian spectrum in frequency domain
        const deltaF = f - safeFrequency;
        spectrumF = ampMagnitude * Math.exp(-deltaF * deltaF / (2 * sigma * sigma));
      }
      
      // Jacobian for f → λ transformation: |df/dλ| = 1/λ²
      const spectrum = spectrumF / (lambda * lambda);
      
      points.push({
        lambda,
        spectrum,
      });
    }
    
    return points;
  }, [safeFrequency, safeWidth, ampMagnitude, sigma, centralWavelength]);

  // Choose data based on domain
  const data = currentDomain === 'time' ? timeData : 
               currentDomain === 'frequency' ? frequencyData : spatialData;

  // Scales for time domain
  const xScaleTime = scaleLinear({
    domain: [plotStartTime, plotEndTime],
    range: [0, innerWidth],
  });

  const yMaxTime = Math.max(ampMagnitude * 1.2, 0.5); // ensure at least ±0.5 is visible
   const yScaleTime = scaleLinear({
    domain: [-yMaxTime, yMaxTime],
    range: [innerHeight, 0],
  });

  // Scales for frequency domain
  const xScaleFreq = scaleLinear({
    domain: [Math.max(0, safeFrequency * 0.8), safeFrequency * 1.2],
    range: [0, innerWidth],
  });

  const yScaleFreq = scaleLinear({
    domain: [0, ampMagnitude * 1.2],
    range: [innerHeight, 0],
  });

  // Scales for spatial domain
  const xScaleSpatial = scaleLinear({
    domain: [Math.max(0.1, centralWavelength * 0.8), centralWavelength * 1.2],
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

  // Animation springs
  const drawAnimation = useSpring({
    from: { progress: 0 },
    to: { progress: hasAnimated ? 1 : 0 },
    config: { duration: assemblyDuration, easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t },
    reset: !hasAnimated,
  });

  const verticalLineAnimation = useSpring({
    from: { progress: 0 },
    to: { progress: hasAnimated ? 1 : 0 },
    config: { duration: assemblyDuration * 0.75, delay: assemblyDuration * 0.25 },
    reset: !hasAnimated,
  });

  const labelAnimation = useSpring({
    from: { opacity: 0, y: 5 },
    to: { opacity: hasAnimated ? 1 : 0, y: hasAnimated ? 0 : 5 },
    config: { duration: assemblyDuration * 0.5, delay: assemblyDuration * 0.75 },
    reset: !hasAnimated,
  });

  // Animate transitions for markers
  const springProps = useSpring({
    startTimeX: xScaleTime(safeStartTime),
    endTimeX: xScaleTime(isFinite(safeEndTime) ? safeEndTime : plotEndTime),
    freqCenterX: xScaleFreq(safeFrequency),
    lambdaCenterX: xScaleSpatial(centralWavelength),
    config: { tension: 120, friction: 14 },
  });

  // Helper function to format axis tick labels
  const formatAxisValue = (value: number, domain: PlotDomain = 'time'): string => {
    if (!showUnits) {
      if (Math.abs(value) >= 1000) {
        return value.toExponential(1);
      } else if (Math.abs(value) < 0.01 && value !== 0) {
        return value.toExponential(1);
      }
      return value.toFixed(2);
    } else {
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
          return match[1];
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
          return match[1];
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
          return match[1];
        }
      }
      return value.toFixed(2);
    }
  };

  // Calculate optimal number of ticks
  const calculateOptimalTicks = (scale: any, availableWidth: number): number => {
    const domain = scale.domain();
    const sampleValue = domain[1];
    const formattedSample = formatAxisValue(sampleValue, currentDomain);
    const estimatedLabelWidth = formattedSample.length * 8 + 10;
    const maxTicks = Math.floor(availableWidth / estimatedLabelWidth);
    const minTicks = 3;
    const maxAllowedTicks = 8;
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
      const sampleTime = convertTime(1, projectA, projectUnit);
      const unitMatch = sampleTime.match(/\s+(.+)$/);
      return `Time (${unitMatch ? unitMatch[1] : 't'})`;
    }
  };

  const getFrequencyAxisLabel = () => {
    if (!showUnits) {
      return "Frequency (ω)";
    } else {
      const sampleFreq = convertFrequency(1, projectA, projectUnit);
      const unitMatch = sampleFreq.match(/\s+(.+)$/);
      return `Frequency (${unitMatch ? unitMatch[1] : 'ω'})`;
    }
  };

  const getWavelengthAxisLabel = () => {
    if (!showUnits) {
      return "Wavelength (λ)";
    } else {
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

      <svg width={plotWidth} height={plotHeight} style={{ cursor: 'default' }}>
        <defs>
          <clipPath id="cw-plot-area">
            <rect x={0} y={0} width={innerWidth} height={innerHeight} />
          </clipPath>
          <mask id="cw-line-reveal-mask">
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
          <g clipPath="url(#cw-plot-area)">
            {!isTransitioning && (
              <>
                {currentDomain === 'time' ? (
                  <g mask="url(#cw-line-reveal-mask)">
                    {/* Envelope */}
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
                  <>
                    {/* Frequency domain visualization */}
                    {safeWidth === 0 ? (
                      /* Flat spectrum (∞ bandwidth) – draw a plain line without the reveal mask */
                      <line
                        x1={0}
                        y1={yScaleFreq(ampMagnitude)}
                        x2={innerWidth}
                        y2={yScaleFreq(ampMagnitude)}
                        stroke="#60A5FA"
                        strokeWidth={2}
                      />
                    ) : (
                      /* Gaussian-shaped spectrum – keep mask/animation */
                      <g mask="url(#cw-line-reveal-mask)">
                        <LinePath
                          data={frequencyData}
                          x={(d) => xScaleFreq(d.f)}
                          y={(d) => yScaleFreq(d.spectrum)}
                          stroke="#60A5FA"
                          strokeWidth={2}
                          curve={curveMonotoneX}
                        />
                      </g>
                    )}
                  </>
                ) : (
                  <>
                    {/* Spatial domain visualization */}
                    {safeWidth === 0 ? (
                      /* Flat spectrum (∞ bandwidth) – draw a plain line without the reveal mask */
                      <line
                        x1={0}
                        y1={yScaleSpatial(ampMagnitude / (centralWavelength * centralWavelength))}
                        x2={innerWidth}
                        y2={yScaleSpatial(ampMagnitude / (centralWavelength * centralWavelength))}
                        stroke="#60A5FA"
                        strokeWidth={2}
                      />
                    ) : (
                      /* Gaussian-shaped spectrum – keep mask/animation */
                      <g mask="url(#cw-line-reveal-mask)">
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
                    
                    {isFinite(safeEndTime) && (
                      <animated.line
                        x1={springProps.endTimeX}
                        y1={innerHeight}
                        x2={springProps.endTimeX}
                        y2={verticalLineAnimation.progress.to(p => innerHeight * (1 - p))}
                        stroke="#F59E0B"
                        strokeWidth={1.5}
                        strokeDasharray="3,3"
                        opacity={verticalLineAnimation.progress}
                      />
                    )}
                  </>
                ) : currentDomain === 'frequency' ? (
                  <>
                    {/* Center frequency marker */}
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
                  </>
                ) : (
                  <>
                    {/* Center wavelength marker */}
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
                  {isFinite(safeEndTime) && (
                    <animated.text
                      x={springProps.endTimeX}
                      y={labelAnimation.y.to(y => -5 - y)}
                      fontSize={10}
                      fill="#F59E0B"
                      textAnchor="middle"
                      opacity={labelAnimation.opacity}
                      style={{ userSelect: 'none', cursor: 'default' }}
                    >
                      end
                    </animated.text>
                  )}
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
                      ? `f₀ = ${convertFrequency(safeFrequency, projectA, projectUnit)}`
                      : `ω₀ = ${safeFrequency.toFixed(3)}`}
                  </animated.text>
                  {/* Frequency spectrum legend (top-right) */}
                  <animated.g opacity={labelAnimation.opacity}>
                    <line  x1={innerWidth - 60} y1={5} x2={innerWidth - 47} y2={5} stroke="#60A5FA" strokeWidth={2}/>
                    <text x={innerWidth - 42}  y={9} fontSize={9} fill="#9CA3AF" textAnchor="start"
                          style={{ userSelect:'none', cursor:'default' }}>Spectrum</text>
                  </animated.g>
                  {/* Band-width legend (top-left) */}
                  <animated.g opacity={labelAnimation.opacity}>
                    <line  x1={0} y1={5} x2={13} y2={5} stroke="#A78BFA" strokeWidth={2}/>
                    <text x={18} y={9} fontSize={9} fill="#9CA3AF" textAnchor="start"
                          style={{ userSelect:'none', cursor:'default' }}>
                      {safeWidth > 0 
                        ? (showUnits
                            ? `Δf = ${convertFrequency(fwhmBandwidth, projectA, projectUnit)}`
                            : `Δω = ${fwhmBandwidth.toExponential(2)}`)
                        : (showUnits ? "Δf = ∞" : "Δω = ∞")}
                    </text>
                  </animated.g>
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
                  {/* Frequency spectrum legend (top-right) */}
                  <animated.g opacity={labelAnimation.opacity}>
                    <line  x1={innerWidth - 60} y1={5} x2={innerWidth - 47} y2={5} stroke="#60A5FA" strokeWidth={2}/>
                    <text x={innerWidth - 42}  y={9} fontSize={9} fill="#9CA3AF" textAnchor="start"
                          style={{ userSelect:'none', cursor:'default' }}>Spectrum</text>
                  </animated.g>
                  {/* Band-width legend (top-left) */}
                  <animated.g opacity={labelAnimation.opacity}>
                    <line  x1={0} y1={5} x2={13} y2={5} stroke="#A78BFA" strokeWidth={2}/>
                    <text x={18} y={9} fontSize={9} fill="#9CA3AF" textAnchor="start"
                          style={{ userSelect:'none', cursor:'default' }}>
                      {safeWidth > 0 
                        ? (showUnits
                            ? `Δλ = ${convertWavelength(spectralWidthWavelength, projectA, projectUnit)}`
                            : `Δλ = ${spectralWidthWavelength.toExponential(2)}`)
                        : (showUnits ? "Δλ = ∞" : "Δλ = ∞")}
                    </text>
                  </animated.g>
                </>
              )}
            </>
          )}
        </g>
      </svg>
    </div>
  );
};
