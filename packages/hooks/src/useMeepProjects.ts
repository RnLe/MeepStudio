// src/hooks/useMeepProjects.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MeepProject } from "@meepstudio/types";

type Svc = {
  fetchProjects: () => Promise<MeepProject[]>;
  createProject: (p: Partial<MeepProject>) => Promise<MeepProject>;
  updateProject: (d: { documentId: string; project: MeepProject }) => Promise<MeepProject>;
  deleteProject: (id: string) => Promise<void>;
};

declare global {
  interface Window {
    api?: Svc;
  }
}

function getService(): Svc {
  /* --------------------------------------------------------
     If Electron exposes window.api, prefer that.
     Fallback to the Next API routes when we are in the browser
     (dev server, Storybook, unit tests, …)
  --------------------------------------------------------- */
  if (typeof window !== "undefined" && window.api) {
    return window.api;
  }
  // Browser / docker-dev — call Next’s API routes
  const wrapFetch = <T>(url: string, init?: RequestInit) =>
    fetch(url, init).then((r) => r.json() as Promise<T>);

  return {
    fetchProjects: () => wrapFetch<MeepProject[]>("/api/projects"),
    createProject: (p) =>
      wrapFetch<MeepProject>("/api/projects", { method: "POST", body: JSON.stringify(p) }),
    updateProject: ({ documentId, project }) =>
      wrapFetch<MeepProject>(`/api/projects/${documentId}`, {
        method: "PUT",
        body: JSON.stringify(project),
      }),
    deleteProject: (id) => wrapFetch<void>(`/api/projects/${id}`, { method: "DELETE" }),
  };
}

const svc = getService();

export function useMeepProjects() {
  const qc = useQueryClient();

  /* ---------- READ ---------- */
  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery<MeepProject[]>({
    queryKey: ["meepProjects"],
    queryFn: svc.fetchProjects,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  /* ---------- CREATE ---------- */
  const createMut = useMutation({
    mutationFn: svc.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  /* ---------- UPDATE ---------- */
  const updateMut = useMutation({
    mutationFn: svc.updateProject,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["meepProjects"] });
      const prev = qc.getQueryData<MeepProject[]>(["meepProjects"]);
      if (prev) {
        qc.setQueryData<MeepProject[]>(["meepProjects"], (old) =>
          old!.map((p) => (p.documentId === vars.documentId ? vars.project : p))
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["meepProjects"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  /* ---------- DELETE ---------- */
  const deleteMut = useMutation({
    mutationFn: svc.deleteProject,
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