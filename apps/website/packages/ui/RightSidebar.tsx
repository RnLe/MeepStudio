// src/components/layout/RightSidebar.tsx
import React from "react";
import { X } from "lucide-react";
import { SimulationConsole } from "./SimulationConsole";
import { MeepProject } from "../types/meepProjectTypes";
import ObjectsList from "./ObjectList";
import ObjectPropertiesPanel from "./ObjectPropertiesPanels";


interface Props {
  open: boolean;
  project?: MeepProject;
  onClose?: () => void;
}

const RightSidebar: React.FC<Props> = ({ open, project, onClose }) => {
  return (
    <div
      className={`flex-shrink-0 w-80 bg-gray-900 border-l border-gray-700 p-0 space-y-4
        transform transition-transform duration-200
        ${open ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Top navbar-like container, not affected by parent padding */}
      <div className="flex items-center h-10 bg-gray-800 border-b border-gray-700 justify-between sticky top-0 z-10" style={{ margin: 0, padding: 0 }}>
        <span className="font-semibold text-white pl-2">Project Properties</span>
        <button className="p-1 rounded hover:bg-gray-700 mr-2" onClick={onClose}>
          <X size={18} className="text-gray-400 hover:text-white" />
        </button>
      </div>
      <div className="p-4">
        {project ? (
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">{project.title}</h2>
            {project.description && (
              <p className="text-sm text-gray-400">{project.description}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No project selected</p>
        )}

        <hr className="border-gray-700" />
        <ObjectsList />
        <hr className="border-gray-700" />
        <ObjectPropertiesPanel />
      </div>
    </div>
  );
};

export default RightSidebar;
