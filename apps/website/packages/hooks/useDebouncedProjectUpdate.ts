import { useCallback, useRef } from 'react';
import { useMeepProjects } from './useMeepProjects';
import { MeepProject } from '../types/meepProjectTypes';

/**
 * Hook to provide debounced project updates.
 * This prevents excessive persistence calls when user is making rapid changes.
 */
export const useDebouncedProjectUpdate = (project: MeepProject, delay: number = 300) => {
  const { updateProject } = useMeepProjects();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<MeepProject>>({});

  const debouncedUpdateProject = useCallback((updates: Partial<MeepProject>) => {
    // Merge with any pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // Handle scene updates specifically to avoid type issues
    if (updates.scene) {
      pendingUpdatesRef.current.scene = {
        ...pendingUpdatesRef.current.scene,
        ...updates.scene,
      };
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      // Apply all pending updates at once
      updateProject({
        documentId: project.documentId,
        project: pendingUpdatesRef.current,
      });
      
      // Clear pending updates
      pendingUpdatesRef.current = {};
      timeoutRef.current = null;
    }, delay);
  }, [updateProject, project.documentId, delay]);

  // Immediate update function for when debouncing is not desired
  const immediateUpdateProject = useCallback((updates: Partial<MeepProject>) => {
    // Cancel any pending debounced update
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Clear pending updates since we're doing immediate update
    pendingUpdatesRef.current = {};
    
    // Apply update immediately
    updateProject({
      documentId: project.documentId,
      project: updates,
    });
  }, [updateProject, project.documentId]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    debouncedUpdateProject,
    immediateUpdateProject,
    cleanup,
  };
};
