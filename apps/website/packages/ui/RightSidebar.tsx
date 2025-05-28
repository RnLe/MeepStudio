// src/components/layout/RightSidebar.tsx
import React from "react";
import { X, Pen } from "lucide-react";
import { useEditorStateStore } from "../providers/EditorStateStore";
import RightProjectPanel from "./RightProjectPanel";
import RightLatticePanel from "./RightLatticePanel";

interface Props {
  onClose?: () => void;
}

const RightSidebar: React.FC<Props> = ({ onClose }) => {
  const { 
    getActiveTab,
    getActiveProject,
    getActiveLattice,
    ghPages,
    isEditingProject,
    isEditingLattice,
    setIsEditingProject,
    setIsEditingLattice
  } = useEditorStateStore();

  const activeTab = getActiveTab();
  const activeProject = getActiveProject();
  const activeLattice = getActiveLattice();

  // Determine the main tab type based on active tab
  const activeMainTabType = activeTab?.type === "scene" || activeTab?.type === "code" ? "project" : activeTab?.type;
  
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
    <div className="w-80 h-full bg-neutral-800 p-0 space-y-4 flex flex-col">
      {/* Top navbar */}
      <div className="flex items-center h-10 bg-gray-800 border-b border-gray-700 justify-between sticky top-0 z-10 flex-shrink-0" style={{ margin: 0, padding: 0 }}>
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

      {/* Content based on active tab type */}
      {activeMainTabType === "project" && activeProject && (
        <RightProjectPanel 
          project={activeProject} 
          ghPages={ghPages}
          onCancel={handleCancelEdit}
        />
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
  );
};

export default RightSidebar;
