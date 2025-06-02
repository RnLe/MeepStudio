import { MeepProject } from "../../types/meepProjectTypes";
import { Lattice } from "../../types/meepLatticeTypes";

export type TabType = "project" | "lattice" | "dashboard" | "code" | "scene" | "canvas";
export type MainTabType = "project" | "lattice" | "dashboard";
export type SubTabType = "scene" | "code";

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  parentId?: string;
  projectId?: string;
  latticeId?: string;
}

// Tab Management Slice
export interface TabSlice {
  openTabs: Tab[];
  activeTabId: string | null;
  activeSubTabId: string | null;
  
  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  
  getMainTabs: () => Tab[];
  getSubTabsForMainTab: (mainTabId: string) => Tab[];
  setActiveSubTab: (tabId: string | null) => void;
  closeSubTab: (tabId: string) => void;
  
  getTabsForProject: (projectId: string) => Tab[];
  getActiveTab: () => Tab | undefined;
  getActiveProjectSubTabs: () => Tab[];
  
  addCodeTabToProject: (projectId: string) => void;
  removeCodeTabFromProject: (projectId: string) => void;
}

// Project Management Slice
export interface ProjectSlice {
  projects: MeepProject[];
  selectedProjectIds: Set<string>;
  lastSelectedProjectId: string | null;
  isEditingProject: boolean;
  
  setProjects: (projects: MeepProject[]) => void;
  setIsEditingProject: (editing: boolean) => void;
  
  openProject: (project: MeepProject) => void;
  closeProject: (projectId: string) => void;
  setActiveProject: (projectId: string) => void;
  getActiveProject: () => MeepProject | undefined;
  
  setSelectedProjects: (ids: Set<string>) => void;
  toggleProjectSelection: (projectId: string, isMulti: boolean, isRange: boolean) => void;
  
  createProjectFn: ((p: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) => Promise<MeepProject>) | null;
  deleteProjectFn: ((id: string) => Promise<void>) | null;
  setProjectManagementFunctions: (
    createFn: (p: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) => Promise<MeepProject>,
    deleteFn: (id: string) => Promise<void>
  ) => void;
  createProject: (project: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) => Promise<MeepProject | void>;
  deleteProject: (id: string) => Promise<void>;
}

// Lattice Management Slice
export interface LatticeSlice {
  lattices: Lattice[];
  selectedLatticeIds: Set<string>;
  lastSelectedLatticeId: string | null;
  isEditingLattice: boolean;
  
  setLattices: (lattices: Lattice[]) => void;
  setIsEditingLattice: (editing: boolean) => void;
  
  openLattice: (lattice: Lattice) => void;
  closeLattice: (latticeId: string) => void;
  setActiveLattice: (latticeId: string) => void;
  getActiveLattice: () => Lattice | undefined;
  
  setSelectedLattices: (ids: Set<string>) => void;
  toggleLatticeSelection: (latticeId: string, isMulti: boolean, isRange: boolean) => void;
  
  createLatticeFn: ((l: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) => Promise<Lattice>) | null;
  deleteLatticeFn: ((id: string) => Promise<void>) | null;
  setLatticeManagementFunctions: (
    createFn: (l: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) => Promise<Lattice>,
    deleteFn: (id: string) => Promise<void>
  ) => void;
  createLattice: (lattice: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) => Promise<Lattice | void>;
  deleteLattice: (id: string) => Promise<void>;
}

// UI State Slice
export interface UISlice {
  ghPages: boolean;
  rightSidebarOpen: boolean;
  leftSidebarPanel: "explorer" | "latticeBuilder" | null;
  isLoading: boolean;
  
  setGhPages: (ghPages: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setLeftSidebarPanel: (panel: "explorer" | "latticeBuilder" | null) => void;
  setIsLoading: (loading: boolean) => void;
}

// Navigation Slice
export interface NavigationSlice {
  navigateToTab: 'projects' | 'lattices' | 'materials';
  navigationTargetIds: {
    projects: string[];
    lattices: string[];
    materials: string[];
  };
  
  setNavigateToTab: (tab: 'projects' | 'lattices' | 'materials') => void;
  setNavigationTargetIds: (tab: 'projects' | 'lattices' | 'materials', ids: string[]) => void;
}

// Dashboard Slice
export interface DashboardSlice {
  openDashboard: (dashboardId?: string) => void;
  closeDashboard: (dashboardId: string) => void;
  setActiveDashboard: (dashboardId: string) => void;
}

// Complete store type
export type EditorStore = 
  & TabSlice
  & ProjectSlice
  & LatticeSlice
  & UISlice
  & NavigationSlice
  & DashboardSlice
  & {
    // Computed properties for backward compatibility
    activeProjectId: string | null;
    activeLatticeId: string | null;
    activeDashboardId: string | null;
    activeMainTabType: MainTabType | null;
    
    // General selection clearing
    clearAllSelections: () => void;
  };
