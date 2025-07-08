// src/hooks/useMeepProjects.ts
// 
// OPTIMIZED: Selective access to ProjectsStore to prevent unnecessary re-renders
// Components only subscribe to the data they actually need
import { useProjectsStore } from "../stores/projects";
import { shallow } from "zustand/shallow";

export const useMeepProjects = () => {
  // Get individual properties to avoid creating new objects
  const createProject = useProjectsStore((state) => state.createProject);
  const updateProject = useProjectsStore((state) => state.updateProject);
  const deleteProject = useProjectsStore((state) => state.deleteProject);
  const createLattice = useProjectsStore((state) => state.createLattice);
  const updateLattice = useProjectsStore((state) => state.updateLattice);
  const deleteLattice = useProjectsStore((state) => state.deleteLattice);
  const getProjectsUsingLattice = useProjectsStore((state) => state.getProjectsUsingLattice);
  const getLatticesUsedByProject = useProjectsStore((state) => state.getLatticesUsedByProject);
  const getProjectById = useProjectsStore((state) => state.getProjectById);
  const getLatticeById = useProjectsStore((state) => state.getLatticeById);
  
  // Relationship functions
  const linkLatticeToProject = useProjectsStore((state) => state.linkLatticeToProject);
  const unlinkLatticeFromProject = useProjectsStore((state) => state.unlinkLatticeFromProject);
  const syncCanvasLatticesWithFullLattice = useProjectsStore((state) => state.syncCanvasLatticesWithFullLattice);
  const setIsChangingLatticeType = useProjectsStore((state) => state.setIsChangingLatticeType);
  
  const projects = useProjectsStore((state) => state.projects);
  const lattices = useProjectsStore((state) => state.lattices);
  const isLoading = useProjectsStore((state) => state.isLoading);

  return {
    // Data
    projects,
    lattices,
    isLoading,
    // Actions
    createProject,
    updateProject,
    deleteProject,
    createLattice,
    updateLattice,
    deleteLattice,
    getProjectsUsingLattice,
    getLatticesUsedByProject,
    getProjectById,
    getLatticeById,
    // Relationship actions
    linkLatticeToProject,
    unlinkLatticeFromProject,
    syncCanvasLatticesWithFullLattice,
    setIsChangingLatticeType,
  };
};

// Specialized hooks for components that only need specific actions
export const useProjectActions = () => {
  const createProject = useProjectsStore((state) => state.createProject);
  const updateProject = useProjectsStore((state) => state.updateProject);
  const deleteProject = useProjectsStore((state) => state.deleteProject);
  const getProjectById = useProjectsStore((state) => state.getProjectById);
  
  return {
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
  };
};

export const useLatticeActions = () => {
  const createLattice = useProjectsStore((state) => state.createLattice);
  const updateLattice = useProjectsStore((state) => state.updateLattice);
  const deleteLattice = useProjectsStore((state) => state.deleteLattice);
  const getLatticeById = useProjectsStore((state) => state.getLatticeById);
  
  return {
    createLattice,
    updateLattice,
    deleteLattice,
    getLatticeById,
  };
};

export const useProjectById = (projectId: string | undefined) => {
  return useProjectsStore((state) => 
    projectId ? state.projects.find(p => p.documentId === projectId) : undefined
  );
};

export const useLatticeById = (latticeId: string | undefined) => {
  return useProjectsStore((state) => 
    latticeId ? state.lattices.find(l => l.documentId === latticeId) : undefined
  );
};
