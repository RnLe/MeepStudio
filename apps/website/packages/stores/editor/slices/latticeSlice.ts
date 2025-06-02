import { StateCreator } from 'zustand';
import { EditorStore, LatticeSlice } from '../types';

export const createLatticeSlice: StateCreator<
  EditorStore,
  [],
  [],
  LatticeSlice
> = (set, get) => ({
  lattices: [],
  selectedLatticeIds: new Set<string>(),
  lastSelectedLatticeId: null,
  isEditingLattice: false,
  createLatticeFn: null,
  deleteLatticeFn: null,
  
  setLattices: (lattices) => {
    set({ lattices });
  },
  
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
      selectedProjectIds: new Set<string>(),
      lastSelectedLatticeId: lattice.documentId,
      lastSelectedProjectId: null
    });
  },
  
  closeLattice: (latticeId) => {
    const { closeTab, openTabs } = get();
    const latticeTab = openTabs.find(t => t.id === `lattice-${latticeId}`);
    if (latticeTab) {
      closeTab(latticeTab.id);
    }
  },
  
  setActiveLattice: (latticeId) => {
    const { openTabs, setRightSidebarOpen, selectedLatticeIds, lattices } = get();
    const latticeTab = openTabs.find(t => t.id === `lattice-${latticeId}`);
    
    if (latticeTab) {
      get().setActiveTab(latticeTab.id);
    } else {
      // If tab doesn't exist, open the lattice
      const lattice = lattices.find(l => l.documentId === latticeId);
      if (lattice) {
        get().openLattice(lattice);
      }
    }
    
    // Add to lattice selection
    const newLatticeSelection = new Set(selectedLatticeIds);
    newLatticeSelection.add(latticeId);
    
    setRightSidebarOpen(true);
    set({ 
      selectedLatticeIds: newLatticeSelection,
      selectedProjectIds: new Set<string>(),
      lastSelectedLatticeId: latticeId,
      lastSelectedProjectId: null
    });
  },
  
  getActiveLattice: () => {
    const { lattices, activeTabId, openTabs } = get();
    const activeTab = openTabs.find(t => t.id === activeTabId);
    if (activeTab?.latticeId) {
      return lattices.find(l => l.documentId === activeTab.latticeId);
    }
    return undefined;
  },
  
  setSelectedLattices: (ids) => {
    set({ selectedLatticeIds: ids });
  },
  
  toggleLatticeSelection: (latticeId, isMulti, isRange) => {
    const { selectedLatticeIds, lastSelectedLatticeId, lattices, activeTabId, openTabs } = get();
    const activeTab = openTabs.find(t => t.id === activeTabId);
    const newSelection = new Set(selectedLatticeIds);
    
    // Always ensure active lattice is selected
    if (activeTab?.latticeId && !newSelection.has(activeTab.latticeId)) {
      newSelection.add(activeTab.latticeId);
    }
    
    if (isRange && lastSelectedLatticeId) {
      // Sort lattices alphabetically
      const sortedLattices = [...lattices].sort((a, b) => a.title.localeCompare(b.title));
      const lastIndex = sortedLattices.findIndex(l => l.documentId === lastSelectedLatticeId);
      const currentIndex = sortedLattices.findIndex(l => l.documentId === latticeId);
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        
        for (let i = start; i <= end; i++) {
          newSelection.add(sortedLattices[i].documentId);
        }
      }
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
