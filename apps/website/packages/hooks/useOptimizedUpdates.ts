import { useCallback, useRef } from 'react';
import { useCanvasStore } from '../providers/CanvasStore';
import { useMeepProjects } from './useMeepProjects';
import { useEditorStateStore } from '../providers/EditorStateStore';

export const useOptimizedUpdates = () => {
  const { updateProject } = useMeepProjects();
  const { getActiveTab } = useEditorStateStore();
  const { getProjectById } = useMeepProjects();
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  
  // Get the current project from the active tab
  const activeTab = getActiveTab();
  const project = activeTab?.projectId ? getProjectById(activeTab.projectId) : null;
  
  // Get canvas store actions
  const canvasActions = useCanvasStore((s) => ({
    updateGeometry: s.updateGeometry,
    updateSource: s.updateSource,
    updateBoundary: s.updateBoundary,
  }));
  
  // Sync current canvas state to persistent storage
  const syncToPersistentStorage = useCallback(() => {
    if (!project) return;
    
    const currentCanvasState = useCanvasStore.getState();
    updateProject({
      documentId: project.documentId,
      project: {
        scene: {
          ...project.scene,
          geometries: currentCanvasState.geometries,
          sources: currentCanvasState.sources,
          boundaries: currentCanvasState.boundaries,
          lattices: currentCanvasState.lattices,
        }
      },
    });
  }, [project, updateProject]);
  
  // Set drag state to prevent persistence during drag
  const setDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging;
    if (!dragging && persistTimeoutRef.current) {
      // When drag ends, persist immediately
      clearTimeout(persistTimeoutRef.current);
      syncToPersistentStorage();
    }
  }, [syncToPersistentStorage]);
  
  // Immediate update (for real-time UI feedback during typing/sliding)
  const updateImmediate = useCallback((type: 'geometry' | 'source' | 'boundary', id: string, partial: any) => {
    switch (type) {
      case 'geometry':
        canvasActions.updateGeometry(id, partial);
        break;
      case 'source':
        canvasActions.updateSource(id, partial);
        break;
      case 'boundary':
        canvasActions.updateBoundary(id, partial);
        break;
    }
  }, [canvasActions]);
  
  // Deferred update (for persistence on user action completion)
  const updateDeferred = useCallback((type: 'geometry' | 'source' | 'boundary', id: string, partial: any) => {
    // First do immediate update
    updateImmediate(type, id, partial);
    
    // Don't persist if we're dragging
    if (isDraggingRef.current) {
      return;
    }
    
    // Schedule persistence (canceling any pending persistence)
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }
    
    persistTimeoutRef.current = setTimeout(() => {
      syncToPersistentStorage();
    }, 300); // Short delay to batch multiple rapid changes
  }, [updateImmediate, syncToPersistentStorage]);
  
  // Force immediate persistence (for major changes like delete)
  const persistNow = useCallback(() => {
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }
    syncToPersistentStorage();
  }, [syncToPersistentStorage]);
  
  return {
    updateImmediate,
    updateDeferred,
    persistNow,
    setDragging,
    project, // Return the current project
  };
};
