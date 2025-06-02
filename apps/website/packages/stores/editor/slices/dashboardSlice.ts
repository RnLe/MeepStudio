import { StateCreator } from 'zustand';
import { EditorStore, DashboardSlice } from '../types';

export const createDashboardSlice: StateCreator<
  EditorStore,
  [],
  [],
  DashboardSlice
> = (set, get) => ({
  openDashboard: (dashboardId = 'main') => {
    const { openTab } = get();
    
    openTab({
      id: `dashboard-${dashboardId}`,
      type: "dashboard",
      title: "Dashboard",
    });
    
    // Clear all selections
    set({ 
      selectedProjectIds: new Set<string>(),
      selectedLatticeIds: new Set<string>(),
      lastSelectedProjectId: null,
      lastSelectedLatticeId: null
    });
  },
  
  closeDashboard: (dashboardId) => {
    const { closeTab, openTabs } = get();
    const dashboardTab = openTabs.find(t => t.id === `dashboard-${dashboardId}`);
    if (dashboardTab) {
      closeTab(dashboardTab.id);
    }
  },
  
  setActiveDashboard: (dashboardId) => {
    const { openTabs, setRightSidebarOpen } = get();
    const dashboardTab = openTabs.find(t => t.id === `dashboard-${dashboardId}`);
    
    if (dashboardTab) {
      get().setActiveTab(dashboardTab.id);
    } else {
      // If tab doesn't exist, open the dashboard
      get().openDashboard(dashboardId);
    }
    
    setRightSidebarOpen(false);
    set({ 
      selectedProjectIds: new Set<string>(),
      selectedLatticeIds: new Set<string>(),
      lastSelectedProjectId: null,
      lastSelectedLatticeId: null
    });
  },
});
