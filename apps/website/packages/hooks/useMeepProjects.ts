// src/hooks/useMeepProjects.ts
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MeepProject } from "../types/meepProjectTypes";
import { Lattice } from "../types/meepLatticeTypes";
import { ghPagesSvc } from "./ghPagesProjectsStore";
import { nanoid } from "nanoid";
import { useEditorStateStore } from "../providers/EditorStateStore";
import { getWasmModule } from "../utils/wasmLoader";

/* ---------- File System Helper ---------- */
async function getRootDirectoryHandle(): Promise<FileSystemDirectoryHandle> {
  if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
    throw new Error('File System Access API not available');
  }
  return await (window as any).showDirectoryPicker();
}

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
export const useMeepProjects = ({ ghPages }: { ghPages: boolean }) => {
  const queryClient = useQueryClient();
  const qc = queryClient; // Fix for qc references
  const { setProjects, setLattices, setIsLoading, setProjectManagementFunctions, setLatticeManagementFunctions } = useEditorStateStore();

  // Choose service based on ghPages flag
  const service = ghPages ? ghPagesSvc : remoteSvc;

  /* READ */
  const projectsQuery = useQuery({
    queryKey: ["meepProjects"],
    queryFn: service.fetchProjects,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Lattices query
  const latticesQuery = useQuery({
    queryKey: ["meepLattices", ghPages ? "gh-pages" : "local"],
    queryFn: async () => {
      if (ghPages) {
        // Use ghPages service for lattices
        return await ghPagesSvc.fetchLattices();
      } else {
        // For local filesystem
        const lattices: Lattice[] = [];
        
        // Check if we have access to filesystem
        if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
          // Browser with File System Access API
          try {
            // Get or create lattices directory
            const rootHandle = await getRootDirectoryHandle();
            let latticesHandle;
            try {
              latticesHandle = await rootHandle.getDirectoryHandle('lattices');
            } catch {
              latticesHandle = await rootHandle.getDirectoryHandle('lattices', { create: true });
            }
            
            // Read all lattice files
            for await (const [name, entry] of (latticesHandle as any).entries()) {
              if (entry.kind === 'file' && name.endsWith('.json')) {
                const file = await entry.getFile();
                const text = await file.text();
                try {
                  const lattice = JSON.parse(text) as Lattice;
                  lattices.push(lattice);
                } catch (e) {
                  console.error(`Failed to parse lattice ${name}:`, e);
                }
              }
            }
          } catch (e) {
            console.error('Failed to read lattices:', e);
          }
        }
        
        return lattices;
      }
    },
    staleTime: ghPages ? Infinity : 5000,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  const updateProjectMutation = useMutation({
    mutationFn: service.updateProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: service.deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meepProjects"] }),
  });

  // Lattice mutations
  const createLatticeMutation = useMutation({
    mutationFn: async (params: { lattice: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">> }) => {
      if (ghPages) {
        // Use ghPages service
        const result = await ghPagesSvc.createLattice(params.lattice);
        if (!result) throw new Error("Failed to create lattice");
        return result;
      } else {
        // Save to filesystem
        const now = new Date().toISOString();
        const meepLattice = params.lattice.meepLattice || {
          basis1: { x: 1, y: 0, z: 0 },
          basis2: { x: 0, y: 1, z: 0 },
          basis3: { x: 0, y: 0, z: 1 },
          basis_size: { x: 1, y: 1, z: 1 }
        };
        
        // Ensure basis3 exists
        if (!meepLattice.basis3) {
          meepLattice.basis3 = { x: 0, y: 0, z: 1 };
        }
        
        // Calculate reciprocal basis and transformation matrices using WASM
        try {
          const wasm = await getWasmModule();
          
          // Get scaled basis vectors
          const a1 = {
            x: meepLattice.basis1.x * meepLattice.basis_size.x,
            y: meepLattice.basis1.y * meepLattice.basis_size.y,
            z: meepLattice.basis1.z * meepLattice.basis_size.z
          };
          const a2 = {
            x: meepLattice.basis2.x * meepLattice.basis_size.x,
            y: meepLattice.basis2.y * meepLattice.basis_size.y,
            z: meepLattice.basis2.z * meepLattice.basis_size.z
          };
          const a3 = {
            x: meepLattice.basis3.x * meepLattice.basis_size.x,
            y: meepLattice.basis3.y * meepLattice.basis_size.y,
            z: meepLattice.basis3.z * meepLattice.basis_size.z
          };
          
          // For 2D lattices, calculate reciprocal basis manually
          if (Math.abs(a1.z) < 1e-10 && Math.abs(a2.z) < 1e-10) {
            // Calculate 2D reciprocal basis
            const det = a1.x * a2.y - a1.y * a2.x;
            if (Math.abs(det) < 1e-14) {
              throw new Error("Basis vectors are collinear - cannot build reciprocal lattice.");
            }
            
            const factor = 2 * Math.PI / det;
            meepLattice.reciprocal_basis1 = { 
              x: a2.y * factor, 
              y: -a2.x * factor,
              z: 0 
            };
            meepLattice.reciprocal_basis2 = { 
              x: -a1.y * factor, 
              y: a1.x * factor,
              z: 0 
            };
            meepLattice.reciprocal_basis3 = { x: 0, y: 0, z: 2 * Math.PI / a3.z };
          }
          
          // Calculate 3D transformation matrices
          if (wasm.calculate_lattice_transformations_3d) {
            const matrices = wasm.calculate_lattice_transformations_3d(
              a1.x, a1.y, a1.z,
              a2.x, a2.y, a2.z,
              a3.x, a3.y, a3.z,
              meepLattice.reciprocal_basis1!.x, meepLattice.reciprocal_basis1!.y, meepLattice.reciprocal_basis1!.z,
              meepLattice.reciprocal_basis2!.x, meepLattice.reciprocal_basis2!.y, meepLattice.reciprocal_basis2!.z,
              meepLattice.reciprocal_basis3!.x, meepLattice.reciprocal_basis3!.y, meepLattice.reciprocal_basis3!.z
            );
            
            meepLattice.transformationMatrices = matrices;
          } else if (wasm.calculate_lattice_transformations) {
            // Fallback to 2D version
            const matrices2d = wasm.calculate_lattice_transformations(
              a1.x, a1.y,
              a2.x, a2.y,
              meepLattice.reciprocal_basis1!.x, meepLattice.reciprocal_basis1!.y,
              meepLattice.reciprocal_basis2!.x, meepLattice.reciprocal_basis2!.y
            );
            
            // Convert 2x2 matrices to 3x3
            const expandMatrix = (m: any): number[][] => {
              if (!m || !Array.isArray(m)) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
              return [
                [m[0][0], m[0][1], 0],
                [m[1][0], m[1][1], 0],
                [0, 0, 1]
              ];
            };
            
            meepLattice.transformationMatrices = {
              MA: expandMatrix(matrices2d.MA),
              MA_inv: expandMatrix(matrices2d.MA_inv),
              MB: expandMatrix(matrices2d.MB),
              MB_inv: expandMatrix(matrices2d.MB_inv),
              realToReciprocal: expandMatrix(matrices2d.realToReciprocal),
              reciprocalToReal: expandMatrix(matrices2d.reciprocalToReal)
            };
          }
        } catch (error) {
          console.error("Failed to calculate reciprocal lattice:", error);
        }
        
        const newLattice: Lattice = {
          documentId: nanoid(),
          createdAt: now,
          updatedAt: now,
          title: params.lattice.title || "Untitled Lattice",
          description: params.lattice.description,
          latticeType: params.lattice.latticeType || "square",
          meepLattice,
          parameters: params.lattice.parameters || { a: 1, b: 1, alpha: 90 },
          displaySettings: params.lattice.displaySettings || {
            showWignerSeitz: false,
            showBrillouinZone: false,
            showHighSymmetryPoints: false,
            showReciprocal: false,
          }
        };

        // Save to filesystem
        const rootHandle = await getRootDirectoryHandle();
        let latticesHandle;
        try {
          latticesHandle = await rootHandle.getDirectoryHandle('lattices');
        } catch {
          latticesHandle = await rootHandle.getDirectoryHandle('lattices', { create: true });
        }
        
        const fileHandle = await latticesHandle.getFileHandle(`${newLattice.documentId}.json`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(newLattice, null, 2));
        await writable.close();
        
        return newLattice;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meepLattices"] });
    }
  });

  const updateLatticeMutation = useMutation({
    mutationFn: async (params: { documentId: string; lattice: Partial<Lattice> }) => {
      if (ghPages) {
        // Use ghPages service
        const result = await ghPagesSvc.updateLattice(params);
        if (!result) throw new Error("Lattice not found");
        return result;
      } else {
        // Save to filesystem
        const existingLattice = latticesQuery.data?.find(l => l.documentId === params.documentId);
        if (!existingLattice) throw new Error("Lattice not found");

        const updatedLattice: Lattice = {
          ...existingLattice,
          ...params.lattice,
          updatedAt: new Date().toISOString(),
        };
        
        // Ensure basis3 exists
        if (updatedLattice.meepLattice && !updatedLattice.meepLattice.basis3) {
          updatedLattice.meepLattice.basis3 = { x: 0, y: 0, z: 1 };
        }
        
        // Recalculate reciprocal vectors if basis vectors changed
        if (params.lattice.meepLattice && (params.lattice.meepLattice.basis1 || params.lattice.meepLattice.basis2 || params.lattice.meepLattice.basis3)) {
          const basis1 = params.lattice.meepLattice.basis1 || existingLattice.meepLattice.basis1;
          const basis2 = params.lattice.meepLattice.basis2 || existingLattice.meepLattice.basis2;
          const basis3 = params.lattice.meepLattice.basis3 || existingLattice.meepLattice.basis3 || { x: 0, y: 0, z: 1 };
          const basis_size = params.lattice.meepLattice.basis_size || existingLattice.meepLattice.basis_size;
          
          try {
            const wasm = await getWasmModule();
            
            // Get scaled basis vectors
            const a1 = {
              x: basis1.x * basis_size.x,
              y: basis1.y * basis_size.y,
              z: basis1.z * basis_size.z
            };
            const a2 = {
              x: basis2.x * basis_size.x,
              y: basis2.y * basis_size.y,
              z: basis2.z * basis_size.z
            };
            const a3 = {
              x: basis3.x * basis_size.x,
              y: basis3.y * basis_size.y,
              z: basis3.z * basis_size.z
            };
            
            // For 2D lattices, calculate reciprocal basis manually
            if (Math.abs(a1.z) < 1e-10 && Math.abs(a2.z) < 1e-10) {
              // Calculate 2D reciprocal basis
              const det = a1.x * a2.y - a1.y * a2.x;
              if (Math.abs(det) < 1e-14) {
                throw new Error("Basis vectors are collinear - cannot build reciprocal lattice.");
              }
              
              const factor = 2 * Math.PI / det;
              updatedLattice.meepLattice.reciprocal_basis1 = { 
                x: a2.y * factor, 
                y: -a2.x * factor,
                z: 0 
              };
              updatedLattice.meepLattice.reciprocal_basis2 = { 
                x: -a1.y * factor, 
                y: a1.x * factor,
                z: 0 
              };
              updatedLattice.meepLattice.reciprocal_basis3 = { x: 0, y: 0, z: 2 * Math.PI / a3.z };
            }
            
            if (wasm.calculate_lattice_transformations_3d) {
              const matrices = wasm.calculate_lattice_transformations_3d(
                a1.x, a1.y, a1.z,
                a2.x, a2.y, a2.z,
                a3.x, a3.y, a3.z,
                updatedLattice.meepLattice.reciprocal_basis1!.x, updatedLattice.meepLattice.reciprocal_basis1!.y, updatedLattice.meepLattice.reciprocal_basis1!.z,
                updatedLattice.meepLattice.reciprocal_basis2!.x, updatedLattice.meepLattice.reciprocal_basis2!.y, updatedLattice.meepLattice.reciprocal_basis2!.z,
                updatedLattice.meepLattice.reciprocal_basis3!.x, updatedLattice.meepLattice.reciprocal_basis3!.y, updatedLattice.meepLattice.reciprocal_basis3!.z
              );
              
              updatedLattice.meepLattice.transformationMatrices = matrices;
            } else if (wasm.calculate_lattice_transformations) {
              // Fallback to 2D version
              const matrices2d = wasm.calculate_lattice_transformations(
                a1.x, a1.y,
                a2.x, a2.y,
                updatedLattice.meepLattice.reciprocal_basis1!.x, updatedLattice.meepLattice.reciprocal_basis1!.y,
                updatedLattice.meepLattice.reciprocal_basis2!.x, updatedLattice.meepLattice.reciprocal_basis2!.y
              );
              
              // Convert 2x2 matrices to 3x3
              const expandMatrix = (m: any): number[][] => {
                if (!m || !Array.isArray(m)) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
                return [
                  [m[0][0], m[0][1], 0],
                  [m[1][0], m[1][1], 0],
                  [0, 0, 1]
                ];
              };
              
              updatedLattice.meepLattice.transformationMatrices = {
                MA: expandMatrix(matrices2d.MA),
                MA_inv: expandMatrix(matrices2d.MA_inv),
                MB: expandMatrix(matrices2d.MB),
                MB_inv: expandMatrix(matrices2d.MB_inv),
                realToReciprocal: expandMatrix(matrices2d.realToReciprocal),
                reciprocalToReal: expandMatrix(matrices2d.reciprocalToReal)
              };
            }
          } catch (error) {
            console.error("Failed to calculate reciprocal lattice:", error);
          }
        }

        // Save to filesystem
        const rootHandle = await getRootDirectoryHandle();
        const latticesHandle = await rootHandle.getDirectoryHandle('lattices');
        const fileHandle = await latticesHandle.getFileHandle(`${params.documentId}.json`);
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(updatedLattice, null, 2));
        await writable.close();

        return updatedLattice;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meepLattices"] });
    }
  });

  const deleteLatticeMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (ghPages) {
        // Use ghPages service
        await ghPagesSvc.deleteLattice(documentId);
      } else {
        // Delete from filesystem
        const rootHandle = await getRootDirectoryHandle();
        const latticesHandle = await rootHandle.getDirectoryHandle('lattices');
        await latticesHandle.removeEntry(`${documentId}.json`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meepLattices"] });
    }
  });

  // Initialize store functions
  React.useEffect(() => {
    const createFn = async (lattice: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) => {
      const result = await createLatticeMutation.mutateAsync({ lattice });
      return result;
    };
    
    const deleteFn = async (id: string) => {
      await deleteLatticeMutation.mutateAsync(id);
    };
    
    setLatticeManagementFunctions(createFn, deleteFn);
  }, [setLatticeManagementFunctions]);

  return {
    projects: projectsQuery.data || [],
    lattices: latticesQuery.data || [],
    isLoading: projectsQuery.isLoading || latticesQuery.isLoading,
    error: projectsQuery.error || latticesQuery.error,
    createProject: (project: Partial<Omit<MeepProject, "documentId" | "createdAt" | "updatedAt">>) =>
      createProjectMutation.mutateAsync(project),
    updateProject: (params: { documentId: string; project: Partial<MeepProject> }) =>
      updateProjectMutation.mutateAsync(params),
    deleteProject: (documentId: string) =>
      deleteProjectMutation.mutateAsync(documentId),
    createLattice: (lattice: Partial<Omit<Lattice, "documentId" | "createdAt" | "updatedAt">>) =>
      createLatticeMutation.mutateAsync({ lattice }),
    updateLattice: (params: { documentId: string; lattice: Partial<Lattice> }) =>
      updateLatticeMutation.mutateAsync(params),
    deleteLattice: (documentId: string) =>
      deleteLatticeMutation.mutateAsync(documentId),
  };
};
