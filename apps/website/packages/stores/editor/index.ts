import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import {
  createTabSlice,
  createProjectSlice,
  createLatticeSlice,
  createUISlice,
  createNavigationSlice,
  createDashboardSlice,
} from './slices';
import { EditorStore } from './types';

export const useEditorStateStore = createWithEqualityFn<EditorStore>(
  (set, get, store) => ({
    // Combine all slices
    ...createTabSlice(set, get, store),
    ...createProjectSlice(set, get, store),
    ...createLatticeSlice(set, get, store),
    ...createUISlice(set, get, store),
    ...createNavigationSlice(set, get, store),
    ...createDashboardSlice(set, get, store),
    
    // Computed getters for backward compatibility
    get activeProjectId() {
      const { openTabs, activeTabId } = get();
      const activeTab = openTabs.find(t => t.id === activeTabId);
      return activeTab?.projectId || null;
    },
    
    get activeLatticeId() {
      const { openTabs, activeTabId } = get();
      const activeTab = openTabs.find(t => t.id === activeTabId);
      return activeTab?.latticeId || null;
    },
    
    get activeDashboardId() {
      const { openTabs, activeTabId } = get();
      const activeTab = openTabs.find(t => t.id === activeTabId);
      if (activeTab?.type === "dashboard") {
        return activeTab.id.replace("dashboard-", "");
      }
      return null;
    },
    
    get activeMainTabType() {
      const { openTabs, activeTabId } = get();
      const activeTab = openTabs.find(t => t.id === activeTabId);
      if (!activeTab) return null;
      
      switch (activeTab.type) {
        case "project":
        case "scene":
        case "code":
          return "project";
        case "lattice":
          return "lattice";
        case "dashboard":
          return "dashboard";
        default:
          return null;
      }
    },
    
    // General selection clearing
    clearAllSelections: () => {
      const { activeTabId, openTabs } = get();
      const activeTab = openTabs.find(t => t.id === activeTabId);
      const newProjectSelection = new Set<string>();
      const newLatticeSelection = new Set<string>();
      
      // Keep active items selected
      if (activeTab?.projectId) {
        newProjectSelection.add(activeTab.projectId);
      }
      if (activeTab?.latticeId) {
        newLatticeSelection.add(activeTab.latticeId);
      }
      
      set({ 
        selectedProjectIds: newProjectSelection,
        selectedLatticeIds: newLatticeSelection,
        lastSelectedProjectId: activeTab?.projectId || null,
        lastSelectedLatticeId: activeTab?.latticeId || null
      });
    },
  }),
  shallow
);

// Re-export types for convenience
export type { Tab, TabType, MainTabType, SubTabType } from './types';
