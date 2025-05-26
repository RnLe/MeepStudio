"use client";

import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { MeepProject, Lattice } from "../types/meepProjectTypes";

export type SubTabType = "scene" | "code";
export type MainTabType = "project" | "lattice" | "dashboard";

export interface SubTab {
  id: string;
  type: SubTabType;
  title: string;
  projectId: string;
}

type EditorState = {
  // Project-level tabs (top row)
  openProjects: MeepProject[];
  openLattices: Lattice[];
  openDashboards: string[]; // Dashboard IDs
  activeProjectId: string | null;
  activeLatticeId: string | null;
  activeDashboardId: string | null;
  activeMainTabType: MainTabType | null;
  
  // Sub-tabs for active project (second row)
  subTabs: SubTab[];
  activeSubTabId: string | null;
  
  // Global flags
  ghPages: boolean;
  
  // UI state
  rightSidebarOpen: boolean;
  leftSidebarPanel: "explorer" | "latticeBuilder" | null;
  
  // Project management functions (from useMeepProjects)
  projects: MeepProject[];
  lattices: Lattice[];
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
  
  openSubTab: (subTab: SubTab) => void;
  closeSubTab: (subTabId: string) => void;
  setActiveSubTab: (subTabId: string) => void;
  
  // Dynamic sub-tab management
  addCodeTabToProject: (projectId: string) => void;
  removeCodeTabFromProject: (projectId: string) => void;
  
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
  
  // Helper to get sub-tabs for active project
  getActiveProjectSubTabs: () => SubTab[];
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
};

export const useEditorStateStore = createWithEqualityFn<EditorState>(
  (set, get) => ({
    openProjects: [],
    openLattices: [],
    openDashboards: [],
    activeProjectId: null,
    activeLatticeId: null,
    activeDashboardId: null,
    activeMainTabType: null,
    subTabs: [],
    activeSubTabId: null,
    ghPages: false,
    rightSidebarOpen: true,
    leftSidebarPanel: "explorer",
    projects: [],
    lattices: [],
    isLoading: false,
    createProjectFn: null,
    deleteProjectFn: null,
    createLatticeFn: null,
    deleteLatticeFn: null,
    
    selectedProjectIds: new Set<string>(),
    selectedLatticeIds: new Set<string>(),
    lastSelectedProjectId: null,
    lastSelectedLatticeId: null,
    
    openProject: (project) => {
      const { openProjects, subTabs, setRightSidebarOpen } = get();
      const isAlreadyOpen = openProjects.some(p => p.documentId === project.documentId);
      
      // Clear lattice selections when opening a project
      const newProjectSelection = new Set<string>();
      newProjectSelection.add(project.documentId);
      
      if (!isAlreadyOpen) {
        set({ openProjects: [...openProjects, project] });
        
        // Create default sub-tabs for this project
        const defaultSubTabs: SubTab[] = [
          {
            id: `${project.documentId}-scene`,
            type: "scene",
            title: "Scene",
            projectId: project.documentId!,
          }
        ];

        if (project.code) {
          defaultSubTabs.push({
            id: `${project.documentId}-code`,
            type: "code",
            title: "Code",
            projectId: project.documentId!,
          });
        }
        
        const existingProjectTabIds = subTabs
          .filter(tab => tab.projectId === project.documentId)
          .map(tab => tab.id);
        
        const newSubTabs = defaultSubTabs.filter(tab => 
          !existingProjectTabIds.includes(tab.id)
        );
        
        set(state => ({ 
          subTabs: [...state.subTabs, ...newSubTabs],
          activeProjectId: project.documentId,
          activeSubTabId: newSubTabs.length > 0 ? newSubTabs[0].id : null,
          activeMainTabType: "project",
          activeLatticeId: null,
          activeDashboardId: null,
          selectedProjectIds: newProjectSelection,
          selectedLatticeIds: new Set<string>(), // Clear lattice selections
          lastSelectedProjectId: project.documentId,
          lastSelectedLatticeId: null
        }));
      } else {
        const projectSubTabs = subTabs.filter(tab => tab.projectId === project.documentId);
        const newActiveSubTabId = projectSubTabs.length > 0 ? projectSubTabs[0].id : null;
        
        set({ 
          activeProjectId: project.documentId,
          activeSubTabId: newActiveSubTabId,
          activeMainTabType: "project",
          activeLatticeId: null,
          activeDashboardId: null,
          selectedProjectIds: newProjectSelection,
          selectedLatticeIds: new Set<string>(), // Clear lattice selections
          lastSelectedProjectId: project.documentId,
          lastSelectedLatticeId: null
        });
      }
      
      setRightSidebarOpen(true);
    },
    
    closeProject: (projectId) => {
      const { openProjects, activeProjectId, subTabs, openLattices, openDashboards } = get();
      const updatedProjects = openProjects.filter(p => p.documentId !== projectId);
      const updatedSubTabs = subTabs.filter(tab => tab.projectId !== projectId);
      
      let newActiveProjectId = activeProjectId;
      let newActiveSubTabId = null;
      let newActiveMainTabType: MainTabType | null = null;
      let newActiveLatticeId = null;
      let newActiveDashboardId = null;
      
      if (activeProjectId === projectId) {
        if (updatedProjects.length > 0) {
          newActiveProjectId = updatedProjects[0].documentId!;
          const projectSubTabs = updatedSubTabs.filter(tab => tab.projectId === newActiveProjectId);
          newActiveSubTabId = projectSubTabs.length > 0 ? projectSubTabs[0].id : null;
          newActiveMainTabType = "project";
        } else if (openLattices.length > 0) {
          newActiveProjectId = null;
          newActiveLatticeId = openLattices[0].documentId;
          newActiveMainTabType = "lattice";
        } else if (openDashboards.length > 0) {
          newActiveProjectId = null;
          newActiveDashboardId = openDashboards[0];
          newActiveMainTabType = "dashboard";
        }
      }
      
      set({ 
        openProjects: updatedProjects,
        activeProjectId: newActiveProjectId,
        activeLatticeId: newActiveLatticeId,
        activeDashboardId: newActiveDashboardId,
        activeMainTabType: newActiveMainTabType,
        subTabs: updatedSubTabs,
        activeSubTabId: newActiveSubTabId,
      });
    },
    
    openLattice: (lattice) => {
      const { openLattices, setRightSidebarOpen } = get();
      const isAlreadyOpen = openLattices.some(l => l.documentId === lattice.documentId);
      
      // Clear project selections when opening a lattice
      const newLatticeSelection = new Set<string>();
      newLatticeSelection.add(lattice.documentId);
      
      if (!isAlreadyOpen) {
        set({ openLattices: [...openLattices, lattice] });
      }
      
      set({ 
        activeLatticeId: lattice.documentId,
        activeProjectId: null,
        activeSubTabId: null,
        activeMainTabType: "lattice",
        activeDashboardId: null,
        selectedLatticeIds: newLatticeSelection,
        selectedProjectIds: new Set<string>(), // Clear project selections
        lastSelectedLatticeId: lattice.documentId,
        lastSelectedProjectId: null
      });
      
      setRightSidebarOpen(true);
    },
    
    closeLattice: (latticeId) => {
      const { openLattices, activeLatticeId, openProjects, subTabs, openDashboards } = get();
      const updatedLattices = openLattices.filter(l => l.documentId !== latticeId);
      
      let newActiveLatticeId = activeLatticeId;
      let newActiveProjectId: string | null = null;
      let newActiveSubTabId: string | null = null;
      let newActiveDashboardId: string | null = null;
      let newActiveMainTabType: MainTabType | null = null;
      
      if (activeLatticeId === latticeId) {
        if (updatedLattices.length > 0) {
          newActiveLatticeId = updatedLattices[0].documentId!;
          newActiveMainTabType = "lattice";
        } else if (openProjects.length > 0) {
          newActiveLatticeId = null;
          newActiveProjectId = openProjects[0].documentId;
          const projectSubTabs = subTabs.filter(tab => tab.projectId === newActiveProjectId);
          newActiveSubTabId = projectSubTabs.length > 0 ? projectSubTabs[0].id : null;
          newActiveMainTabType = "project";
        } else if (openDashboards.length > 0) {
          newActiveLatticeId = null;
          newActiveDashboardId = openDashboards[0];
          newActiveMainTabType = "dashboard";
        }
      }
      
      set({ 
        openLattices: updatedLattices,
        activeLatticeId: newActiveLatticeId,
        activeProjectId: newActiveProjectId,
        activeDashboardId: newActiveDashboardId,
        activeSubTabId: newActiveSubTabId,
        activeMainTabType: newActiveMainTabType
      });
    },
    
    openDashboard: (dashboardId = 'main') => {
      const { openDashboards, setRightSidebarOpen } = get();
      const isAlreadyOpen = openDashboards.includes(dashboardId);
      
      if (!isAlreadyOpen) {
        set({ openDashboards: [...openDashboards, dashboardId] });
      }
      
      set({ 
        activeDashboardId: dashboardId,
        activeProjectId: null,
        activeLatticeId: null,
        activeSubTabId: null,
        activeMainTabType: "dashboard",
        selectedProjectIds: new Set<string>(), // Clear project selections
        selectedLatticeIds: new Set<string>(), // Clear lattice selections
        lastSelectedProjectId: null,
        lastSelectedLatticeId: null
      });
      
      setRightSidebarOpen(false);
    },
    
    closeDashboard: (dashboardId) => {
      const { openDashboards, activeDashboardId, openProjects, openLattices, subTabs } = get();
      const updatedDashboards = openDashboards.filter(id => id !== dashboardId);
      
      let newActiveDashboardId = activeDashboardId;
      let newActiveProjectId: string | null = null;
      let newActiveLatticeId: string | null = null;
      let newActiveSubTabId: string | null = null;
      let newActiveMainTabType: MainTabType | null = null;
      
      if (activeDashboardId === dashboardId) {
        if (updatedDashboards.length > 0) {
          newActiveDashboardId = updatedDashboards[0];
          newActiveMainTabType = "dashboard";
        } else if (openProjects.length > 0) {
          newActiveDashboardId = null;
          newActiveProjectId = openProjects[0].documentId;
          const projectSubTabs = subTabs.filter(tab => tab.projectId === newActiveProjectId);
          newActiveSubTabId = projectSubTabs.length > 0 ? projectSubTabs[0].id : null;
          newActiveMainTabType = "project";
        } else if (openLattices.length > 0) {
          newActiveDashboardId = null;
          newActiveLatticeId = openLattices[0].documentId;
          newActiveMainTabType = "lattice";
        }
      }
      
      set({ 
        openDashboards: updatedDashboards,
        activeDashboardId: newActiveDashboardId,
        activeProjectId: newActiveProjectId,
        activeLatticeId: newActiveLatticeId,
        activeSubTabId: newActiveSubTabId,
        activeMainTabType: newActiveMainTabType
      });
    },
    
    setActiveProject: (projectId) => {
      const { subTabs, setRightSidebarOpen, selectedProjectIds } = get();
      const projectSubTabs = subTabs.filter(tab => tab.projectId === projectId);
      const newActiveSubTabId = projectSubTabs.length > 0 ? projectSubTabs[0].id : null;
      
      // Add to project selection
      const newProjectSelection = new Set(selectedProjectIds);
      newProjectSelection.add(projectId);
      
      setRightSidebarOpen(true);
      set({ 
        activeProjectId: projectId,
        activeLatticeId: null,
        activeDashboardId: null,
        activeSubTabId: newActiveSubTabId,
        activeMainTabType: "project",
        selectedProjectIds: newProjectSelection,
        selectedLatticeIds: new Set<string>(), // Clear lattice selections
        lastSelectedProjectId: projectId,
        lastSelectedLatticeId: null
      });
    },
    
    setActiveLattice: (latticeId) => {
      const { setRightSidebarOpen, selectedLatticeIds } = get();
      
      // Add to lattice selection
      const newLatticeSelection = new Set(selectedLatticeIds);
      newLatticeSelection.add(latticeId);
      
      setRightSidebarOpen(true);
      set({ 
        activeLatticeId: latticeId,
        activeProjectId: null,
        activeDashboardId: null,
        activeSubTabId: null,
        activeMainTabType: "lattice",
        selectedLatticeIds: newLatticeSelection,
        selectedProjectIds: new Set<string>(), // Clear project selections
        lastSelectedLatticeId: latticeId,
        lastSelectedProjectId: null
      });
    },
    
    setActiveDashboard: (dashboardId) => {
      const { setRightSidebarOpen } = get();
      
      setRightSidebarOpen(false);
      set({ 
        activeDashboardId: dashboardId,
        activeProjectId: null,
        activeLatticeId: null,
        activeSubTabId: null,
        activeMainTabType: "dashboard",
        selectedProjectIds: new Set<string>(), // Clear project selections
        selectedLatticeIds: new Set<string>(), // Clear lattice selections
        lastSelectedProjectId: null,
        lastSelectedLatticeId: null
      });
    },
    
    openSubTab: (subTab) => {
      const { subTabs } = get();
      const isAlreadyOpen = subTabs.some(tab => tab.id === subTab.id);
      
      if (!isAlreadyOpen) {
        set({ subTabs: [...subTabs, subTab] });
      }
      
      set({ activeSubTabId: subTab.id });
    },
    
    closeSubTab: (subTabId) => {
      const { subTabs, activeSubTabId, activeProjectId } = get();
      const updatedSubTabs = subTabs.filter(tab => tab.id !== subTabId);
      
      let newActiveSubTabId = activeSubTabId;
      if (activeSubTabId === subTabId && activeProjectId) {
        const remainingProjectSubTabs = updatedSubTabs.filter(tab => tab.projectId === activeProjectId);
        newActiveSubTabId = remainingProjectSubTabs.length > 0 ? remainingProjectSubTabs[0].id : null;
      }
      
      set({ 
        subTabs: updatedSubTabs,
        activeSubTabId: newActiveSubTabId,
      });
    },
    
    setActiveSubTab: (subTabId) => {
      set({ activeSubTabId: subTabId });
    },
    
    addCodeTabToProject: (projectId) => {
      const { subTabs, projects } = get();
      const project = projects.find(p => p.documentId === projectId);
      if (!project) return;
      
      const codeTabId = `${projectId}-code`;
      const hasCodeTab = subTabs.some(tab => tab.id === codeTabId);
      
      if (!hasCodeTab) {
        const newSubTab: SubTab = {
          id: codeTabId,
          type: "code",
          title: "Code",
          projectId,
        };
        
        set(state => ({ 
          subTabs: [...state.subTabs, newSubTab],
          activeSubTabId: newSubTab.id
        }));
      }
    },
    
    removeCodeTabFromProject: (projectId) => {
      const { subTabs, activeSubTabId, activeProjectId } = get();
      const codeTabId = `${projectId}-code`;
      const updatedSubTabs = subTabs.filter(tab => tab.id !== codeTabId);
      
      let newActiveSubTabId = activeSubTabId;
      if (activeSubTabId === codeTabId && activeProjectId === projectId) {
        const remainingProjectSubTabs = updatedSubTabs.filter(tab => tab.projectId === projectId);
        newActiveSubTabId = remainingProjectSubTabs.length > 0 ? remainingProjectSubTabs[0].id : null;
      }
      
      set({ 
        subTabs: updatedSubTabs,
        activeSubTabId: newActiveSubTabId,
      });
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
    
    getActiveProjectSubTabs: () => {
      const { subTabs, activeProjectId } = get();
      const result = activeProjectId ? subTabs.filter(tab => tab.projectId === activeProjectId) : [];
      console.log("🔥 getActiveProjectSubTabs:", {
        activeProjectId,
        totalSubTabs: subTabs.length,
        filteredSubTabs: result.length,
        allSubTabs: subTabs,
        filteredResult: result
      });
      return result;
    },
    
    getActiveProject: () => {
      const { projects, activeProjectId } = get();
      return projects.find(p => p.documentId === activeProjectId);
    },
    
    getActiveLattice: () => {
      const { lattices, activeLatticeId } = get();
      return lattices.find(l => l.documentId === activeLatticeId);
    },
    
    setSelectedProjects: (ids) => {
      set({ selectedProjectIds: ids });
    },
    
    setSelectedLattices: (ids) => {
      set({ selectedLatticeIds: ids });
    },
    
    clearAllSelections: () => {
      const { activeProjectId, activeLatticeId } = get();
      const newProjectSelection = new Set<string>();
      const newLatticeSelection = new Set<string>();
      
      // Keep active items selected
      if (activeProjectId) {
        newProjectSelection.add(activeProjectId);
      }
      if (activeLatticeId) {
        newLatticeSelection.add(activeLatticeId);
      }
      
      set({ 
        selectedProjectIds: newProjectSelection,
        selectedLatticeIds: newLatticeSelection,
        lastSelectedProjectId: activeProjectId,
        lastSelectedLatticeId: activeLatticeId
      });
    },
    
    toggleProjectSelection: (projectId, isMulti, isRange) => {
      const { selectedProjectIds, lastSelectedProjectId, projects, activeProjectId } = get();
      const newSelection = new Set(selectedProjectIds);
      
      // Always ensure active project is selected
      if (activeProjectId && !newSelection.has(activeProjectId)) {
        newSelection.add(activeProjectId);
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
          if (projectId !== activeProjectId) {
            newSelection.delete(projectId);
          }
        } else {
          newSelection.add(projectId);
        }
      } else {
        // Single selection - clear others but keep active
        newSelection.clear();
        if (activeProjectId) {
          newSelection.add(activeProjectId);
        }
        newSelection.add(projectId);
      }
      
      set({ 
        selectedProjectIds: newSelection,
        lastSelectedProjectId: projectId
      });
    },
    
    toggleLatticeSelection: (latticeId, isMulti, isRange) => {
      const { selectedLatticeIds, lastSelectedLatticeId, lattices, activeLatticeId } = get();
      const newSelection = new Set(selectedLatticeIds);
      
      // Always ensure active lattice is selected
      if (activeLatticeId && !newSelection.has(activeLatticeId)) {
        newSelection.add(activeLatticeId);
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
          if (latticeId !== activeLatticeId) {
            newSelection.delete(latticeId);
          }
        } else {
          newSelection.add(latticeId);
        }
      } else {
        // Single selection - clear others but keep active
        newSelection.clear();
        if (activeLatticeId) {
          newSelection.add(activeLatticeId);
        }
        newSelection.add(latticeId);
      }
      
      set({ 
        selectedLatticeIds: newSelection,
        lastSelectedLatticeId: latticeId
      });
    },
  }),
  shallow
);