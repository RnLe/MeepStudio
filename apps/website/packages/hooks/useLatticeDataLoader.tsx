"use client";
import { useEffect, useCallback } from "react";
import { Lattice, VoronoiData } from "../types/meepLatticeTypes";
import { useLatticeStore } from "../providers/LatticeStore";
import { getWasmModule } from "../utils/wasmLoader";
import { useMeepProjects } from "./useMeepProjects";

interface UseLatticeDataLoaderProps {
  lattice: Lattice | null;
  ghPages: boolean;
}

export const useLatticeDataLoader = ({ lattice, ghPages }: UseLatticeDataLoaderProps) => {
  const { updateLattice } = useMeepProjects({ ghPages });
  
  const voronoiData = useLatticeStore((s) => s.voronoiData);
  const setVoronoiData = useLatticeStore((s) => s.setVoronoiData);
  const isCalculatingVoronoi = useLatticeStore((s) => s.isCalculatingVoronoi);
  const setIsCalculatingVoronoi = useLatticeStore((s) => s.setIsCalculatingVoronoi);
  const spaceMode = useLatticeStore((s) => s.spaceMode);
  const realSpaceZoneCount = useLatticeStore((s) => s.realSpaceZoneCount);
  const reciprocalSpaceZoneCount = useLatticeStore((s) => s.reciprocalSpaceZoneCount);
  const transformationMatrices = useLatticeStore((s) => s.transformationMatrices);
  const setTransformationMatrices = useLatticeStore((s) => s.setTransformationMatrices);
  
  // Add lattice point related store values
  const showLatticePoints = useLatticeStore((s) => s.showLatticePoints);
  const latticeScale = useLatticeStore((s) => s.latticeScale);
  const gridDensity = useLatticeStore((s) => s.gridDensity);
  const normalizeMode = useLatticeStore((s) => s.normalizeMode);
  const latticePointCache = useLatticeStore((s) => s.latticePointCache);
  const setLatticePointCache = useLatticeStore((s) => s.setLatticePointCache);
  const latticeMultiplier = useLatticeStore((s) => s.latticeMultiplier);
  
  // Add missing store accessors
  const showVoronoiCell = useLatticeStore((s) => s.showVoronoiCell);
  const showVoronoiTiling = useLatticeStore((s) => s.showVoronoiTiling);
  
  // Load existing voronoi data when lattice changes
  useEffect(() => {
    if (lattice?.voronoiData) {
      setVoronoiData(lattice.voronoiData);
    } else {
      setVoronoiData(null);
    }
  }, [lattice?.documentId, lattice?.voronoiData, setVoronoiData]);
  
  // Load transformation matrices when lattice changes
  useEffect(() => {
    if (lattice?.meepLattice?.transformationMatrices) {
      setTransformationMatrices(lattice.meepLattice.transformationMatrices);
    } else {
      setTransformationMatrices(null);
    }
  }, [lattice?.documentId, lattice?.meepLattice?.transformationMatrices, setTransformationMatrices]);
  
  // Calculate transformation matrices
  const calculateTransformationMatrices = useCallback(
    async () => {
      if (!lattice?.meepLattice || 
          !lattice.meepLattice.reciprocal_basis1 || 
          !lattice.meepLattice.reciprocal_basis2) {
        return;
      }
      
      try {
        const wasm = await getWasmModule();
        
        // Get scaled basis vectors
        const a1 = {
          x: lattice.meepLattice.basis1.x * lattice.meepLattice.basis_size.x,
          y: lattice.meepLattice.basis1.y * lattice.meepLattice.basis_size.y,
          z: lattice.meepLattice.basis1.z * lattice.meepLattice.basis_size.z
        };
        const a2 = {
          x: lattice.meepLattice.basis2.x * lattice.meepLattice.basis_size.x,
          y: lattice.meepLattice.basis2.y * lattice.meepLattice.basis_size.y,
          z: lattice.meepLattice.basis2.z * lattice.meepLattice.basis_size.z
        };
        const a3 = lattice.meepLattice.basis3 ? {
          x: lattice.meepLattice.basis3.x * lattice.meepLattice.basis_size.x,
          y: lattice.meepLattice.basis3.y * lattice.meepLattice.basis_size.y,
          z: lattice.meepLattice.basis3.z * lattice.meepLattice.basis_size.z
        } : { x: 0, y: 0, z: 1 };
        
        const b1 = lattice.meepLattice.reciprocal_basis1;
        const b2 = lattice.meepLattice.reciprocal_basis2;
        const b3 = lattice.meepLattice.reciprocal_basis3 || { x: 0, y: 0, z: 2 * Math.PI };
        
        let matrices;
        
        // Try 3D calculation first
        if (wasm.calculate_lattice_transformations_3d) {
          matrices = wasm.calculate_lattice_transformations_3d(
            a1.x, a1.y, a1.z,
            a2.x, a2.y, a2.z,
            a3.x, a3.y, a3.z,
            b1.x, b1.y, b1.z,
            b2.x, b2.y, b2.z,
            b3.x, b3.y, b3.z
          );
        } else if (wasm.calculate_lattice_transformations) {
          // Fallback to 2D version
          const matrices2d = wasm.calculate_lattice_transformations(
            a1.x, a1.y,
            a2.x, a2.y,
            b1.x, b1.y,
            b2.x, b2.y
          );
          
          // Convert 2x2 matrices to 3x3
          const expandMatrix = (m: any): number[][] => {
            if (!m || !Array.isArray(m)) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            return [
              [m[0][0], m[0][1], 0],
              [m[1][0], m[1][1], 0],
              [0, 0, 1]
            ];
          };
          
          matrices = {
            MA: expandMatrix(matrices2d.MA),
            MA_inv: expandMatrix(matrices2d.MA_inv),
            MB: expandMatrix(matrices2d.MB),
            MB_inv: expandMatrix(matrices2d.MB_inv),
            realToReciprocal: expandMatrix(matrices2d.realToReciprocal),
            reciprocalToReal: expandMatrix(matrices2d.reciprocalToReal)
          };
        } else {
          throw new Error("No WASM transformation calculation function available");
        }
        
        setTransformationMatrices(matrices);
        
        // Save to lattice
        const updatedLattice: Lattice = {
          ...lattice,
          meepLattice: {
            ...lattice.meepLattice,
            transformationMatrices: matrices
          }
        };
        await updateLattice({
          documentId: lattice.documentId,
          lattice: updatedLattice
        });
        
      } catch (e) {
        console.error("Error calculating transformation matrices:", e);
      }
    },
    [lattice, updateLattice, setTransformationMatrices]
  );
  
  // Check and calculate transformation matrices if needed
  useEffect(() => {
    if (lattice?.meepLattice && 
        lattice.meepLattice.reciprocal_basis1 && 
        lattice.meepLattice.reciprocal_basis2) {
      // Always recalculate if basis vectors have changed
      const needsCalculation = !lattice.meepLattice.transformationMatrices ||
        // Add a check to see if matrices match current vectors
        !transformationMatrices ||
        transformationMatrices.MA[0][0] !== lattice.meepLattice.basis1.x * lattice.meepLattice.basis_size.x ||
        transformationMatrices.MA[1][0] !== lattice.meepLattice.basis1.y * lattice.meepLattice.basis_size.y ||
        transformationMatrices.MA[0][1] !== lattice.meepLattice.basis2.x * lattice.meepLattice.basis_size.x ||
        transformationMatrices.MA[1][1] !== lattice.meepLattice.basis2.y * lattice.meepLattice.basis_size.y;
        
      if (needsCalculation) {
        calculateTransformationMatrices();
      }
    }
  }, [
    lattice?.meepLattice?.basis1,
    lattice?.meepLattice?.basis2,
    lattice?.meepLattice?.basis_size,
    lattice?.meepLattice?.reciprocal_basis1,
    lattice?.meepLattice?.reciprocal_basis2,
    lattice?.meepLattice?.transformationMatrices,
    transformationMatrices,
    calculateTransformationMatrices
  ]);
  
  // --- calculate ------------------------------------------------------------
  // NOTE: now only needs maxZones – basis & spaceMode are taken from hooks/store
  const calculateVoronoiCells = useCallback(
    async (maxZones: number = 5) => {
      if (!lattice?.meepLattice) return null;

      const isRealSpace = spaceMode === 'real';
      
      // Check for reciprocal basis vectors in k-space mode
      if (!isRealSpace && (!lattice.meepLattice.reciprocal_basis1 || !lattice.meepLattice.reciprocal_basis2)) {
        console.warn('No reciprocal basis vectors available');
        return null;
      }
      
      /* pick correct basis (scaled) */
      const basis1 = isRealSpace
        ? {
            x: lattice.meepLattice.basis1.x * lattice.meepLattice.basis_size.x,
            y: lattice.meepLattice.basis1.y * lattice.meepLattice.basis_size.y,
          }
        : lattice.meepLattice.reciprocal_basis1!;
      const basis2 = isRealSpace
        ? {
            x: lattice.meepLattice.basis2.x * lattice.meepLattice.basis_size.x,
            y: lattice.meepLattice.basis2.y * lattice.meepLattice.basis_size.y,
          }
        : lattice.meepLattice.reciprocal_basis2!;

      try {
        setIsCalculatingVoronoi(true);
        const wasm = await getWasmModule();
        const cacheKey = `${basis1.x},${basis1.y}_${basis2.x},${basis2.y}_${isRealSpace ? 'real' : 'reciprocal'}_${maxZones}`;

        if (isRealSpace) {
          // Use the correct function for real space
          const result = wasm.calculate_wigner_seitz_zones(
            basis1.x, basis1.y,
            basis2.x, basis2.y,
            maxZones
          );
          const data: VoronoiData = {
            realSpaceZones: result.zones,
            wignerSeitzCell: result.zones[0],
            cacheKey
          };
          setVoronoiData(data);
          return data;
        } else {
          // Use calculate_brillouin_zones for reciprocal space
          const result = wasm.calculate_brillouin_zones(
            basis1.x, basis1.y,
            basis2.x, basis2.y,
            maxZones
          );
          const data: VoronoiData = {
            brillouinZones: result.zones,
            cacheKey
          };
          setVoronoiData(data);
          return data;
        }
      } catch (err) {
        console.error('Failed to calculate Voronoi cells:', err);
        return null;
      } finally {
        setIsCalculatingVoronoi(false);
      }
    },
    [lattice, spaceMode, setVoronoiData, setIsCalculatingVoronoi]
  );

  // --- checker --------------------------------------------------------------
  const checkAndCalculateVoronoi = useCallback(
    async (forceRecalculate: boolean = false) => {
      if (!lattice?.meepLattice) return;

      const isRealSpace = spaceMode === 'real';
      const requiredZones = isRealSpace ? realSpaceZoneCount : reciprocalSpaceZoneCount;

      const hasCorrectData = isRealSpace
        ? !!voronoiData?.realSpaceZones &&
          voronoiData.realSpaceZones.length >= requiredZones
        : !!voronoiData?.brillouinZones &&
          voronoiData.brillouinZones.length >= requiredZones;

      const needsMoreZones = isRealSpace
        ? voronoiData?.realSpaceZones &&
          voronoiData.realSpaceZones.length < requiredZones
        : voronoiData?.brillouinZones &&
          voronoiData.brillouinZones.length < requiredZones;

      const hasWrongSpaceData = isRealSpace
        ? !voronoiData?.realSpaceZones && !!voronoiData?.brillouinZones
        : !voronoiData?.brillouinZones && !!voronoiData?.realSpaceZones;

      if (forceRecalculate || !hasCorrectData || needsMoreZones || hasWrongSpaceData) {
        await calculateVoronoiCells(requiredZones);
      }
    },
    [lattice, spaceMode, voronoiData, realSpaceZoneCount, reciprocalSpaceZoneCount, calculateVoronoiCells]
  );

  // Check if Voronoi data needs calculation - simplified to prevent loops
  useEffect(() => {
    if (!lattice?.meepLattice || !showVoronoiCell) return;
    
    const isRealSpace = spaceMode === 'real';
    const requiredZones = isRealSpace ? realSpaceZoneCount : reciprocalSpaceZoneCount;
    
    // Skip if we're in reciprocal space without reciprocal vectors
    if (!isRealSpace && (!lattice.meepLattice.reciprocal_basis1 || !lattice.meepLattice.reciprocal_basis2)) {
      return;
    }
    
    // Check if we need to calculate
    let needsCalculation = false;
    
    if (isRealSpace) {
      const currentZones = voronoiData?.realSpaceZones?.length || 0;
      needsCalculation = currentZones < requiredZones;
    } else {
      const currentZones = voronoiData?.brillouinZones?.length || 0;
      needsCalculation = currentZones < requiredZones;
    }
    
    if (needsCalculation) {
      calculateVoronoiCells(requiredZones);
    }
  }, [
    reciprocalSpaceZoneCount, 
    realSpaceZoneCount, 
    spaceMode, 
    lattice?.meepLattice, 
    showVoronoiCell,
    // Don't include voronoiData to prevent loops
  ]);
  
  // Calculate normalization factor
  const getNormalizationFactor = useCallback(() => {
    if (!lattice?.meepLattice || !normalizeMode) return 1;
    
    const isRealSpace = spaceMode === 'real';
    let maxLength = 0;
    
    if (isRealSpace) {
      const v1 = lattice.meepLattice.basis1;
      const v2 = lattice.meepLattice.basis2;
      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y) * lattice.meepLattice.basis_size.x;
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y) * lattice.meepLattice.basis_size.y;
      maxLength = Math.max(len1, len2);
    } else {
      if (lattice.meepLattice.reciprocal_basis1 && lattice.meepLattice.reciprocal_basis2) {
        const v1 = lattice.meepLattice.reciprocal_basis1;
        const v2 = lattice.meepLattice.reciprocal_basis2;
        const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        maxLength = Math.max(len1, len2);
      }
    }
    
    return maxLength > 0 ? 1 / maxLength : 1;
  }, [lattice, spaceMode, normalizeMode]);
  
  // Load lattice points using WASM
  useEffect(() => {
    if (!lattice?.meepLattice || !showLatticePoints) return;
    
    const loadPoints = async () => {
      const startTime = performance.now();
      const wasm = await getWasmModule();
      
      const isRealSpace = spaceMode === 'real';
      const normalizationFactor = getNormalizationFactor();
      const scale = latticeScale * (normalizeMode ? normalizationFactor : 1);
      
      // Get appropriate basis vectors
      const basis = isRealSpace ? {
        b1: {
          x: lattice.meepLattice.basis1.x * lattice.meepLattice.basis_size.x,
          y: lattice.meepLattice.basis1.y * lattice.meepLattice.basis_size.y
        },
        b2: {
          x: lattice.meepLattice.basis2.x * lattice.meepLattice.basis_size.x,
          y: lattice.meepLattice.basis2.y * lattice.meepLattice.basis_size.y
        }
      } : {
        b1: lattice.meepLattice.reciprocal_basis1 || { x: 0, y: 0 },
        b2: lattice.meepLattice.reciprocal_basis2 || { x: 0, y: 0 }
      };
      
      // Create cache key including the multiplier
      const cacheKey = `${basis.b1.x}-${basis.b1.y}-${basis.b2.x}-${basis.b2.y}-${gridDensity}-${latticeMultiplier}`;
      
      // Check if we already have this in cache
      if (latticePointCache?.cacheKey === cacheKey) {
        return;
      }
      
      // Call Rust function to calculate square lattice points
      const result = wasm.calculate_square_lattice_points(
        basis.b1.x,
        basis.b1.y,
        basis.b2.x,
        basis.b2.y,
        gridDensity * 2, // target_count (will create roughly gridDensity x gridDensity points)
        latticeMultiplier // Use the multiplier from store
      );
      
      const endTime = performance.now();
      
      setLatticePointCache({
        points: result.points,
        maxDistance: result.max_distance,
        cacheKey,
        stats: {
          timeTaken: endTime - startTime,
          pointCount: result.points.length,
          maxDistance: result.max_distance
        }
      });
    };
    
    loadPoints();
  }, [
    lattice, 
    spaceMode, 
    showLatticePoints, 
    gridDensity, 
    latticeScale, 
    normalizeMode, 
    getNormalizationFactor, 
    setLatticePointCache, 
    latticePointCache?.cacheKey,
    latticeMultiplier // Add to dependencies
  ]);
  
  // Include lattice type in cache key
  const getCacheKey = useCallback(() => {
    if (!lattice?.meepLattice) return null;
    
    const basis1 = lattice.meepLattice.basis1;
    const basis2 = lattice.meepLattice.basis2;
    const basisSize = lattice.meepLattice.basis_size;
    const latticeType = lattice.latticeType || 'unknown';
    
    return `${basis1.x},${basis1.y}_${basis2.x},${basis2.y}_${basisSize.x},${basisSize.y}_${latticeType}`;
  }, [lattice]);

  // --------------------------------------------------------------------------
  // Prevent infinite loop – only clear when data exists & key mismatches
  useEffect(() => {
    const currentKey = getCacheKey();
    if (currentKey && voronoiData && voronoiData.cacheKey && voronoiData.cacheKey !== currentKey) {
      setVoronoiData(null);
    }
  }, [getCacheKey, setVoronoiData]); // Remove voronoiData from deps to prevent loop

  // Listen for lattice type change events
  useEffect(() => {
    const handleLatticeTypeChanged = () => {
      // Clear cache and recalculate when lattice type changes
      useLatticeStore.setState({
        latticePointCache: null,
        voronoiData: null,
        transformationMatrices: null
      });
      
      // Recalculate if voronoi is showing
      const state = useLatticeStore.getState();
      if (state.showVoronoiCell || state.showVoronoiTiling) {
        checkAndCalculateVoronoi();
      }
    };
    
    window.addEventListener('latticeTypeChanged', handleLatticeTypeChanged);
    return () => window.removeEventListener('latticeTypeChanged', handleLatticeTypeChanged);
  }, [lattice, checkAndCalculateVoronoi]);

  return {
    voronoiData,
    isCalculatingVoronoi,
    calculateVoronoiCells,
    checkAndCalculateVoronoi,
    calculateTransformationMatrices,
    // Add lattice point related exports
    latticePointCache,
    getNormalizationFactor
  };
};
