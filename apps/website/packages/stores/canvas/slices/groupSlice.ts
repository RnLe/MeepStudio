import { StateCreator } from 'zustand';
import { CanvasStore, GroupSlice } from '../types';

export const createGroupSlice: StateCreator<
  CanvasStore,
  [],
  [],
  GroupSlice
> = (set, get) => ({
  groups: [],
  
  setGroups: (groups) => set({ 
    groups: groups.map(g => ({
      ...g,
      center: g.center || g.pos || { x: 0, y: 0 },
      orientation: g.orientation || 0,
      children: g.children || []
    }))
  }),
  
  addGroup: (group) => set((s) => ({ 
    groups: [...s.groups, { 
      ...group, 
      center: group.center || group.pos || { x: 0, y: 0 },
      orientation: group.orientation || 0,
      children: group.children || []
    }] 
  })),
  
  updateGroup: (id, partial) => set((s) => ({
    groups: s.groups.map(g => {
      if (g.id === id) {
        const updated = { ...g, ...partial };
        if (partial.pos || partial.x !== undefined || partial.y !== undefined) {
          updated.center = updated.pos || { x: updated.x, y: updated.y };
        }
        return updated;
      }
      return g;
    }),
  })),
  
  removeGroup: (id) => set((s) => {
    const group = s.groups.find(g => g.id === id);
    if (!group) return s;
    
    // Unparent all children
    const updates: any = {};
    if (group.children?.length > 0) {
      updates.geometries = s.geometries.map(g => 
        group.children.includes(g.id) ? { ...g, parent: undefined } : g
      );
      updates.sources = s.sources.map(src => 
        group.children.includes(src.id) ? { ...src, parent: undefined } : src
      );
      updates.boundaries = s.boundaries.map(b => 
        group.children.includes(b.id) ? { ...b, parent: undefined } : b
      );
      updates.lattices = s.lattices.map(l => 
        group.children.includes(l.id) ? { ...l, parent: undefined } : l
      );
      updates.groups = s.groups
        .filter(g => g.id !== id)
        .map(g => group.children.includes(g.id) ? { ...g, parent: undefined } : g);
    } else {
      updates.groups = s.groups.filter(g => g.id !== id);
    }
    
    return {
      ...updates,
      selectedGeometryIds: s.selectedGeometryIds.filter(selId => selId !== id),
      selectedGeometryId: s.selectedGeometryId === id ? null : s.selectedGeometryId,
    };
  }),
  
  removeGroups: (ids) => set((s) => {
    let newState = { ...s };
    ids.forEach(id => {
      const group = newState.groups.find(g => g.id === id);
      if (group?.children?.length > 0) {
        // Unparent children
        newState.geometries = newState.geometries.map(g => 
          group.children.includes(g.id) ? { ...g, parent: undefined } : g
        );
        newState.sources = newState.sources.map(src => 
          group.children.includes(src.id) ? { ...src, parent: undefined } : src
        );
        newState.boundaries = newState.boundaries.map(b => 
          group.children.includes(b.id) ? { ...b, parent: undefined } : b
        );
        newState.lattices = newState.lattices.map(l => 
          group.children.includes(l.id) ? { ...l, parent: undefined } : l
        );
        newState.groups = newState.groups.map(g => 
          group.children.includes(g.id) ? { ...g, parent: undefined } : g
        );
      }
    });
    
    return {
      ...newState,
      groups: newState.groups.filter(g => !ids.includes(g.id)),
      selectedGeometryIds: s.selectedGeometryIds.filter(selId => !ids.includes(selId)),
      selectedGeometryId: s.selectedGeometryId && ids.includes(s.selectedGeometryId) ? null : s.selectedGeometryId,
    };
  }),
  
  // Group hierarchy methods
  addChildToGroup: (groupId, childId) => set((s) => {
    // Prevent circular references
    if (get().isDescendantOf(groupId, childId)) {
      console.warn('Cannot add parent as child - would create circular reference');
      return s;
    }
    
    const updates: any = {
      groups: s.groups.map(g => {
        if (g.id === groupId) {
          return { ...g, children: [...(g.children || []), childId] };
        }
        // Remove from other groups
        if (g.children?.includes(childId)) {
          return { ...g, children: g.children.filter((id: string) => id !== childId) };
        }
        return g;
      })
    };
    
    // Update parent reference on child
    const updateParent = (items: any[]) => 
      items.map(item => item.id === childId ? { ...item, parent: groupId } : item);
    
    updates.geometries = updateParent(s.geometries);
    updates.sources = updateParent(s.sources);
    updates.boundaries = updateParent(s.boundaries);
    updates.lattices = updateParent(s.lattices);
    updates.groups = updateParent(updates.groups);
    
    return updates;
  }),
  
  removeChildFromGroup: (groupId, childId) => set((s) => {
    const updates: any = {
      groups: s.groups.map(g => {
        if (g.id === groupId && g.children?.includes(childId)) {
          return { ...g, children: g.children.filter((id: string) => id !== childId) };
        }
        return g;
      })
    };
    
    // Remove parent reference
    const removeParent = (items: any[]) => 
      items.map(item => item.id === childId ? { ...item, parent: undefined } : item);
    
    updates.geometries = removeParent(s.geometries);
    updates.sources = removeParent(s.sources);
    updates.boundaries = removeParent(s.boundaries);
    updates.lattices = removeParent(s.lattices);
    updates.groups = removeParent(updates.groups);
    
    return updates;
  }),
  
  getGroupChildren: (groupId) => {
    const state = get();
    const group = state.groups.find(g => g.id === groupId);
    if (!group?.children) return [];
    
    const allElements = state.getAllElements();
    return group.children
      .map((childId: string) => allElements.find(el => el.id === childId))
      .filter(Boolean);
  },
  
  getGroupChildrenIds: (groupId) => {
    const group = get().groups.find(g => g.id === groupId);
    return group?.children || [];
  },
  
  moveChildToGroup: (childId, fromGroupId, toGroupId) => {
    if (fromGroupId) {
      get().removeChildFromGroup(fromGroupId, childId);
    }
    if (toGroupId) {
      get().addChildToGroup(toGroupId, childId);
    }
  },
  
  // Group utilities
  getElementParentGroup: (elementId) => {
    return get().groups.find(g => g.children?.includes(elementId)) || null;
  },
  
  getAllDescendants: (groupId) => {
    const descendants: any[] = [];
    const visited = new Set<string>();
    
    const collectDescendants = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const children = get().getGroupChildren(id);
      children.forEach(child => {
        descendants.push(child);
        if (child.type === 'group') {
          collectDescendants(child.id);
        }
      });
    };
    
    collectDescendants(groupId);
    return descendants;
  },
  
  getAllAncestors: (elementId) => {
    const ancestors: any[] = [];
    let currentId = elementId;
    
    while (true) {
      const parent = get().getElementParentGroup(currentId);
      if (!parent) break;
      ancestors.push(parent);
      currentId = parent.id;
    }
    
    return ancestors;
  },
  
  isDescendantOf: (elementId, groupId) => {
    const ancestors = get().getAllAncestors(elementId);
    return ancestors.some(a => a.id === groupId);
  },
  
  flattenGroup: (groupId) => {
    const state = get();
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;
    
    const parent = state.getElementParentGroup(groupId);
    const descendants = state.getAllDescendants(groupId);
    
    // Move all descendants to parent (or root)
    descendants.forEach(desc => {
      state.moveChildToGroup(desc.id, null, parent?.id || null);
    });
    
    // Remove the group
    state.removeGroup(groupId);
  },
  
  // Material propagation
  propagateGroupMaterial: (groupId) => {
    const state = get();
    const group = state.groups.find(g => g.id === groupId);
    if (!group?.material) return;
    
    const descendants = state.getAllDescendants(groupId);
    descendants.forEach(desc => {
      if (desc.type === 'cylinder' || desc.type === 'rectangle' || desc.type === 'triangle') {
        state.updateGeometry(desc.id, { material: group.material });
      } else if (desc.type === 'group') {
        state.updateGroup(desc.id, { material: group.material });
      }
    });
  },
  
  // Selection helpers
  selectGroupWithChildren: (groupId, includeDescendants = false) => {
    const state = get();
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;
    
    const idsToSelect = [groupId];
    
    if (includeDescendants) {
      const descendants = state.getAllDescendants(groupId);
      idsToSelect.push(...descendants.map(d => d.id));
    } else {
      idsToSelect.push(...(group.children || []));
    }
    
    state.setSelectedGeometryIds(idsToSelect);
  },
});
