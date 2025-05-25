import React, { useState } from "react";
import { X, Code, Grid3X3, Layers } from "lucide-react";
import ContextMenu from "./ContextMenu";
import { MeepProject } from "../types/meepProjectTypes";
import { useEditorStateStore, SubTab, SubTabType } from "../providers/EditorStateStore";

interface Props {
}

const getSubTabIcon = (type: SubTabType) => {
  switch (type) {
    case "scene":
      return Layers;
    case "lattice":
      return Grid3X3;
    case "code":
      return Code;
    default:
      return Layers;
  }
};

const TabBar: React.FC<Props> = () => {
  const [contextMenu, setContextMenu] = useState<null | { x: number; y: number; tab: MeepProject }>(null);
  
  const {
    openProjects,
    activeProjectId,
    getActiveProjectSubTabs,
    activeSubTabId,
    setActiveProject,
    closeProject,
    setActiveSubTab,
    closeSubTab,
    deleteProject,
  } = useEditorStateStore();
  
  const activeProjectSubTabs = getActiveProjectSubTabs();

  const handleContextMenu = (e: React.MouseEvent, tab: MeepProject) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tab,
    });
  };
  const handleRemove = async (tab: MeepProject) => {
    if (window.confirm(`Are you sure you want to delete the project "${tab.title}"? This cannot be undone.`)) {
      await deleteProject(tab.documentId);
    }
  };

  return (
    <div className="flex flex-col bg-gray-800 border-b border-gray-700">
      {/* Top Row - Project Tabs */}
      <div className="flex items-center h-10 px-2 border-b border-gray-600">
        <div className="flex space-x-1 overflow-x-auto">
          {openProjects.map((project) => (
            <div
              key={project.documentId}
              onClick={() => setActiveProject(project.documentId!)}
              onContextMenu={(e) => handleContextMenu(e, project)}
              className={`flex items-center px-3 py-1 rounded-t cursor-pointer transition-colors ${
                project.documentId === activeProjectId 
                  ? "bg-gray-700 text-white border-b-2 border-blue-400" 
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              <span className="truncate max-w-xs">{project.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeProject(project.documentId!);
                }}
                className="ml-2 hover:bg-gray-600 rounded p-0.5"
              >
                <X size={12} className="text-gray-400 hover:text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>      {/* Bottom Row - Sub Tabs (only show if there's an active project) */}
      {activeProjectId && activeProjectSubTabs.length > 0 && (
        <div className="flex items-center h-9 px-2 bg-gray-700">
          <div className="flex space-x-1 overflow-x-auto">
            {activeProjectSubTabs.map((subTab) => {
              const IconComponent = getSubTabIcon(subTab.type);
              return (
                <div
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`flex items-center px-3 py-1 rounded cursor-pointer transition-colors ${
                    subTab.id === activeSubTabId 
                      ? "bg-gray-600 text-white" 
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  <IconComponent size={14} className="mr-1.5" />
                  <span className="text-sm truncate max-w-xs">{subTab.title}</span>
                  {subTab.type !== "scene" && ( // Don't allow closing the main scene tab
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeSubTab(subTab.id);
                      }}
                      className="ml-1.5 hover:bg-gray-500 rounded p-0.5"
                    >
                      <X size={10} className="text-gray-400 hover:text-white" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          entries={[
            {
              label: "Remove Project",
              danger: true,
              onClick: () => handleRemove(contextMenu.tab),
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default TabBar;
