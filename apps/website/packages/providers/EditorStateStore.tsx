"use client";

import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { MeepProject, Lattice } from "../types/meepProjectTypes";

export type TabType = "project" | "lattice" | "dashboard" | "code" | "scene";
export type MainTabType = "project" | "lattice" | "dashboard";

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  parentId?: string; // Optional parent reference (e.g., project ID for code tabs)
  projectId?: string; // For project and code tabs
  latticeId?: string; // For lattice tabs
}

// For backward compatibility - map scene to project
export type SubTab = Tab;
export type SubTabType = "scene" | "code";

type EditorState = {
  // All tabs (flat structure)
  openTabs: Tab[];
  activeTabId: string | null;
  
  // Computed properties for backward compatibility
  activeProjectId: string | null;
  activeLatticeId: string | null;
  activeDashboardId: string | null;
  activeMainTabType: MainTabType | null;
  activeSubTabId: string | null;
  
  // Source data
  projects: MeepProject[];
  lattices: Lattice[];
  
  // Global flags
  ghPages: boolean;
  
  // UI state
  rightSidebarOpen: boolean;
  leftSidebarPanel: "explorer" | "latticeBuilder" | null;
  
  // Project management functions (from useMeepProjects)
  isLoading: boolean;
  createProjectFn: ((p: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) => Promise<MeepProject>) | null;
  deleteProjectFn: ((id: string) => Promise<void>) | null;
  createLatticeFn: ((l: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) => Promise<Lattice>) | null;
  deleteLatticeFn: ((id: string) => Promise<void>) | null;
  
  // Actions
  openProject: (project: MeepProject) => void;
  closeProject: (projectId: string) => void;
  setActiveProject: (projectId: string) => void;
  
  openLattice: (lattice: Lattice) => void;
  closeLattice: (latticeId: string) => void;
  setActiveLattice: (latticeId: string) => void;
  
  openDashboard: (dashboardId?: string) => void;
  closeDashboard: (dashboardId: string) => void;
  setActiveDashboard: (dashboardId: string) => void;
  
  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  
  // Dynamic tab management
  addCodeTabToProject: (projectId: string) => void;
  
  setGhPages: (ghPages: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setLeftSidebarPanel: (panel: "explorer" | "latticeBuilder" | null) => void;
  
  // Project management actions
  setProjects: (projects: MeepProject[]) => void;
  setLattices: (lattices: Lattice[]) => void;
  setIsLoading: (loading: boolean) => void;
  setProjectManagementFunctions: (
    createFn: (p: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) => Promise<MeepProject>,
    deleteFn: (id: string) => Promise<void>
  ) => void;
  setLatticeManagementFunctions: (
    createFn: (l: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) => Promise<Lattice>,
    deleteFn: (id: string) => Promise<void>
  ) => void;
  
  createProject: (project: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) => Promise<MeepProject | void>;
  deleteProject: (id: string) => Promise<void>;
  createLattice: (lattice: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) => Promise<Lattice | void>;
  deleteLattice: (id: string) => Promise<void>;
  
  // Helper methods
  getTabsForProject: (projectId: string) => Tab[];
  getActiveTab: () => Tab | undefined;
  getActiveProject: () => MeepProject | undefined;
  getActiveLattice: () => Lattice | undefined;
  
  // Multi-selection state
  selectedProjectIds: Set<string>;
  selectedLatticeIds: Set<string>;
  lastSelectedProjectId: string | null;
  lastSelectedLatticeId: string | null;
  
  // Multi-selection actions
  setSelectedProjects: (ids: Set<string>) => void;
  setSelectedLattices: (ids: Set<string>) => void;
  clearAllSelections: () => void;
  toggleProjectSelection: (projectId: string, isMulti: boolean, isRange: boolean) => void;
  toggleLatticeSelection: (latticeId: string, isMulti: boolean, isRange: boolean) => void;
  
  // Additional methods for backward compatibility
  removeCodeTabFromProject: (projectId: string) => void;
  getActiveProjectSubTabs: () => Tab[];
  
  // Panel editing states
  isEditingProject: boolean;
  isEditingLattice: boolean;
  
  // Panel editing actions
  setIsEditingProject: (editing: boolean) => void;
  setIsEditingLattice: (editing: boolean) => void;
};

export const useEditorStateStore = createWithEqualityFn<EditorState>(
  (set, get) => ({
    openTabs: [],
    activeTabId: null,
    ghPages: false,
    rightSidebarOpen: true,
    leftSidebarPanel: "explorer",
    projects: [],
    lattices: [],
    
    selectedProjectIds: new Set<string>(),
    selectedLatticeIds: new Set<string>(),
    lastSelectedProjectId: null,
    lastSelectedLatticeId: null,
    
    isLoading: false,
    createProjectFn: null,
    deleteProjectFn: null,
    createLatticeFn: null,
    deleteLatticeFn: null,
    
    isEditingProject: false,
    isEditingLattice: false,
    
    openTab: (tab) => {
      const { openTabs, setRightSidebarOpen } = get();
      const isAlreadyOpen = openTabs.some(t => t.id === tab.id);
      
      if (!isAlreadyOpen) {
        set({ openTabs: [...openTabs, tab] });
      }
      
      set({ activeTabId: tab.id });
      
      if (tab.type !== "dashboard") {
        setRightSidebarOpen(true);
      }
    },
    
    closeTab: (tabId) => {
      const { openTabs, activeTabId } = get();
      const updatedTabs = openTabs.filter(t => t.id !== tabId);
      
      let newActiveTabId = activeTabId;
      if (activeTabId === tabId && updatedTabs.length > 0) {
        // Find the next best tab to activate
        const tabToClose = openTabs.find(t => t.id === tabId);
        if (tabToClose?.parentId) {
          // If closing a child tab, try to activate its parent
          const parent = updatedTabs.find(t => t.id === tabToClose.parentId);
          newActiveTabId = parent?.id || updatedTabs[0].id;
        } else {
          // Otherwise activate the first remaining tab
          newActiveTabId = updatedTabs[0].id;
        }
      } else if (updatedTabs.length === 0) {
        newActiveTabId = null;
      }
      
      set({ 
        openTabs: updatedTabs,
        activeTabId: newActiveTabId,
      });
    },
    
    setActiveTab: (tabId) => {
      const { setRightSidebarOpen, openTabs } = get();
      const tab = openTabs.find(t => t.id === tabId);
      
      if (tab) {
        set({ activeTabId: tabId });
        
        if (tab.type === "dashboard") {
          setRightSidebarOpen(false);
        } else {
          setRightSidebarOpen(true);
        }
        
        // Clear selections when switching tabs
        get().clearAllSelections();
      }
    },
    
    openProject: (project) => {
      const { openTab } = get();
      
      // Open the main project tab as a "scene" tab for backward compatibility
      openTab({
        id: `project-${project.documentId}`,
        type: "scene", // Changed from "project" to "scene"
        title: project.title,
        projectId: project.documentId,
      });
      
      // Clear selections and select this project
      const newProjectSelection = new Set<string>();
      newProjectSelection.add(project.documentId);
      set({ 
        selectedProjectIds: newProjectSelection,
        selectedLatticeIds: new Set<string>(),
        lastSelectedProjectId: project.documentId,
        lastSelectedLatticeId: null
      });
    },
    
    openLattice: (lattice) => {
      const { openTab } = get();
      
      openTab({
        id: `lattice-${lattice.documentId}`,
        type: "lattice",
        title: lattice.title,
        latticeId: lattice.documentId,
      });
      
      // Clear selections and select this lattice
      const newLatticeSelection = new Set<string>();
      newLatticeSelection.add(lattice.documentId);
      set({ 
        selectedLatticeIds: newLatticeSelection,
        selectedProjectIds: new Set<string>(),
        lastSelectedLatticeId: lattice.documentId,
        lastSelectedProjectId: null
      });
    },
    
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
    
    // Add code tab to project
    addCodeTabToProject: (projectId) => {
      const { openTab, projects } = get();
      const project = projects.find(p => p.documentId === projectId);
      if (!project) return;
      
      openTab({
        id: `code-${projectId}`,
        type: "code",
        title: "Code",
        parentId: `project-${projectId}`,
        projectId: projectId,
      });
    },
    
    getTabsForProject: (projectId) => {
      const { openTabs } = get();
      return openTabs.filter(tab => tab.projectId === projectId);
    },
    
    getActiveTab: () => {
      const { openTabs, activeTabId } = get();
      return openTabs.find(t => t.id === activeTabId);
    },
    
    getActiveProject: () => {
      const { projects, activeTabId, openTabs } = get();
      const activeTab = openTabs.find(t => t.id === activeTabId);
      if (activeTab?.projectId) {
        return projects.find(p => p.documentId === activeTab.projectId);
      }
      return undefined;
    },
    
    getActiveLattice: () => {
      const { lattices, activeTabId, openTabs } = get();
      const activeTab = openTabs.find(t => t.id === activeTabId);
      if (activeTab?.latticeId) {
        return lattices.find(l => l.documentId === activeTab.latticeId);
      }
      return undefined;
    },
    
    // Update close methods to use new tab system
    closeProject: (projectId) => {
      const { closeTab, openTabs } = get();
      const projectTab = openTabs.find(t => t.id === `project-${projectId}`);
      if (projectTab) {
        closeTab(projectTab.id);
      }
    },
    
    closeLattice: (latticeId) => {
      const { closeTab, openTabs } = get();
      const latticeTab = openTabs.find(t => t.id === `lattice-${latticeId}`);
      if (latticeTab) {
        closeTab(latticeTab.id);
      }
    },
    
    closeDashboard: (dashboardId) => {
      const { closeTab, openTabs } = get();
      const dashboardTab = openTabs.find(t => t.id === `dashboard-${dashboardId}`);
      if (dashboardTab) {
        closeTab(dashboardTab.id);
      }
    },
    
    setGhPages: (ghPages) => {
      set({ ghPages });
    },
    
    setRightSidebarOpen: (open) => {
      set({ rightSidebarOpen: open });
    },
    
    setLeftSidebarPanel: (panel) => {
      set({ leftSidebarPanel: panel });
    },
    
    setProjects: (projects) => {
      set({ projects });
    },
    
    setLattices: (lattices) => {
      set({ lattices });
    },
    
    setIsLoading: (loading) => {
      set({ isLoading: loading });
    },
    
    setProjectManagementFunctions: (createFn, deleteFn) => {
      set({ 
        createProjectFn: createFn,
        deleteProjectFn: deleteFn,
      });
    },
    
    setLatticeManagementFunctions: (createFn, deleteFn) => {
      set({ 
        createLatticeFn: createFn,
        deleteLatticeFn: deleteFn,
      });
    },
    
    setIsEditingProject: (editing) => {
      set({ isEditingProject: editing });
    },
    
    setIsEditingLattice: (editing) => {
      set({ isEditingLattice: editing });
    },
    
    createProject: async (project) => {
      const { createProjectFn, openProject } = get();
      if (!createProjectFn) {
        console.error("Create project function not initialized");
        return;
      }
      
      try {
        const newProject = await createProjectFn(project);
        openProject(newProject);
        return newProject;
      } catch (error) {
        console.error("Failed to create project", error);
        throw error;
      }
    },
    
    deleteProject: async (id) => {
      const { deleteProjectFn, closeProject } = get();
      if (!deleteProjectFn) {
        console.error("Delete project function not initialized");
        return;
      }
      
      try {
        await deleteProjectFn(id);
        closeProject(id);
      } catch (error) {
        console.error("Failed to delete project", error);
        throw error;
      }
    },
    
    createLattice: async (lattice) => {
      const { createLatticeFn, openLattice } = get();
      if (!createLatticeFn) {
        console.error("Create lattice function not initialized");
        return;
      }
      
      try {
        const newLattice = await createLatticeFn(lattice);
        openLattice(newLattice);
        return newLattice;
      } catch (error) {
        console.error("Failed to create lattice", error);
        throw error;
      }
    },
    
    deleteLattice: async (id) => {
      const { deleteLatticeFn, closeLattice } = get();
      if (!deleteLatticeFn) {
        console.error("Delete lattice function not initialized");
        return;
      }
      
      try {
        await deleteLatticeFn(id);
        closeLattice(id);
      } catch (error) {
        console.error("Failed to delete lattice", error);
        throw error;
      }
    },
    
    setActiveProject: (projectId) => {
      const { openTabs, setRightSidebarOpen, selectedProjectIds, projects } = get();
      const projectTab = openTabs.find(t => t.id === `project-${projectId}`);
      
      if (projectTab) {
        get().setActiveTab(projectTab.id);
      } else {
        // If tab doesn't exist, open the project
        const project = projects.find(p => p.documentId === projectId);
        if (project) {
          get().openProject(project);
        }
      }
      
      // Add to project selection
      const newProjectSelection = new Set(selectedProjectIds);
      newProjectSelection.add(projectId);
      
      setRightSidebarOpen(true);
      set({ 
        selectedProjectIds: newProjectSelection,
        selectedLatticeIds: new Set<string>(),
        lastSelectedProjectId: projectId,
        lastSelectedLatticeId: null
      });
    },
    
    setActiveLattice: (latticeId) => {
      const { openTabs, setRightSidebarOpen, selectedLatticeIds, lattices } = get();
      const latticeTab = openTabs.find(t => t.id === `lattice-${latticeId}`);
      
      if (latticeTab) {
        get().setActiveTab(latticeTab.id);
      } else {
        // If tab doesn't exist, open the lattice
        const lattice = lattices.find(l => l.documentId === latticeId);
        if (lattice) {
          get().openLattice(lattice);
        }
      }
      
      // Add to lattice selection
      const newLatticeSelection = new Set(selectedLatticeIds);
      newLatticeSelection.add(latticeId);
      
      setRightSidebarOpen(true);
      set({ 
        selectedLatticeIds: newLatticeSelection,
        selectedProjectIds: new Set<string>(),
        lastSelectedLatticeId: latticeId,
        lastSelectedProjectId: null
      });
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
    
    setSelectedProjects: (ids) => {
      set({ selectedProjectIds: ids });
    },
    
    setSelectedLattices: (ids) => {
      set({ selectedLatticeIds: ids });
    },
    
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
    
    toggleProjectSelection: (projectId, isMulti, isRange) => {
      const { selectedProjectIds, lastSelectedProjectId, projects, activeTabId, openTabs } = get();
      const activeTab = openTabs.find(t => t.id === activeTabId);
      const newSelection = new Set(selectedProjectIds);
      
      // Always ensure active project is selected
      if (activeTab?.projectId && !newSelection.has(activeTab.projectId)) {
        newSelection.add(activeTab.projectId);
      }
      
      if (isRange && lastSelectedProjectId) {
        // Sort projects alphabetically
        const sortedProjects = [...projects].sort((a, b) => a.title.localeCompare(b.title));
        const lastIndex = sortedProjects.findIndex(p => p.documentId === lastSelectedProjectId);
        const currentIndex = sortedProjects.findIndex(p => p.documentId === projectId);
        
        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          
          for (let i = start; i <= end; i++) {
            newSelection.add(sortedProjects[i].documentId);
          }
        }
      } else if (isMulti) {
        // Toggle selection - but don't allow deselecting the active project
        if (newSelection.has(projectId)) {
          if (projectId !== activeTab?.projectId) {
            newSelection.delete(projectId);
          }
        } else {
          newSelection.add(projectId);
        }
      } else {
        // Single selection - clear others but keep active
        newSelection.clear();
        if (activeTab?.projectId) {
          newSelection.add(activeTab.projectId);
        }
        newSelection.add(projectId);
      }
      
      set({ 
        selectedProjectIds: newSelection,
        lastSelectedProjectId: projectId
      });
    },
    
    toggleLatticeSelection: (latticeId, isMulti, isRange) => {
      const { selectedLatticeIds, lastSelectedLatticeId, lattices, activeTabId, openTabs } = get();
      const activeTab = openTabs.find(t => t.id === activeTabId);
      const newSelection = new Set(selectedLatticeIds);
      
      // Always ensure active lattice is selected
      if (activeTab?.latticeId && !newSelection.has(activeTab.latticeId)) {
        newSelection.add(activeTab.latticeId);
      }
      
      if (isRange && lastSelectedLatticeId) {
        // Sort lattices alphabetically
        const sortedLattices = [...lattices].sort((a, b) => a.title.localeCompare(b.title));
        const lastIndex = sortedLattices.findIndex(l => l.documentId === lastSelectedLatticeId);
        const currentIndex = sortedLattices.findIndex(l => l.documentId === latticeId);
        
        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          
          for (let i = start; i <= end; i++) {
            newSelection.add(sortedLattices[i].documentId);
          }
        }
      } else if (isMulti) {
        // Toggle selection - but don't allow deselecting the active lattice
        if (newSelection.has(latticeId)) {
          if (latticeId !== activeTab?.latticeId) {
            newSelection.delete(latticeId);
          }
        } else {
          newSelection.add(latticeId);
        }
      } else {
        // Single selection - clear others but keep active
        newSelection.clear();
        if (activeTab?.latticeId) {
          newSelection.add(activeTab.latticeId);
        }
        newSelection.add(latticeId);
      }
      
      set({ 
        selectedLatticeIds: newSelection,
        lastSelectedLatticeId: latticeId
      });
    },
    
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
        case "scene": // Add scene type
        case "code":
          return "project" as MainTabType;
        case "lattice":
          return "lattice" as MainTabType;
        case "dashboard":
          return "dashboard" as MainTabType;
        default:
          return null;
      }
    },
    
    get activeSubTabId() {
      const { activeTabId } = get();
      return activeTabId;
    },
    
    removeCodeTabFromProject: (projectId) => {
      const { closeTab, openTabs } = get();
      const codeTab = openTabs.find(t => t.id === `code-${projectId}`);
      if (codeTab) {
        closeTab(codeTab.id);
      }
    },
    
    getActiveProjectSubTabs: () => {
      const { openTabs, activeTabId } = get();
      const activeTab = openTabs.find(t => t.id === activeTabId);
      if (activeTab?.projectId) {
        return openTabs.filter(tab => tab.projectId === activeTab.projectId);
      }
      return [];
    },
  }),
  shallow
);