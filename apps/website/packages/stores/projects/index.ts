import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { createProjectStateSlice, createLatticeStateSlice, createRelationshipSlice, createUpdateTrackingSlice } from './slices';
import { ProjectsStore } from './types';

export const useProjectsStore = create<ProjectsStore>()(
  subscribeWithSelector(
    persist(
      (set, get, store) => ({
        ...createProjectStateSlice(set, get, store),
        ...createLatticeStateSlice(set, get, store),
        ...createRelationshipSlice(set, get, store),
        ...createUpdateTrackingSlice(set, get, store),
      }),
      {
        name: "meep-projects",
        version: 2,
        // Only persist the data, not the flags
        partialize: (state) => ({
          projects: state.projects,
          lattices: state.lattices,
        }),
      }
    )
  )
);
