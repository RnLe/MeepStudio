import { StateCreator } from 'zustand';
import { EditorStore, TabSlice, Tab } from '../types';

export const createTabSlice: StateCreator<
  EditorStore,
  [],
  [],
  TabSlice
> = (set, get) => ({
  openTabs: [],
  activeTabId: null,
  activeSubTabId: null,
  
  getMainTabs: () => {
    const { openTabs } = get();
    return openTabs.filter(tab => !tab.parentId);
  },
  
  getSubTabsForMainTab: (mainTabId: string) => {
    const { openTabs } = get();
    const subTabs = openTabs.filter(tab => tab.parentId === mainTabId);
    
    // Always ensure canvas tab exists as the first sub tab if there are other sub tabs
    const hasNonCanvasSubTabs = subTabs.some(t => t.type !== 'canvas');
    const hasCanvasTab = subTabs.some(t => t.type === 'canvas');
    
    if (hasNonCanvasSubTabs && !hasCanvasTab) {
      // Create canvas tab
      const mainTab = openTabs.find(t => t.id === mainTabId);
      const canvasTab: Tab = {
        id: `canvas-${mainTabId}`,
        type: 'canvas',
        title: 'Canvas',
        parentId: mainTabId,
        projectId: mainTab?.projectId,
        latticeId: mainTab?.latticeId,
      };
      
      // Add to openTabs
      set({ openTabs: [...get().openTabs, canvasTab] });
      return [canvasTab, ...subTabs];
    }
    
    // Sort to ensure canvas tab is always first
    return subTabs.sort((a, b) => {
      if (a.type === 'canvas') return -1;
      if (b.type === 'canvas') return 1;
      return 0;
    });
  },
  
  setActiveSubTab: (tabId: string | null) => {
    set({ activeSubTabId: tabId });
  },
  
  closeSubTab: (tabId: string) => {
    const { openTabs, activeSubTabId } = get();
    const tabToClose = openTabs.find(t => t.id === tabId);
    
    // Don't allow closing canvas tabs
    if (tabToClose?.type === 'canvas') return;
    
    const updatedTabs = openTabs.filter(t => t.id !== tabId);
    
    // Check if we need to remove the canvas tab too
    if (tabToClose?.parentId) {
      const remainingSubTabs = updatedTabs.filter(
        t => t.parentId === tabToClose.parentId && t.type !== 'canvas'
      );
      
      // If no sub tabs remain except canvas, remove canvas too
      if (remainingSubTabs.length === 0) {
        const finalTabs = updatedTabs.filter(
          t => !(t.parentId === tabToClose.parentId && t.type === 'canvas')
        );
        
        set({ 
          openTabs: finalTabs,
          activeSubTabId: null,
        });
        return;
      }
    }
    
    let newActiveSubTabId = activeSubTabId;
    if (activeSubTabId === tabId) {
      // Switch to canvas tab when closing active sub tab
      const closedTab = openTabs.find(t => t.id === tabId);
      if (closedTab?.parentId) {
        const canvasTab = updatedTabs.find(
          t => t.parentId === closedTab.parentId && t.type === 'canvas'
        );
        newActiveSubTabId = canvasTab?.id || null;
      } else {
        newActiveSubTabId = null;
      }
    }
    
    set({ 
      openTabs: updatedTabs,
      activeSubTabId: newActiveSubTabId,
    });
  },
  
  openTab: (tab) => {
    const { openTabs, setRightSidebarOpen } = get();
    const isAlreadyOpen = openTabs.some(t => t.id === tab.id);
    
    if (!isAlreadyOpen) {
      set({ openTabs: [...openTabs, tab] });
    }
    
    // If it's a sub tab, ensure canvas tab exists and set both active tab and sub tab
    if (tab.parentId) {
      // This will create canvas tab if needed
      get().getSubTabsForMainTab(tab.parentId);
      
      set({ 
        activeTabId: tab.parentId,
        activeSubTabId: tab.id 
      });
    } else {
      // When opening a main tab, check if it has sub tabs and activate canvas by default
      const subTabs = get().getSubTabsForMainTab(tab.id);
      const canvasTab = subTabs.find((t: Tab) => t.type === 'canvas');
      
      set({ 
        activeTabId: tab.id,
        activeSubTabId: canvasTab?.id || null
      });
    }
    
    if (tab.type !== "dashboard") {
      setRightSidebarOpen(true);
    }
  },
  
  closeTab: (tabId) => {
    const { openTabs, activeTabId } = get();
    const tabToClose = openTabs.find(t => t.id === tabId);
    
    // If closing a main tab, also close its sub tabs (including canvas)
    const tabsToRemove = tabToClose && !tabToClose.parentId
      ? [tabId, ...openTabs.filter(t => t.parentId === tabId).map(t => t.id)]
      : [tabId];
    
    const updatedTabs = openTabs.filter(t => !tabsToRemove.includes(t.id));
    
    let newActiveTabId = activeTabId;
    let newActiveSubTabId = get().activeSubTabId;
    
    if (activeTabId === tabId && updatedTabs.length > 0) {
      // Find the next main tab to activate
      const mainTabs = updatedTabs.filter(t => !t.parentId);
      newActiveTabId = mainTabs.length > 0 ? mainTabs[0].id : null;
      newActiveSubTabId = null;
    } else if (updatedTabs.length === 0) {
      newActiveTabId = null;
      newActiveSubTabId = null;
    }
    
    // Clear sub tab if it was removed
    if (tabsToRemove.includes(get().activeSubTabId || '')) {
      newActiveSubTabId = null;
    }
    
    set({ 
      openTabs: updatedTabs,
      activeTabId: newActiveTabId,
      activeSubTabId: newActiveSubTabId,
    });
  },
  
  setActiveTab: (tabId) => {
    const { setRightSidebarOpen, openTabs } = get();
    const tab = openTabs.find(t => t.id === tabId);
    
    if (tab && !tab.parentId) {
      // When activating a main tab, check if it has sub tabs
      const subTabs = get().getSubTabsForMainTab(tabId);
      
      // If there are sub tabs, activate the canvas tab
      const canvasTab = subTabs.find((t: Tab) => t.type === 'canvas');
      const activeSubTabId = canvasTab?.id || null;
      
      set({ 
        activeTabId: tabId,
        activeSubTabId 
      });
      
      if (tab.type === "dashboard") {
        setRightSidebarOpen(false);
      } else {
        setRightSidebarOpen(true);
      }
      
      // Clear selections when switching tabs
      get().clearAllSelections();
    }
  },
  
  getTabsForProject: (projectId) => {
    const { openTabs } = get();
    return openTabs.filter(tab => tab.projectId === projectId);
  },
  
  getActiveTab: () => {
    const { openTabs, activeTabId, activeSubTabId } = get();
    // Return sub tab if active, otherwise main tab
    if (activeSubTabId) {
      return openTabs.find(t => t.id === activeSubTabId);
    }
    return openTabs.find(t => t.id === activeTabId);
  },
  
  getActiveProjectSubTabs: () => {
    const { openTabs, activeTabId } = get();
    const activeTab = openTabs.find(t => t.id === activeTabId);
    if (activeTab?.projectId) {
      return openTabs.filter(tab => tab.projectId === activeTab.projectId);
    }
    return [];
  },
  
  addCodeTabToProject: (projectId) => {
    const { openTab } = get();
    // We can't access project data here anymore - this should be handled by UI components
    // that have access to useMeepProjects
    openTab({
      id: `code-${projectId}`,
      type: "code",
      title: "Code",
      parentId: `project-${projectId}`,
      projectId: projectId,
    });
  },
  
  removeCodeTabFromProject: (projectId) => {
    const { closeTab, openTabs } = get();
    const codeTab = openTabs.find(t => t.id === `code-${projectId}`);
    if (codeTab) {
      closeTab(codeTab.id);
    }
  },
});
