"use client";
import { useEffect, useCallback } from "react";
import { Lattice, VoronoiData } from "../types/meepProjectTypes";
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
  
  // Load existing voronoi data when lattice changes
  useEffect(() => {
    if (lattice?.voronoiData) {
      setVoronoiData(lattice.voronoiData);
    } else {
      setVoronoiData(null);
    }
  }, [lattice?.documentId, lattice?.voronoiData, setVoronoiData]);
  
  // --- helper to fetch fresh store data each time ---------------------------
  const getStore = () => useLatticeStore.getState();

  // --- calculate ------------------------------------------------------------
  const calculateVoronoiCells = useCallback(
    async (maxZone: number = 1) => {
      if (!lattice?.meepLattice || getStore().isCalculatingVoronoi) return;

      const { spaceMode } = getStore();            // ← always current
      const isRealSpace = spaceMode === 'real';

      try {
        getStore().setIsCalculatingVoronoi(true);
        const wasm = await getWasmModule();
        
        // Get appropriate basis vectors based on space mode
        const basis = isRealSpace
          ? {
              a1: {
                x: lattice.meepLattice.basis1.x * lattice.meepLattice.basis_size.x,
                y: lattice.meepLattice.basis1.y * lattice.meepLattice.basis_size.y,
              },
              a2: {
                x: lattice.meepLattice.basis2.x * lattice.meepLattice.basis_size.x,
                y: lattice.meepLattice.basis2.y * lattice.meepLattice.basis_size.y,
              },
            }
          : {
              a1: lattice.meepLattice.reciprocal_basis1 || { x: 0, y: 0 },
              a2: lattice.meepLattice.reciprocal_basis2 || { x: 0, y: 0 },
            };

        // Call Rust function to calculate Brillouin zones
        const rawResult = wasm.calculate_brillouin_zones(
          basis.a1.x,
          basis.a1.y,
          basis.a2.x,
          basis.a2.y,
          maxZone
        );

        // Apply zone separation for both real and reciprocal space (omit for now)
        const result = rawResult;

        // Convert result to our VoronoiData format
        const newVoronoiData: VoronoiData = {
          calculationParams: {
            maxZone,
            searchRange: 5,
            timestamp: new Date().toISOString(),
          },
        };

        /* Handle multiple zones in both real and reciprocal space */
        if (isRealSpace) {
          // Store first zone as wignerSeitzCell for backward compatibility
          if ((result.zones as any).length > 0) {
            newVoronoiData.wignerSeitzCell = {
              vertices: (result.zones as any)[0].map((v: any) => ({ x: v.x, y: v.y })),
              zone: 1,
            };
          }
          // Store all zones in realSpaceZones
          newVoronoiData.realSpaceZones = (result.zones as any).map(
            (zone: any[], idx: number) => ({
              vertices: zone.map((v: any) => ({ x: v.x, y: v.y })),
              zone: idx + 1,
            })
          );
        } else {
          newVoronoiData.brillouinZones = (result.zones as any).map(
            (zone: any[], idx: number) => ({
              vertices: zone.map((v: any) => ({ x: v.x, y: v.y })),
              zone: idx + 1,
            })
          );
        }

        getStore().setVoronoiData(newVoronoiData);

        // Save to lattice
        if (lattice) {
          const updatedLattice: Lattice = {
            ...lattice,
            voronoiData: newVoronoiData
          };
          await updateLattice({
            documentId: lattice.documentId,
            lattice: updatedLattice
          });
        }
        
      } catch (e) {
        console.error("Error calculating Voronoi cells:", e);
      } finally {
        getStore().setIsCalculatingVoronoi(false);
      }
    },
    [lattice, ghPages, updateLattice] // remove space-mode etc. from deps
  );

  // --- checker --------------------------------------------------------------
  const checkAndCalculateVoronoi = useCallback(
    async (forceRecalculate: boolean = false) => {
      if (!lattice?.meepLattice) return;

      const {
        spaceMode,
        realSpaceZoneCount,
        reciprocalSpaceZoneCount,
        voronoiData,
      } = getStore();

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
    [lattice, calculateVoronoiCells]
  );

  // Check if Voronoi data needs calculation
  useEffect(() => {
    if (!lattice?.meepLattice) return;
    
    const isRealSpace = spaceMode === 'real';
    const requiredZones = isRealSpace ? realSpaceZoneCount : reciprocalSpaceZoneCount;
    
    // Check both real and reciprocal space zones
    if (isRealSpace) {
      const currentZones = voronoiData?.realSpaceZones?.length || 0;
      if (currentZones < requiredZones) {
        calculateVoronoiCells(requiredZones);
      }
    } else {
      const currentZones = voronoiData?.brillouinZones?.length || 0;
      if (currentZones < requiredZones) {
        calculateVoronoiCells(requiredZones);
      }
    }
  }, [reciprocalSpaceZoneCount, realSpaceZoneCount, spaceMode, lattice, voronoiData, calculateVoronoiCells]);
  
  return {
    voronoiData,
    isCalculatingVoronoi,
    calculateVoronoiCells,
    checkAndCalculateVoronoi
  };
};
