import { StateCreator } from 'zustand';
import { EditorStore, LatticeSlice } from '../types';

export const createLatticeSlice: StateCreator<
  EditorStore,
  [],
  [],
  LatticeSlice
> = (set, get) => ({
  selectedLatticeIds: new Set<string>(),
  lastSelectedLatticeId: null,
  isEditingLattice: false,
  createLatticeFn: null,
  deleteLatticeFn: null,
  
  setIsEditingLattice: (editing) => {
    set({ isEditingLattice: editing });
  },
  
  openLattice: (lattice) => {
    const { openTab } = get();
    
    openTab({
      id: `lattice-${lattice.documentId}`,
      type: "lattice",
      title: lattice.title,
      latticeId: lattice.documentId,
    });
    
    // Clear selections and select this lattice
    const newLatticeSelection = new Set<string>();
    newLatticeSelection.add(lattice.documentId);
    set({ 
      selectedLatticeIds: newLatticeSelection,
      lastSelectedLatticeId: lattice.documentId,
    });
    
    // Clear project selection through the project slice
    const { setSelectedProjects } = get();
    setSelectedProjects(new Set<string>());
  },
  
  closeLattice: (latticeId) => {
    const { closeTab, openTabs } = get();
    const latticeTab = openTabs.find(t => t.id === `lattice-${latticeId}`);
    if (latticeTab) {
      closeTab(latticeTab.id);
    }
  },
  
  setActiveLattice: (latticeId) => {
    const { openTabs, setRightSidebarOpen, selectedLatticeIds } = get();
    const latticeTab = openTabs.find(t => t.id === `lattice-${latticeId}`);
    
    if (latticeTab) {
      get().setActiveTab(latticeTab.id);
    } else {
      // If tab doesn't exist, we need to get lattice data from ProjectsStore
      // The UI component should handle opening lattices via useMeepProjects
      console.warn(`Lattice tab not found for latticeId: ${latticeId}`);
    }
    
    // Add to lattice selection
    const newLatticeSelection = new Set(selectedLatticeIds);
    newLatticeSelection.add(latticeId);
    
    setRightSidebarOpen(true);
    set({ 
      selectedLatticeIds: newLatticeSelection,
      lastSelectedLatticeId: latticeId,
    });
    
    // Clear project selection through the project slice
    const { setSelectedProjects } = get();
    setSelectedProjects(new Set<string>());
  },
  
  setSelectedLattices: (ids) => {
    set({ selectedLatticeIds: ids });
  },
  
  toggleLatticeSelection: (latticeId, isMulti, isRange) => {
    const { selectedLatticeIds, lastSelectedLatticeId, activeTabId, openTabs } = get();
    const activeTab = openTabs.find(t => t.id === activeTabId);
    const newSelection = new Set(selectedLatticeIds);
    
    // Always ensure active lattice is selected
    if (activeTab?.latticeId && !newSelection.has(activeTab.latticeId)) {
      newSelection.add(activeTab.latticeId);
    }
    
    if (isRange && lastSelectedLatticeId) {
      // For range selection, we need to get lattice data from ProjectsStore
      // This should be handled by the UI component that has access to useMeepProjects
      console.warn('Range selection requires lattice data - handle in UI component');
    } else if (isMulti) {
      // Toggle selection - but don't allow deselecting the active lattice
      if (newSelection.has(latticeId)) {
        if (latticeId !== activeTab?.latticeId) {
          newSelection.delete(latticeId);
        }
      } else {
        newSelection.add(latticeId);
      }
    } else {
      // Single selection - clear others but keep active
      newSelection.clear();
      if (activeTab?.latticeId) {
        newSelection.add(activeTab.latticeId);
      }
      newSelection.add(latticeId);
    }
    
    set({ 
      selectedLatticeIds: newSelection,
      lastSelectedLatticeId: latticeId
    });
  },
  
  setLatticeManagementFunctions: (createFn, deleteFn) => {
    set({ 
      createLatticeFn: createFn,
      deleteLatticeFn: deleteFn,
    });
  },
  
  createLattice: async (lattice) => {
    const { createLatticeFn, openLattice } = get();
    if (!createLatticeFn) {
      console.error("Create lattice function not initialized");
      return;
    }
    
    try {
      const newLattice = await createLatticeFn(lattice);
      openLattice(newLattice);
      return newLattice;
    } catch (error) {
      console.error("Failed to create lattice", error);
      throw error;
    }
  },
  
  deleteLattice: async (id) => {
    const { deleteLatticeFn, closeLattice } = get();
    if (!deleteLatticeFn) {
      console.error("Delete lattice function not initialized");
      return;
    }
    
    try {
      await deleteLatticeFn(id);
      closeLattice(id);
    } catch (error) {
      console.error("Failed to delete lattice", error);
      throw error;
    }
  },
});
