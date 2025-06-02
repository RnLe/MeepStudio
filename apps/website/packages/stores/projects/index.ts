import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { createProjectStateSlice } from './slices/projectStateSlice';
import { createLatticeStateSlice } from './slices/latticeStateSlice';
import { createRelationshipSlice } from './slices/relationshipSlice';
import { createUpdateTrackingSlice } from './slices/updateTrackingSlice';
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
