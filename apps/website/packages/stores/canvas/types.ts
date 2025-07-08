import { LengthUnit } from "../../types/meepProjectTypes";
import { FluxRegion, SceneLattice, RegionBox } from "../../types/canvasElementTypes";

// Group Slice
export interface GroupSlice {
  groups: any[];
  setGroups: (groups: any[]) => void;
  addGroup: (group: any) => void;
  updateGroup: (id: string, partial: Partial<any>) => void;
  removeGroup: (id: string) => void;
  removeGroups: (ids: string[]) => void;
  
  // Group hierarchy methods
  addChildToGroup: (groupId: string, childId: string) => void;
  removeChildFromGroup: (groupId: string, childId: string) => void;
  getGroupChildren: (groupId: string) => any[];
  getGroupChildrenIds: (groupId: string) => string[];
  moveChildToGroup: (childId: string, fromGroupId: string | null, toGroupId: string | null) => void;
  
  // Group utilities
  getElementParentGroup: (elementId: string) => any | null;
  getAllDescendants: (groupId: string) => any[];
  getAllAncestors: (elementId: string) => any[];
  isDescendantOf: (elementId: string, groupId: string) => boolean;
  flattenGroup: (groupId: string) => void;
  
  // Material propagation
  propagateGroupMaterial: (groupId: string) => void;
  
  // Selection helpers
  selectGroupWithChildren: (groupId: string, includeDescendants?: boolean) => void;
}

// Selection Slice
export interface SelectionSlice {
  selectedGeometryIds: string[];
  setSelectedGeometryIds: (ids: string[]) => void;
  addSelectedGeometryId: (id: string) => void;
  removeSelectedGeometryId: (id: string) => void;
  clearSelectedGeometryIds: () => void;
  
  selectedGeometryId: string | null;
  selectGeometry: (id: string | null, opts?: { shift?: boolean }) => void;
}

// Canvas Slice
export interface CanvasSlice {
  gridSnapping: boolean;
  toggleGridSnapping: () => void;
  resolutionSnapping: boolean;
  toggleResolutionSnapping: () => void;
  
  canvasSize: { width: number; height: number };
  setCanvasSize: (size: { width: number; height: number }) => void;
  GRID_PX: number;
}

// Geometry Slice
export interface GeometrySlice {
  geometries: any[];
  setGeometries: (geoms: any[]) => void;
  addGeometry: (geom: any) => void;
  updateGeometry: (id: string, partial: Partial<any>) => void;
  updateGeometries: (ids: string[], partial: Partial<any>) => void;
  removeGeometry: (id: string) => void;
  removeGeometries: (ids: string[]) => void;
}

// Source Slice
export interface SourceSlice {
  sources: any[];
  setSources: (sources: any[]) => void;
  addSource: (source: any) => void;
  updateSource: (id: string, partial: Partial<any>) => void;
  updateSources: (ids: string[], partial: Partial<any>) => void;
  removeSource: (id: string) => void;
  removeSources: (ids: string[]) => void;
}

// Boundary Slice
export interface BoundarySlice {
  boundaries: any[];
  setBoundaries: (boundaries: any[]) => void;
  addBoundary: (boundary: any) => void;
  updateBoundary: (id: string, partial: Partial<any>) => void;
  removeBoundary: (id: string) => void;
  removeBoundaries: (ids: string[]) => void;
  updatePMLEdgeAssignment: (boundaryId: string, edge: 'top' | 'right' | 'bottom' | 'left', parameterSetIndex: number | undefined) => void;
}

// Lattice Slice
export interface LatticeSlice {
  lattices: SceneLattice[];
  setLattices: (lattices: SceneLattice[]) => void;
  addLattice: (lattice: SceneLattice) => void;
  updateLattice: (id: string, partial: Partial<SceneLattice>) => void;
  updateLattices: (ids: string[], partial: Partial<SceneLattice>) => void;
  removeLattice: (id: string) => void;
  removeLattices: (ids: string[]) => void;
  linkLatticeToFullLattice: (canvasLatticeId: string, latticeDocumentId: string) => void;
  unlinkLatticeFromFullLattice: (canvasLatticeId: string) => void;
  getLinkedLatticeId: (canvasLatticeId: string) => string | undefined;
  syncLatticeFromFullLattice: (canvasLatticeId: string, fullLattice: any) => void;
  syncLatticesFromProject: (project: any) => void;
}

// Region Slice
export interface RegionSlice {
  regions: FluxRegion[];
  regionBoxes: RegionBox[];
  setRegions: (regions: FluxRegion[]) => void;
  setRegionBoxes: (regionBoxes: RegionBox[]) => void;
  addRegion: (region: FluxRegion) => void;
  addRegionBox: (regionBox: RegionBox) => void;
  updateRegion: (id: string, partial: Partial<FluxRegion>) => void;
  updateRegionBox: (id: string, partial: Partial<RegionBox>) => void;
  updateRegions: (ids: string[], partial: Partial<FluxRegion>) => void;
  updateRegionBoxes: (ids: string[], partial: Partial<RegionBox>) => void;
  removeRegion: (id: string) => void;
  removeRegionBox: (id: string) => void;
  removeRegions: (ids: string[]) => void;
  removeRegionBoxes: (ids: string[]) => void;
}

// Overlay Slice
export interface OverlaySlice {
  showGrid: boolean;
  toggleShowGrid: () => void;
  showResolutionOverlay: boolean;
  toggleShowResolutionOverlay: () => void;
  showCanvasInfo: boolean;
  toggleShowCanvasInfo: () => void;
  showXRayMode: boolean;
  toggleShowXRayMode: () => void;
  showColors: boolean;
  toggleShowColors: () => void;
  
  colorSettings: {
    offState: { background: boolean; geometries: boolean; boundaries: boolean; sources: boolean; regions: boolean; };
    onState:  { background: boolean; geometries: boolean; boundaries: boolean; sources: boolean; regions: boolean; };
  };
  colorSettingsRevision: number;
  setColorSetting: (
    state: 'offState' | 'onState',
    element: 'background' | 'geometries' | 'boundaries' | 'sources' | 'regions',
    value: boolean
  ) => void;
  getElementColorVisibility: (element: 'background' | 'geometries' | 'boundaries' | 'sources' | 'regions') => boolean;
  
  xRayTransparency: number;
  xRayTransparencyRevision: number;
  setXRayTransparency: (value: number) => void;
  resetXRayTransparency: () => void;
  
  xRayTransparencySettings: {
    unified: boolean;
    background: number;
    geometries: number;
    boundaries: number;
    sources: number;
    regions: number;
  };
  setXRayTransparencySetting: (
    element: 'background' | 'geometries' | 'boundaries' | 'sources' | 'regions',
    value: number
  ) => void;
  setUnifiedXRayTransparency: (unified: boolean) => void;
  getElementXRayTransparency: (
    element: 'background' | 'geometries' | 'boundaries' | 'sources' | 'regions'
  ) => number;
}

// Scene Slice
export interface SceneSlice {
  a: number;
  setA: (a: number) => void;
  unit: LengthUnit;
  setUnit: (unit: LengthUnit) => void;
  sceneMaterial: string;
  setSceneMaterial: (material: string) => void;
  
  // Helper to mark project properties as dirty
  markProjectPropertiesDirty: () => void;
}

// Code Generation Slice - tracks what needs to be regenerated
export interface CodeGenerationSlice {
  // Dirty flags for each code section
  codeGenDirtyFlags: {
    initialization: boolean;
    materials: boolean;
    geometries: boolean;
    lattices: boolean;
    sources: boolean;
    boundaries: boolean;
    regions: boolean;
    simulation: boolean;
  };
  
  // Methods to set dirty flags
  markCodeSectionDirty: (section: keyof CodeGenerationSlice['codeGenDirtyFlags']) => void;
  markMultipleCodeSectionsDirty: (sections: Array<keyof CodeGenerationSlice['codeGenDirtyFlags']>) => void;
  clearCodeSectionDirty: (section: keyof CodeGenerationSlice['codeGenDirtyFlags']) => void;
  clearAllCodeSectionsDirty: () => void;
  markAllCodeSectionsDirty: () => void;
  
  // Helper methods
  isAnySectionDirty: () => boolean;
  getDirtySections: () => Array<keyof CodeGenerationSlice['codeGenDirtyFlags']>;
}

// Complete store type
export type CanvasStore = 
  & CanvasSlice
  & SelectionSlice
  & GroupSlice
  & GeometrySlice
  & SourceSlice
  & BoundarySlice
  & LatticeSlice
  & RegionSlice
  & OverlaySlice
  & SceneSlice
  & CodeGenerationSlice
  & {
    getAllElements: () => any[];
  };
