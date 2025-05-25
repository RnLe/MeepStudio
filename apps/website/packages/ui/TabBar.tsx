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

  // Debug logging
  console.log("TabBar Debug:", {
    activeProjectId,
    activeSubTabId,
    openProjectsCount: openProjects.length,
    activeProjectSubTabsCount: activeProjectSubTabs.length,
    activeProjectSubTabs,
    shouldShowBottomRow: !!(activeProjectId && activeProjectSubTabs.length > 0)
  });

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
    <div className="flex flex-col bg-gray-900 border-b-2 border-gray-600 shadow-lg">
      {/* Top Row - Project Tabs */}
      <div className="flex items-center h-11 px-3 bg-gradient-to-b from-gray-800 to-gray-850">
        <div className="flex space-x-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {openProjects.map((project) => (
            <div
              key={project.documentId}
              onClick={() => setActiveProject(project.documentId!)}
              onContextMenu={(e) => handleContextMenu(e, project)}
              className={`flex items-center px-4 py-2 rounded-t-lg cursor-pointer transition-all duration-200 group relative ${
                project.documentId === activeProjectId 
                  ? "bg-gray-700 text-white shadow-lg border-t-2 border-blue-400" 
                  : "bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white"
              }`}
            >
              <span className="truncate max-w-32 font-medium text-sm">{project.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeProject(project.documentId!);
                }}
                className="ml-2 hover:bg-gray-600 rounded-full p-1 opacity-70 hover:opacity-100 transition-all"
              >
                <X size={12} className="text-gray-400 hover:text-red-400" />
              </button>
              {/* Active project indicator */}
              {project.documentId === activeProjectId && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>      {/* Bottom Row - Sub Tabs (only show if there's an active project) */}
      {activeProjectId && activeProjectSubTabs.length > 0 && (
        <div className="flex items-center h-10 px-3 bg-gradient-to-b from-gray-750 to-gray-800 border-t border-gray-600">
          <div className="text-xs text-red-400 mr-2">DEBUG: Sub-tabs found: {activeProjectSubTabs.length}</div>
          <div className="flex space-x-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {activeProjectSubTabs.map((subTab) => {
              const IconComponent = getSubTabIcon(subTab.type);
              const isActive = subTab.id === activeSubTabId;
              return (
                <div
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative ${
                    isActive 
                      ? "bg-gray-600 text-white shadow-md border border-gray-500" 
                      : "bg-gray-750 hover:bg-gray-650 text-gray-300 hover:text-white border border-transparent"
                  }`}
                >
                  <IconComponent 
                    size={14} 
                    className={`mr-2 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} 
                  />
                  <span className="text-xs font-medium truncate max-w-24 capitalize">
                    {subTab.title}
                  </span>
                  {subTab.type !== "scene" && ( // Don't allow closing the main scene tab
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeSubTab(subTab.id);
                      }}
                      className="ml-2 hover:bg-gray-500 rounded-full p-0.5 opacity-70 hover:opacity-100 transition-all"
                    >
                      <X size={10} className="text-gray-400 hover:text-red-400" />
                    </button>
                  )}
                  {/* Active sub-tab indicator */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1 right-1 h-0.5 bg-blue-400 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Temporary debug info - always shown */}
      <div className="bg-red-600 text-white text-xs p-1">
        Debug: activeProjectId={activeProjectId}, subTabs={activeProjectSubTabs.length}
      </div>
      
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
