import { StateCreator } from 'zustand';
import { EditorStore, ProjectSlice } from '../types';

export const createProjectSlice: StateCreator<
  EditorStore,
  [],
  [],
  ProjectSlice
> = (set, get) => ({
  selectedProjectIds: new Set<string>(),
  lastSelectedProjectId: null,
  isEditingProject: false,
  createProjectFn: null,
  deleteProjectFn: null,
  
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
      lastSelectedProjectId: project.documentId,
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
    const { openTabs, setRightSidebarOpen, selectedProjectIds } = get();
    const projectTab = openTabs.find(t => t.id === `project-${projectId}`);
    
    if (projectTab) {
      get().setActiveTab(projectTab.id);
    } else {
      // If tab doesn't exist, we need to get project data from ProjectsStore
      // The UI component should handle opening projects via useMeepProjects
      console.warn(`Project tab not found for projectId: ${projectId}`);
    }
    
    // Add to project selection
    const newProjectSelection = new Set(selectedProjectIds);
    newProjectSelection.add(projectId);
    
    setRightSidebarOpen(true);
    set({ 
      selectedProjectIds: newProjectSelection,
      lastSelectedProjectId: projectId,
    });
    
    // Clear lattice selection through the lattice slice
    const { setSelectedLattices } = get();
    setSelectedLattices(new Set<string>());
  },
  
  setSelectedProjects: (ids) => {
    set({ selectedProjectIds: ids });
  },
  
  toggleProjectSelection: (projectId, isMulti, isRange) => {
    const { selectedProjectIds, lastSelectedProjectId, activeTabId, openTabs } = get();
    const activeTab = openTabs.find(t => t.id === activeTabId);
    const newSelection = new Set(selectedProjectIds);
    
    // Always ensure active project is selected
    if (activeTab?.projectId && !newSelection.has(activeTab.projectId)) {
      newSelection.add(activeTab.projectId);
    }
    
    if (isRange && lastSelectedProjectId) {
      // For range selection, we can't rely on the projects array anymore
      // Range selection will need to be handled by UI components that have access to the full projects list
      console.warn('Range selection requires projects list - should be handled by UI components');
      // Fall back to multi-select behavior
      if (newSelection.has(projectId)) {
        if (projectId !== activeTab?.projectId) {
          newSelection.delete(projectId);
        }
      } else {
        newSelection.add(projectId);
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
