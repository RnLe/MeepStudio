// src/hooks/useMeepProjects.ts
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MeepProject } from "../types/meepProjectTypes";
import { Lattice } from "../types/meepLatticeTypes";
import { useProjectsStore } from "../stores/projects";
import { createLocalStorageService, createRemoteService } from "../services/projectService";
import { useEditorStateStore } from "../providers/EditorStateStore";

export const useMeepProjects = ({ ghPages }: { ghPages: boolean }) => {
  const queryClient = useQueryClient();
  const { setProjects, setLattices } = useProjectsStore();
  const { setProjectManagementFunctions, setLatticeManagementFunctions } = useEditorStateStore();

  // Choose service based on environment
  const service = React.useMemo(
    () => ghPages ? createLocalStorageService() : createRemoteService(),
    [ghPages]
  );

  // Projects query
  const projectsQuery = useQuery({
    queryKey: ["meepProjects", ghPages ? "local" : "remote"],
    queryFn: service.fetchProjects,
    staleTime: ghPages ? Infinity : 1000 * 60 * 5,
    refetchOnWindowFocus: !ghPages,
  });

  // Sync to store
  React.useEffect(() => {
    if (projectsQuery.data) {
      setProjects(projectsQuery.data);
    }
  }, [projectsQuery.data, setProjects]);

  // Lattices query
  const latticesQuery = useQuery({
    queryKey: ["meepLattices", ghPages ? "local" : "remote"],
    queryFn: service.fetchLattices,
    staleTime: ghPages ? Infinity : 1000 * 60 * 5,
    refetchOnWindowFocus: !ghPages,
  });

  // Set lattices in store when they change
  React.useEffect(() => {
    if (latticesQuery.data) {
      setLattices(latticesQuery.data);
    }
  }, [latticesQuery.data, setLattices]);

  /* CREATE */
  const createProjectMutation = useMutation({
    mutationFn: service.createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  const updateProjectMutation = useMutation({
    mutationFn: service.updateProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: service.deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  // Lattice mutations
  const createLatticeMutation = useMutation({
    mutationFn: (lattice: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) =>
      service.createLattice(lattice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meepLattices"] });
    }
  });

  const updateLatticeMutation = useMutation({
    mutationFn: service.updateLattice,
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["meepLattices"] });
      }
    }
  });

  const deleteLatticeMutation = useMutation({
    mutationFn: service.deleteLattice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meepLattices"] });
    }
  });

  // Initialize store functions
  React.useEffect(() => {
    const createFn = async (lattice: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) => {
      // Correct usage: pass lattice directly, not as { lattice }
      const result = await createLatticeMutation.mutateAsync(lattice);
      return result;
    };
    const deleteFn = async (id: string) => {
      await deleteLatticeMutation.mutateAsync(id);
    };
    setLatticeManagementFunctions(createFn, deleteFn);
  }, [setLatticeManagementFunctions]);

  return {
    // Data from queries
    projects: projectsQuery.data || [],
    lattices: latticesQuery.data || [],
    isLoading: projectsQuery.isLoading || latticesQuery.isLoading,
    error: projectsQuery.error || latticesQuery.error,
    
    // Mutations
    createProject: createProjectMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
    createLattice: (lattice: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) =>
      createLatticeMutation.mutateAsync(lattice),
    updateLattice: updateLatticeMutation.mutateAsync,
    deleteLattice: deleteLatticeMutation.mutateAsync,
    
    // Store methods for computed values
    getProjectsUsingLattice: useProjectsStore.getState().getProjectsUsingLattice,
    getLatticesUsedByProject: useProjectsStore.getState().getLatticesUsedByProject,

    // Relationship methods from store
    linkLatticeToProject: useProjectsStore.getState().linkLatticeToProject,
    unlinkLatticeFromProject: useProjectsStore.getState().unlinkLatticeFromProject,
    syncCanvasLatticesWithFullLattice: useProjectsStore.getState().syncCanvasLatticesWithFullLattice,
  };
};
