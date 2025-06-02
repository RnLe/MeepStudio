import { StateCreator } from 'zustand';
import { EditorStore, NavigationSlice } from '../types';

export const createNavigationSlice: StateCreator<
  EditorStore,
  [],
  [],
  NavigationSlice
> = (set, get) => ({
  navigateToTab: 'projects',
  navigationTargetIds: {
    projects: [],
    lattices: [],
    materials: [],
  },
  
  setNavigateToTab: (tab) => set({ navigateToTab: tab }),
  
  setNavigationTargetIds: (tab, ids) => set((state) => ({
    navigationTargetIds: {
      ...state.navigationTargetIds,
      [tab]: ids,
    },
  })),
});
