import { StateCreator } from 'zustand';
import { EditorStore, UISlice } from '../types';

export const createUISlice: StateCreator<
  EditorStore,
  [],
  [],
  UISlice
> = (set, get) => ({
  ghPages: false,
  rightSidebarOpen: true,
  leftSidebarPanel: "explorer",
  isLoading: false,
  
  setGhPages: (ghPages) => {
    set({ ghPages });
  },
  
  setRightSidebarOpen: (open) => {
    set({ rightSidebarOpen: open });
  },
  
  setLeftSidebarPanel: (panel) => {
    set({ leftSidebarPanel: panel });
  },
  
  setIsLoading: (loading) => {
    set({ isLoading: loading });
  },
});
