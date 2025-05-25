"use client";

import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { MeepProject } from "../types/meepProjectTypes";

export type SubTabType = "scene" | "lattice" | "code";

export interface SubTab {
  id: string;
  type: SubTabType;
  title: string;
  projectId: string;
}

type EditorState = {
  // Project-level tabs (top row)
  openProjects: MeepProject[];
  activeProjectId: string | null;
  
  // Sub-tabs for active project (second row)
  subTabs: SubTab[];
  activeSubTabId: string | null;
  
  // Global flags
  ghPages: boolean;
  
  // UI state
  rightSidebarOpen: boolean;
  
  // Project management functions (from useMeepProjects)
  projects: MeepProject[];
  isLoading: boolean;
  createProjectFn: ((p: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) => Promise<MeepProject>) | null;
  deleteProjectFn: ((id: string) => Promise<void>) | null;
  
  // Actions
  openProject: (project: MeepProject) => void;
  closeProject: (projectId: string) => void;
  setActiveProject: (projectId: string) => void;
    openSubTab: (subTab: SubTab) => void;
  closeSubTab: (subTabId: string) => void;
  setActiveSubTab: (subTabId: string) => void;
  
  // Dynamic sub-tab management
  addCodeTabToProject: (projectId: string) => void;
  addLatticeTabToProject: (projectId: string) => void;
  removeCodeTabFromProject: (projectId: string) => void;
  removeLatticeTabFromProject: (projectId: string) => void;
  
  setGhPages: (ghPages: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  
  // Project management actions
  setProjects: (projects: MeepProject[]) => void;
  setIsLoading: (loading: boolean) => void;
  setProjectManagementFunctions: (
    createFn: (p: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) => Promise<MeepProject>,
    deleteFn: (id: string) => Promise<void>
  ) => void;
  
  createProject: (project: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) => Promise<MeepProject | void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Helper to get sub-tabs for active project
  getActiveProjectSubTabs: () => SubTab[];
  getActiveProject: () => MeepProject | undefined;
};

export const useEditorStateStore = createWithEqualityFn<EditorState>(
  (set, get) => ({
    openProjects: [],
    activeProjectId: null,
    subTabs: [],
    activeSubTabId: null,
    ghPages: false,
    rightSidebarOpen: true,
    projects: [],
    isLoading: false,
    createProjectFn: null,
    deleteProjectFn: null,    openProject: (project) => {
      const { openProjects, subTabs, setRightSidebarOpen } = get();
      const isAlreadyOpen = openProjects.some(p => p.documentId === project.documentId);
      
      console.log("🔥 openProject called:", {
        projectId: project.documentId,
        projectTitle: project.title,
        isAlreadyOpen,
        currentSubTabsCount: subTabs.length,
        hasCode: !!project.code,
        hasLattice: !!project.lattice
      });
      
      if (!isAlreadyOpen) {
        set({ openProjects: [...openProjects, project] });
        
        // Create default sub-tabs for this project
        const defaultSubTabs: SubTab[] = [
          // Scene tab is always available
          {
            id: `${project.documentId}-scene`,
            type: "scene",
            title: "Scene",
            projectId: project.documentId!,
          }
        ];

        // Add code tab if project has code data
        if (project.code) {
          defaultSubTabs.push({
            id: `${project.documentId}-code`,
            type: "code",
            title: "Code",
            projectId: project.documentId!,
          });
        }

        // Add lattice tab if project has lattice data
        if (project.lattice) {
          defaultSubTabs.push({
            id: `${project.documentId}-lattice`,
            type: "lattice", 
            title: "Lattice Builder",
            projectId: project.documentId!,
          });
        }
        
        console.log("🔥 Created defaultSubTabs:", defaultSubTabs);
        
        // Filter out any existing sub-tabs for this project to avoid duplicates
        const existingProjectTabIds = subTabs
          .filter(tab => tab.projectId === project.documentId)
          .map(tab => tab.id);
        
        const newSubTabs = defaultSubTabs.filter(tab => 
          !existingProjectTabIds.includes(tab.id)
        );
        
        console.log("🔥 After filtering, newSubTabs:", newSubTabs);
        
        // Add new sub-tabs and set active project/sub-tab in one update
        set(state => {
          const updatedState = { 
            subTabs: [...state.subTabs, ...newSubTabs],
            activeProjectId: project.documentId,
            activeSubTabId: newSubTabs.length > 0 ? newSubTabs[0].id : null
          };
          console.log("🔥 Setting new state:", {
            totalSubTabs: updatedState.subTabs.length,
            activeProjectId: updatedState.activeProjectId,
            activeSubTabId: updatedState.activeSubTabId
          });
          return updatedState;
        });
      } else {
        // Project is already open, just activate it
        const projectSubTabs = subTabs.filter(tab => tab.projectId === project.documentId);
        const newActiveSubTabId = projectSubTabs.length > 0 ? projectSubTabs[0].id : null;
        
        console.log("🔥 Project already open, activating:", {
          projectSubTabsCount: projectSubTabs.length,
          newActiveSubTabId
        });
        
        set({ 
          activeProjectId: project.documentId,
          activeSubTabId: newActiveSubTabId,
        });
      }
      
      setRightSidebarOpen(true);
    },
    
    closeProject: (projectId) => {
      const { openProjects, activeProjectId, subTabs } = get();
      const updatedProjects = openProjects.filter(p => p.documentId !== projectId);
      const updatedSubTabs = subTabs.filter(tab => tab.projectId !== projectId);
      
      let newActiveProjectId = activeProjectId;
      let newActiveSubTabId = null;
      
      if (activeProjectId === projectId) {
        newActiveProjectId = updatedProjects.length > 0 ? updatedProjects[0].documentId! : null;
        if (newActiveProjectId) {
          const projectSubTabs = updatedSubTabs.filter(tab => tab.projectId === newActiveProjectId);
          newActiveSubTabId = projectSubTabs.length > 0 ? projectSubTabs[0].id : null;
        }
      }
      
      set({ 
        openProjects: updatedProjects,
        activeProjectId: newActiveProjectId,
        subTabs: updatedSubTabs,
        activeSubTabId: newActiveSubTabId,
      });
    },
    
    setActiveProject: (projectId) => {
      const { subTabs, setRightSidebarOpen } = get();
      const projectSubTabs = subTabs.filter(tab => tab.projectId === projectId);
      const newActiveSubTabId = projectSubTabs.length > 0 ? projectSubTabs[0].id : null;
      
      setRightSidebarOpen(true);
      set({ 
        activeProjectId: projectId,
        activeSubTabId: newActiveSubTabId,
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
    
    addLatticeTabToProject: (projectId) => {
      const { subTabs, projects } = get();
      const project = projects.find(p => p.documentId === projectId);
      if (!project) return;
      
      const latticeTabId = `${projectId}-lattice`;
      const hasLatticeTab = subTabs.some(tab => tab.id === latticeTabId);
      
      if (!hasLatticeTab) {
        const newSubTab: SubTab = {
          id: latticeTabId,
          type: "lattice",
          title: "Lattice Builder",
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
    
    removeLatticeTabFromProject: (projectId) => {
      const { subTabs, activeSubTabId, activeProjectId } = get();
      const latticeTabId = `${projectId}-lattice`;
      const updatedSubTabs = subTabs.filter(tab => tab.id !== latticeTabId);
      
      let newActiveSubTabId = activeSubTabId;
      if (activeSubTabId === latticeTabId && activeProjectId === projectId) {
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
    
    setProjects: (projects) => {
      set({ projects });
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
  }),
  shallow
);