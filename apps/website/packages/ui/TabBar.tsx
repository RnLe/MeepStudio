import React, { useState } from "react";
import { X, Code, Grid3X3, Layers, Hexagon } from "lucide-react";
import ContextMenu from "./ContextMenu";
import { MeepProject, Lattice } from "../types/meepProjectTypes";
import { useEditorStateStore, SubTab, SubTabType } from "../providers/EditorStateStore";
import CustomLucideIcon from "./CustomLucideIcon";

interface Props {
}

const getSubTabIcon = (type: SubTabType) => {
  switch (type) {
    case "scene":
      return Layers;
    case "code":
      return Code;
    default:
      return Layers;
  }
};

const TabBar: React.FC<Props> = () => {
  const [contextMenu, setContextMenu] = useState<null | { x: number; y: number; item: MeepProject | Lattice; type: 'project' | 'lattice' }>(null);
  
  const {
    openProjects,
    openLattices,
    openDashboards,
    activeProjectId,
    activeLatticeId,
    activeDashboardId,
    getActiveProjectSubTabs,
    activeSubTabId,
    setActiveProject,
    setActiveLattice,
    setActiveDashboard,
    closeProject,
    closeLattice,
    closeDashboard,
    setActiveSubTab,
    closeSubTab,
    deleteProject,
    deleteLattice,
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

  const handleContextMenu = (e: React.MouseEvent, item: MeepProject | Lattice, type: 'project' | 'lattice') => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      type,
    });
  };
  
  const handleRemove = async (item: MeepProject | Lattice, type: 'project' | 'lattice') => {
    if (window.confirm(`Are you sure you want to delete the ${type} "${item.title}"? This cannot be undone.`)) {
      if (type === 'project') {
        await deleteProject(item.documentId);
      } else {
        await deleteLattice(item.documentId);
      }
    }
  };
  
  return (
    <div className="flex flex-col bg-slate-900 border-b border-slate-700/50 shadow-xl">
      {/* Top Row - Project and Lattice Tabs */}
      <div className="flex items-center h-12 px-4 bg-slate-800">
        <div className="flex overflow-hidden">
          {/* Dashboard tabs */}
          {openDashboards.map((dashboardId) => (
            <div
              key={dashboardId}
              onClick={() => setActiveDashboard(dashboardId)}
              className={`group flex items-center py-2.5 pl-5 pr-3 cursor-pointer transition-all duration-300 ease-out relative min-w-fit flex-shrink-0 ${
                dashboardId === activeDashboardId 
                  ? "bg-slate-700 text-white" 
                  : "bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white"
              }`}
            >
              <CustomLucideIcon src="/icons/dashboard.svg" size={14} className="mr-2 text-slate-400" />
              <span className="truncate max-w-40 font-semibold text-sm tracking-wide mr-8">Dashboard</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeDashboard(dashboardId);
                }}
                className={`absolute right-2 p-1.5 transition-all duration-200 hover:bg-slate-600/50 rounded cursor-pointer ${
                  dashboardId === activeDashboardId 
                    ? "opacity-100" 
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <X size={14} className="text-slate-400 hover:text-slate-200 transition-colors" />
              </button>
              {dashboardId === activeDashboardId && (
                <>
                  <div className="absolute -top-0.5 left-0 right-0 h-1 bg-purple-400 rounded-full shadow-md"></div>
                  <div className="absolute -top-0.5 left-0 right-0 h-1 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
                </>
              )}
            </div>
          ))}
          
          {/* Project tabs */}
          {openProjects.map((project) => (
            <div
              key={project.documentId}
              onClick={() => setActiveProject(project.documentId!)}
              onContextMenu={(e) => handleContextMenu(e, project, 'project')}
              className={`group flex items-center py-2.5 pl-5 pr-3 cursor-pointer transition-all duration-300 ease-out relative min-w-fit flex-shrink-0 ${
                project.documentId === activeProjectId 
                  ? "bg-slate-700 text-white" 
                  : "bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white"
              }`}
            >
              <Layers size={14} className="mr-2 text-slate-400" />
              <span className="truncate max-w-40 font-semibold text-sm tracking-wide mr-8">{project.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeProject(project.documentId!);
                }}
                className={`absolute right-2 p-1.5 transition-all duration-200 hover:bg-slate-600/50 rounded cursor-pointer ${
                  project.documentId === activeProjectId 
                    ? "opacity-100" 
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <X size={14} className="text-slate-400 hover:text-slate-200 transition-colors" />
              </button>
              {project.documentId === activeProjectId && (
                <>
                  <div className="absolute -top-0.5 left-0 right-0 h-1 bg-blue-400 rounded-full shadow-md"></div>
                  <div className="absolute -top-0.5 left-0 right-0 h-1 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
                </>
              )}
            </div>
          ))}
          
          {/* Lattice tabs */}
          {openLattices.map((lattice) => (
            <div
              key={lattice.documentId}
              onClick={() => setActiveLattice(lattice.documentId!)}
              onContextMenu={(e) => handleContextMenu(e, lattice, 'lattice')}
              className={`group flex items-center py-2.5 pl-5 pr-3 cursor-pointer transition-all duration-300 ease-out relative min-w-fit flex-shrink-0 ${
                lattice.documentId === activeLatticeId 
                  ? "bg-slate-700 text-white" 
                  : "bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white"
              }`}
            >
              <Hexagon size={14} className="mr-2 text-slate-400" />
              <span className="truncate max-w-40 font-semibold text-sm tracking-wide mr-8">{lattice.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeLattice(lattice.documentId!);
                }}
                className={`absolute right-2 p-1.5 transition-all duration-200 hover:bg-slate-600/50 rounded cursor-pointer ${
                  lattice.documentId === activeLatticeId 
                    ? "opacity-100" 
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <X size={14} className="text-slate-400 hover:text-slate-200 transition-colors" />
              </button>
              {lattice.documentId === activeLatticeId && (
                <>
                  <div className="absolute -top-0.5 left-0 right-0 h-1 bg-green-400 rounded-full shadow-md"></div>
                  <div className="absolute -top-0.5 left-0 right-0 h-1 bg-green-400 rounded-full animate-pulse opacity-60"></div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row - Sub Tabs (only show if there's an active project) */}
      {activeProjectId && activeProjectSubTabs.length > 0 && (
        <div className="flex items-center h-11 px-4 bg-slate-700 -mt-1">
          <div className="flex space-x-1.5 overflow-hidden">
            {activeProjectSubTabs.map((subTab) => {
              const IconComponent = getSubTabIcon(subTab.type);
              const isActive = subTab.id === activeSubTabId;
              return (
                <div
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`group flex items-center py-2 pl-4 pr-3 rounded-md cursor-pointer transition-all duration-200 ease-out relative min-w-fit flex-shrink-0 ${
                    isActive 
                      ? "bg-slate-600 text-white shadow-lg" 
                      : "bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 hover:text-white"
                  }`}
                >
                  <IconComponent 
                    size={16} 
                    className={`mr-2.5 transition-colors ${
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`} 
                  />
                  <span className="text-xs font-medium truncate max-w-28 capitalize tracking-wide mr-6">
                    {subTab.title}
                  </span>
                  {subTab.type !== "scene" && ( // Don't allow closing the main scene tab
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeSubTab(subTab.id);
                      }}
                      className={`absolute right-2 p-1 transition-all duration-200 hover:bg-slate-500/50 rounded cursor-pointer ${
                        isActive 
                          ? "opacity-100" 
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <X size={11} className="text-slate-400 hover:text-slate-200 transition-colors" />
                    </button>
                  )}
                  {/* Active sub-tab indicator at top */}
                  {isActive && (
                    <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-400 rounded-full shadow-sm"></div>
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
              label: `Remove ${contextMenu.type === 'project' ? 'Project' : 'Lattice'}`,
              danger: true,
              onClick: () => handleRemove(contextMenu.item, contextMenu.type),
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default TabBar;
