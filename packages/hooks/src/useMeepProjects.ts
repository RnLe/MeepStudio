// src/hooks/useMeepProjects.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MeepProject } from "@meepstudio/types";
import { ghPagesSvc } from "./ghPagesProjectsStore";

/* ---------- Service interface ---------- */
export type Svc = {
  fetchProjects: () => Promise<MeepProject[]>;
  createProject: (p: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) => Promise<MeepProject>;
  updateProject: (d: { documentId: string; project: Partial<MeepProject> }) => Promise<MeepProject | undefined>;
  deleteProject: (id: string) => Promise<void>;
};

declare global {
  interface Window {
    api?: Svc;
  }
}

/* ---------- Detect environment & build service ---------- */
function buildDefaultService(): Svc {
  if (typeof window !== "undefined" && window.api) {
    // Electron path (files on disk)
    return window.api;
  }

  // Browser ↔ Next.js API routes
  const wrapFetch = async <T>(url: string, init?: RequestInit) =>
    fetch(url, init).then((r) => r.json() as Promise<T>);

  return {
    fetchProjects: () => wrapFetch<MeepProject[]>("/api/projects"),
    createProject: (p) =>
      wrapFetch<MeepProject>("/api/projects", {
        method: "POST",
        body: JSON.stringify(p),
      }),
    updateProject: ({ documentId, project }) =>
      wrapFetch<MeepProject>(`/api/projects/${documentId}`, {
        method: "PUT",
        body: JSON.stringify(project),
      }),
    deleteProject: (id) => wrapFetch<void>(`/api/projects/${id}`, { method: "DELETE" }),
  };
}

const remoteSvc = buildDefaultService();

/* ---------- Main hook ---------- */
export function useMeepProjects(opts: { ghPages?: boolean } = {}) {
  const { ghPages = false } = opts;
  const qc = useQueryClient();
  const service = ghPages ? ghPagesSvc : remoteSvc;

  /* READ */
  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["meepProjects"],
    queryFn: service.fetchProjects,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  /* CREATE */
  const createMut = useMutation({
    mutationFn: service.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  /* UPDATE (optimistic) */
  const updateMut = useMutation({
    mutationFn: service.updateProject,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["meepProjects"] });
      const prev = qc.getQueryData<MeepProject[]>(["meepProjects"]);
      if (prev) {
        qc.setQueryData<MeepProject[]>(["meepProjects"], (old) =>
          old!.map((p) => (p.documentId === vars.documentId ? { ...p, ...vars.project } : p)),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) =>
      ctx?.prev && qc.setQueryData(["meepProjects"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  /* DELETE */
  const deleteMut = useMutation({
    mutationFn: service.deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  return {
    projects,
    isLoading,
    error,
    createProject: createMut.mutateAsync,
    updateProject: updateMut.mutateAsync,
    deleteProject: deleteMut.mutateAsync,
  };
}
