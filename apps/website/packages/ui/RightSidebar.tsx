// src/components/layout/RightSidebar.tsx
import React from "react";
import { X, Pen } from "lucide-react";
import { useEditorStateStore, Tab } from "../providers/EditorStateStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useProjectsStore } from "../stores/projects";
import RightProjectPanel from "./RightProjectPanel";
import RightLatticePanel from "./RightLatticePanel";

interface Props {
  onClose?: () => void;
}

const RightSidebar: React.FC<Props> = ({ onClose }) => {
  // Use individual selectors to avoid object creation
  const getActiveTab = useEditorStateStore((state) => state.getActiveTab);
  const ghPages = useEditorStateStore((state) => state.ghPages);
  const isEditingProject = useEditorStateStore((state) => state.isEditingProject);
  const isEditingLattice = useEditorStateStore((state) => state.isEditingLattice);
  const setIsEditingProject = useEditorStateStore((state) => state.setIsEditingProject);
  const setIsEditingLattice = useEditorStateStore((state) => state.setIsEditingLattice);
  const openTabs = useEditorStateStore((state) => state.openTabs);
  const activeTabId = useEditorStateStore((state) => state.activeTabId);

  const getProjectById = useProjectsStore((state) => state.getProjectById);
  const getLatticeById = useProjectsStore((state) => state.getLatticeById);

  const activeTab = getActiveTab();
  
  // Get project and lattice data from the correct store
  const activeProject = activeTab?.projectId ? getProjectById(activeTab.projectId) : undefined;
  const activeLattice = activeTab?.latticeId ? getLatticeById(activeTab.latticeId) : undefined;

  // Debug logging
  if (activeTab && !activeProject && !activeLattice) {
    console.warn(`No project/lattice found for tab: ${activeTab.title} (type: ${activeTab.type}, projectId: ${activeTab.projectId}, latticeId: ${activeTab.latticeId})`);
  }

  // Determine the main tab type based on active tab
  let activeMainTabType: string | undefined = activeTab?.type;
  
  // Handle sub-tabs by checking their parent or using projectId/latticeId
  if (activeTab) {
    if (activeTab.type === "canvas" || activeTab.type === "code") {
      // These are always project-related
      activeMainTabType = "project";
    } else if (activeTab.parentId) {
      // Find parent tab for other sub-tabs
      const parentTab = openTabs.find((t: Tab) => t.id === activeTab.parentId);
      if (parentTab?.type === "scene") {
        activeMainTabType = "project";
      } else if (parentTab) {
        activeMainTabType = parentTab.type;
      }
    } else if (activeTab.type === "scene") {
      // Scene is a project tab
      activeMainTabType = "project";
    }
  }
  
  // Determine if we're currently editing
  const isEditing = activeMainTabType === "project" ? isEditingProject : 
                   activeMainTabType === "lattice" ? isEditingLattice : false;
  
  const handleEditClick = () => {
    if (activeMainTabType === "project") {
      setIsEditingProject(true);
    } else if (activeMainTabType === "lattice") {
      setIsEditingLattice(true);
    }
  };

  const handleCancelEdit = () => {
    if (activeMainTabType === "project") {
      setIsEditingProject(false);
    } else if (activeMainTabType === "lattice") {
      setIsEditingLattice(false);
    }
  };

  return (
    <div className="w-80 h-full bg-neutral-800 flex flex-col overflow-hidden">
      {/* Top navbar */}
      <div className="flex items-center h-10 bg-gray-800 border-b border-gray-700 justify-between flex-shrink-0" style={{ margin: 0, padding: 0 }}>
        <span className="font-semibold text-white pl-2">
          {activeMainTabType === "lattice" ? "Lattice Properties" : 
           activeMainTabType === "dashboard" ? "Dashboard" : 
           "Project Properties"}
        </span>
        <div className="flex items-center gap-1 mr-2">
          {/* Save/Cancel buttons - only show when editing */}
          {isEditing && (
            <>
              <button 
                className="text-xs px-2 py-1 rounded text-white bg-[#4a7ec7] hover:bg-[#7aa5d8]" 
                onClick={() => {
                  // Trigger save through custom event for both project and lattice
                  const event = new CustomEvent('rightSidebarSave');
                  window.dispatchEvent(event);
                }}
              >
                Save
              </button>
              <button 
                className="text-xs px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-700" 
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </>
          )}
          
          {/* Edit button - only show for project and lattice tabs when not already editing */}
          {(activeMainTabType === "project" || activeMainTabType === "lattice") && !isEditing && (
            <button 
              className="p-1 rounded hover:bg-gray-700" 
              onClick={handleEditClick}
              aria-label="Edit properties"
            >
              <Pen size={18} className="text-gray-400 hover:text-white" />
            </button>
          )}
          <button className="p-1 rounded hover:bg-gray-700" onClick={onClose}>
            <X size={18} className="text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Content container with overflow handling */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Content based on active tab type */}
        {activeMainTabType === "project" && activeProject && (
          <RightProjectPanel 
            project={activeProject} 
            ghPages={ghPages}
            onCancel={handleCancelEdit}
          />
        )}
        
        {/* Add a fallback for when project should be shown but isn't found */}
        {activeMainTabType === "project" && !activeProject && activeTab && (
          <div className="p-4 text-gray-500">
            Project not found for tab: {activeTab.title} (type: {activeTab.type}, projectId: {activeTab.projectId})
          </div>
        )}
        
        {activeMainTabType === "lattice" && activeLattice && (
          <RightLatticePanel 
            lattice={activeLattice} 
            ghPages={ghPages}
            onCancel={handleCancelEdit}
          />
        )}
        
        {activeMainTabType === "dashboard" && (
          <div className="p-4 text-gray-500">Dashboard has no properties panel</div>
        )}
        
        {!activeTab && (
          <div className="p-4 text-gray-500">No tab selected</div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
