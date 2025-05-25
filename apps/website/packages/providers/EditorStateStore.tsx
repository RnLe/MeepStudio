"use client";

import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { MeepProject, Lattice } from "../types/meepProjectTypes";

export type SubTabType = "scene" | "code";
export type MainTabType = "project" | "lattice";

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
  activeProjectId: string | null;
  activeLatticeId: string | null;
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
};

export const useEditorStateStore = createWithEqualityFn<EditorState>(
  (set, get) => ({
    openProjects: [],
    openLattices: [],
    activeProjectId: null,
    activeLatticeId: null,
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
    
    openProject: (project) => {
      const { openProjects, subTabs, setRightSidebarOpen } = get();
      const isAlreadyOpen = openProjects.some(p => p.documentId === project.documentId);
      
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
          activeLatticeId: null
        }));
      } else {
        const projectSubTabs = subTabs.filter(tab => tab.projectId === project.documentId);
        const newActiveSubTabId = projectSubTabs.length > 0 ? projectSubTabs[0].id : null;
        
        set({ 
          activeProjectId: project.documentId,
          activeSubTabId: newActiveSubTabId,
          activeMainTabType: "project",
          activeLatticeId: null
        });
      }
      
      setRightSidebarOpen(true);
    },
    
    closeProject: (projectId) => {
      const { openProjects, activeProjectId, subTabs, openLattices } = get();
      const updatedProjects = openProjects.filter(p => p.documentId !== projectId);
      const updatedSubTabs = subTabs.filter(tab => tab.projectId !== projectId);
      
      let newActiveProjectId = activeProjectId;
      let newActiveSubTabId = null;
      let newActiveMainTabType: MainTabType | null = null;
      let newActiveLatticeId = null;
      
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
        }
      }
      
      set({ 
        openProjects: updatedProjects,
        activeProjectId: newActiveProjectId,
        activeLatticeId: newActiveLatticeId,
        activeMainTabType: newActiveMainTabType,
        subTabs: updatedSubTabs,
        activeSubTabId: newActiveSubTabId,
      });
    },
    
    openLattice: (lattice) => {
      const { openLattices, setRightSidebarOpen } = get();
      const isAlreadyOpen = openLattices.some(l => l.documentId === lattice.documentId);
      
      if (!isAlreadyOpen) {
        set({ openLattices: [...openLattices, lattice] });
      }
      
      set({ 
        activeLatticeId: lattice.documentId,
        activeProjectId: null,
        activeSubTabId: null,
        activeMainTabType: "lattice"
      });
      
      setRightSidebarOpen(true);
    },
    
    closeLattice: (latticeId) => {
      const { openLattices, activeLatticeId, openProjects, subTabs } = get();
      const updatedLattices = openLattices.filter(l => l.documentId !== latticeId);
      
      let newActiveLatticeId = activeLatticeId;
      let newActiveProjectId: string | null = null;
      let newActiveSubTabId: string | null = null;
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
        }
      }
      
      set({ 
        openLattices: updatedLattices,
        activeLatticeId: newActiveLatticeId,
        activeProjectId: newActiveProjectId,
        activeSubTabId: newActiveSubTabId,
        activeMainTabType: newActiveMainTabType
      });
    },
    
    setActiveProject: (projectId) => {
      const { subTabs, setRightSidebarOpen } = get();
      const projectSubTabs = subTabs.filter(tab => tab.projectId === projectId);
      const newActiveSubTabId = projectSubTabs.length > 0 ? projectSubTabs[0].id : null;
      
      setRightSidebarOpen(true);
      set({ 
        activeProjectId: projectId,
        activeLatticeId: null,
        activeSubTabId: newActiveSubTabId,
        activeMainTabType: "project"
      });
    },
    
    setActiveLattice: (latticeId) => {
      const { setRightSidebarOpen } = get();
      
      setRightSidebarOpen(true);
      set({ 
        activeLatticeId: latticeId,
        activeProjectId: null,
        activeSubTabId: null,
        activeMainTabType: "lattice"
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
  }),
  shallow
);