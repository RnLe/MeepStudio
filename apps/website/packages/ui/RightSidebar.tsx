// src/components/layout/RightSidebar.tsx
import React from "react";
import { X } from "lucide-react";
import { useEditorStateStore } from "../providers/EditorStateStore";
import RightProjectPanel from "./RightProjectPanel";
import RightLatticePanel from "./RightLatticePanel";

interface Props {
  onClose?: () => void;
}

const RightSidebar: React.FC<Props> = ({ onClose }) => {
  const { 
    activeMainTabType,
    getActiveProject,
    getActiveLattice,
    ghPages 
  } = useEditorStateStore();

  const activeProject = getActiveProject();
  const activeLattice = getActiveLattice();

  return (
    <div className="flex-shrink-0 w-80 bg-neutral-800 border-l border-gray-700 p-0 space-y-4">
      {/* Top navbar */}
      <div className="flex items-center h-10 bg-gray-800 border-b border-gray-700 justify-between sticky top-0 z-10" style={{ margin: 0, padding: 0 }}>
        <span className="font-semibold text-white pl-2">
          {activeMainTabType === "lattice" ? "Lattice Properties" : "Project Properties"}
        </span>
        <button className="p-1 rounded hover:bg-gray-700 mr-2" onClick={onClose}>
          <X size={18} className="text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* Content based on active tab type */}
      {activeMainTabType === "project" && activeProject && (
        <RightProjectPanel project={activeProject} ghPages={ghPages} />
      )}
      
      {activeMainTabType === "lattice" && activeLattice && (
        <RightLatticePanel lattice={activeLattice} ghPages={ghPages} />
      )}
      
      {!activeMainTabType && (
        <div className="p-4 text-gray-500">No tab selected</div>
      )}
    </div>
  );
};

export default RightSidebar;
