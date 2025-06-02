import { StateCreator } from 'zustand';
import { EditorStore, ProjectSlice } from '../types';

export const createProjectSlice: StateCreator<
  EditorStore,
  [],
  [],
  ProjectSlice
> = (set, get) => ({
  projects: [],
  selectedProjectIds: new Set<string>(),
  lastSelectedProjectId: null,
  isEditingProject: false,
  createProjectFn: null,
  deleteProjectFn: null,
  
  setProjects: (projects) => {
    set({ projects });
  },
  
  setIsEditingProject: (editing) => {
    set({ isEditingProject: editing });
  },
  
  openProject: (project) => {
    const { openTab } = get();
    
    // Open the main project tab as a "scene" tab for backward compatibility
    openTab({
      id: `project-${project.documentId}`,
      type: "scene",
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
  
  closeProject: (projectId) => {
    const { closeTab, openTabs } = get();
    const projectTab = openTabs.find(t => t.id === `project-${projectId}`);
    if (projectTab) {
      closeTab(projectTab.id);
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
  
  getActiveProject: () => {
    const state = get();
    const activeTab = state.openTabs.find(t => t.id === state.activeTabId);
    const activeSubTab = state.activeSubTabId ? state.openTabs.find(t => t.id === state.activeSubTabId) : undefined;
    
    // If we have an active sub-tab, use its project ID
    const relevantTab = activeSubTab || activeTab;
    
    if (!relevantTab) return undefined;
    
    // Handle all tab types that have a projectId
    if (relevantTab.projectId) {
      return state.projects.find(p => p.documentId === relevantTab.projectId) || undefined;
    }
    
    return undefined;
  },
  
  setSelectedProjects: (ids) => {
    set({ selectedProjectIds: ids });
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
});
