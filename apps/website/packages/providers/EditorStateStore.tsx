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
    deleteProjectFn: null,
    
    openProject: (project) => {
      const { openProjects, setActiveProject, setRightSidebarOpen } = get();
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
          },
          {
            id: `${project.documentId}-lattice`,
            type: "lattice", 
            title: "Lattice Builder",
            projectId: project.documentId!,
          },
          {
            id: `${project.documentId}-code`,
            type: "code",
            title: "Code",
            projectId: project.documentId!,
          },
        ];
        
        set(state => ({ 
          subTabs: [...state.subTabs, ...defaultSubTabs]
        }));
      }
      
      setRightSidebarOpen(true);
      setActiveProject(project.documentId!);
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
      return activeProjectId ? subTabs.filter(tab => tab.projectId === activeProjectId) : [];
    },
    
    getActiveProject: () => {
      const { projects, activeProjectId } = get();
      return projects.find(p => p.documentId === activeProjectId);
    },
  }),
  shallow
);