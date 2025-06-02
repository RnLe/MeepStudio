import { StateCreator } from 'zustand';
import { ProjectsStore, UpdateTrackingSlice } from '../types';

export const createUpdateTrackingSlice: StateCreator<
  ProjectsStore,
  [],
  [],
  UpdateTrackingSlice
> = (set, get) => ({
  isUpdatingLattice: false,
  
  setIsUpdatingLattice: (updating) => {
    set({ isUpdatingLattice: updating });
  },
});
