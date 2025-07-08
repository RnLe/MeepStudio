import { StateCreator } from 'zustand';
import { CanvasStore, OverlaySlice } from '../types';

export const createOverlaySlice: StateCreator<
  CanvasStore,
  [],
  [],
  OverlaySlice
> = (set, get) => ({
  showGrid: true,
  toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  
  showResolutionOverlay: false,
  toggleShowResolutionOverlay: () => set((s) => ({ showResolutionOverlay: !s.showResolutionOverlay })),
  
  showCanvasInfo: true,
  toggleShowCanvasInfo: () => set((s) => ({ showCanvasInfo: !s.showCanvasInfo })),
  
  showXRayMode: false,
  toggleShowXRayMode: () => set((s) => ({ showXRayMode: !s.showXRayMode })),
  
  showColors: true,
  toggleShowColors: () => set({ showColors: !get().showColors }),
  
  colorSettings: {
    offState: { background: false, geometries: false, boundaries: false },
    onState:  { background: true,  geometries: true,  boundaries: true  },
  },
  
  colorSettingsRevision: 0,
  setColorSetting: (state, element, value) =>
    set((s) => ({
      colorSettings: {
        ...s.colorSettings,
        [state]: { ...s.colorSettings[state], [element]: value },
      },
      colorSettingsRevision: s.colorSettingsRevision + 1,
    })),
  
  getElementColorVisibility: (element) => {
    const { showColors, colorSettings } = get();
    const currentState = showColors ? 'onState' : 'offState';
    return colorSettings[currentState][element];
  },
  
  xRayTransparency: 0.3,
  xRayTransparencyRevision: 0,
  setXRayTransparency: (value) =>
    set((s) => ({
      xRayTransparency: Math.max(0, Math.min(1, value)),
      xRayTransparencyRevision: s.xRayTransparencyRevision + 1,
    })),
  resetXRayTransparency: () =>
    set((s) => ({
      xRayTransparency: 0.3,
      xRayTransparencyRevision: s.xRayTransparencyRevision + 1,
    })),
  
  xRayTransparencySettings: {
    unified: true,
    background: 0.3,
    geometries: 0.3,
    boundaries: 0.3,
    sources: 0.3,
    regions: 0.3,
  },
  
  setXRayTransparencySetting: (element, value) => {
    const clamped = Math.max(0, Math.min(1, value));
    set((s) => ({
      xRayTransparencySettings: {
        ...s.xRayTransparencySettings,
        [element]: clamped,
      },
      xRayTransparencyRevision: s.xRayTransparencyRevision + 1,
    }));
  },
  
  setUnifiedXRayTransparency: (unified) => {
    set((s) => ({
      xRayTransparencySettings: {
        ...s.xRayTransparencySettings,
        unified,
        ...(unified
          ? {
              background: s.xRayTransparency,
              geometries: s.xRayTransparency,
              boundaries: s.xRayTransparency,
              sources: s.xRayTransparency,
              regions: s.xRayTransparency,
            }
          : {}),
      },
      xRayTransparencyRevision: s.xRayTransparencyRevision + 1,
    }));
  },
  
  getElementXRayTransparency: (element) => {
    const { xRayTransparencySettings, xRayTransparency } = get();
    return xRayTransparencySettings.unified
      ? xRayTransparency
      : xRayTransparencySettings[element];
  },
});
