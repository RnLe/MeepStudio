// src/components/layout/RightSidebar.tsx
import React from "react";
import { X } from "lucide-react";
import { MeepProject } from "../types/meepProjectTypes";
import ContextMenu from "./ContextMenu";
import ObjectsList from "./ObjectList";
import ObjectPropertiesPanel from "./ObjectPropertiesPanels";


interface Props {
  open: boolean;
  ghPages: boolean;
  project?: MeepProject;
  onClose?: () => void;
  deleteProject?: (id: string) => Promise<void>;
}

const RightSidebar: React.FC<Props> = ({ open, ghPages, project, onClose, deleteProject }) => {
  const handleDelete = async () => {
    if (project && deleteProject) {
      if (window.confirm(`Are you sure you want to delete the project "${project.title}"? This cannot be undone.`)) {
        await deleteProject(project.documentId);
      }
    }
  };

  console.log("Project size:", project?.rectWidth, project?.rectHeight);

  return (
    <div
      className={`flex-shrink-0 w-80 bg-neutral-800 border-l border-gray-700 p-0 space-y-4
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
          <div className="space-y-3">
            <h2 className="not-prose text-xl font-semibold text-white text-center">{project.title}</h2>
            {/* Grid size display */}
            <div className="flex justify-center items-center text-xs text-gray-400 mt-1">
              <span className="inline-block px-2 py-0.5 rounded bg-gray-700/60 border border-gray-600 font-mono tracking-tight">
                {project.rectWidth} <span className="mx-0.5 text-gray-500">×</span> {project.rectHeight}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-gray-400 text-center">{project.description}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No project selected</p>
        )}

        <hr className="border-gray-700 my-4" />
        {project && <ObjectsList project={project} />}
        <hr className="border-gray-700" />
        {project && <ObjectPropertiesPanel project={project} ghPages={ghPages} />}
      </div>
    </div>
  );
};

export default RightSidebar;
