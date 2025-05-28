import React, { useState, useRef, useEffect } from "react";
import { X, CodeXml, Layers, Hexagon, PanelRightOpen, Shapes } from "lucide-react";
import ContextMenu from "./ContextMenu";
import { MeepProject, Lattice } from "../types/meepProjectTypes";
import { useEditorStateStore, Tab } from "../providers/EditorStateStore";
import CustomLucideIcon from "./CustomLucideIcon";

const getTabIcon = (type: Tab["type"]) => {
  switch (type) {
    case "project":
    case "scene":
      return Layers;
    case "code":
      return CodeXml;
    case "lattice":
      return Hexagon;
    case "canvas": // Add canvas type
      return Shapes;
    default:
      return Layers;
  }
};

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  isSubTabBar?: boolean;
  parentTabWidth?: number; // Add prop for parent tab width
}

const TabBar: React.FC<TabBarProps> = ({ 
  tabs, 
  activeTabId, 
  onTabClick, 
  onTabClose,
  isSubTabBar = false,
  parentTabWidth
}) => {
  const [contextMenu, setContextMenu] = useState<null | { x: number; y: number; item: MeepProject | Lattice; type: 'project' | 'lattice' }>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
  const {
    projects,
    lattices,
    deleteProject,
    deleteLattice,
    rightSidebarOpen,
    setRightSidebarOpen,
  } = useEditorStateStore();

  const handleContextMenu = (e: React.MouseEvent, tab: Tab) => {
    e.preventDefault();
    if ((tab.type === "project" || tab.type === "scene") && tab.projectId) {
      const project = projects.find(p => p.documentId === tab.projectId);
      if (project) {
        setContextMenu({ x: e.clientX, y: e.clientY, item: project, type: 'project' });
      }
    } else if (tab.type === "lattice" && tab.latticeId) {
      const lattice = lattices.find(l => l.documentId === tab.latticeId);
      if (lattice) {
        setContextMenu({ x: e.clientX, y: e.clientY, item: lattice, type: 'lattice' });
      }
    }
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

  const renderTab = (tab: Tab) => {
    const IconComponent = getTabIcon(tab.type);
    const isActive = tab.id === activeTabId;
    const isHovered = hoveredTab === tab.id;
    const isClosable = tab.type !== "canvas"; // Canvas tabs are not closable
    
    // Apply dynamic width to all canvas tabs in sub tab bars when we have parent width
    const shouldHaveDynamicWidth = isSubTabBar && tab.type === "canvas" && parentTabWidth;
    const minWidth = 96; // 24 * 4 = 96px (6rem equivalent)
    const dynamicWidth = shouldHaveDynamicWidth ? Math.max(parentTabWidth, minWidth) : undefined;
    
    return (
      <div
        key={tab.id}
        data-tab-id={tab.id} // Add data attribute for measurement
        onClick={() => onTabClick(tab.id)}
        onMouseEnter={() => setHoveredTab(tab.id)}
        onMouseLeave={() => setHoveredTab(null)}
        onContextMenu={(e) => handleContextMenu(e, tab)}
        className={`group flex items-center cursor-pointer transition-all duration-300 ease-out relative ${shouldHaveDynamicWidth ? '' : 'px-4'} ${
          isActive
            ? "bg-slate-700 text-white z-10"
            : isHovered
              ? "bg-slate-700/85 text-white z-10"
              : "bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white"
        }`}
        style={{
          paddingTop: isSubTabBar ? "8px" : "10px",
          paddingBottom: isSubTabBar ? "8px" : "10px",
          ...(shouldHaveDynamicWidth ? {
            width: `${dynamicWidth}px`,
            paddingLeft: "16px",
            paddingRight: "16px",
            justifyContent: "center"
          } : {
            paddingLeft: "16px",
            paddingRight: "16px"
          })
        }}
      >
        <IconComponent size={isSubTabBar ? 16 : 16} className="mr-2 text-slate-400" />
        <span className={`truncate ${shouldHaveDynamicWidth ? 'max-w-none' : 'max-w-40'} ${isSubTabBar ? 'text-sm' : 'font-semibold text-sm'} tracking-wide ${isClosable && !shouldHaveDynamicWidth ? 'mr-8' : 'mr-2'}`}>
          {tab.title}
        </span>
        
        {isClosable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            className={`absolute right-2 p-1.5 transition-all duration-200 hover:bg-slate-600/50 rounded cursor-pointer ${
              isActive || isHovered
                ? "opacity-60 hover:opacity-100" 
                : "opacity-0 group-hover:opacity-60 group-hover:hover:opacity-100"
            }`}
          >
            <X size={14} className="text-slate-400 hover:text-slate-200 transition-colors" />
          </button>
        )}
        
        {/* Active indicator */}
        {isActive && !isSubTabBar && (
          <>
            <div className={`absolute -top-0.5 left-0 right-0 h-1 ${
              tab.type === "dashboard" ? "bg-purple-400" : 
              tab.type === "lattice" ? "bg-green-400" : 
              "bg-blue-400"
            } rounded-full shadow-md`}></div>
            <div className={`absolute -top-0.5 left-0 right-0 h-1 ${
              tab.type === "dashboard" ? "bg-purple-400" : 
              tab.type === "lattice" ? "bg-green-400" : 
              "bg-blue-400"
            } rounded-full animate-pulse opacity-60`}></div>
          </>
        )}
        
        {/* Sub tab active indicator */}
        {isActive && isSubTabBar && (
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
            tab.type === "code" ? "bg-yellow-400" : 
            tab.type === "canvas" ? "bg-blue-400" :
            "bg-blue-400"
          } rounded-full`}></div>
        )}
      </div>
    );
  };
  
  return (
    <div className={`${isSubTabBar ? 'min-h-8' : 'min-h-12'} bg-slate-800 ${isSubTabBar ? '' : 'border-b border-slate-700/50'} shadow-xl flex items-end relative z-30`}>
      <div className="flex overflow-hidden flex-1">
        {tabs.map(renderTab)}
      </div>

      {/* Right sidebar toggle button - only show on main tab bar */}
      {!isSubTabBar && !rightSidebarOpen && (
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="ml-2 mr-2 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all duration-200 opacity-100 flex items-center justify-center"
          title="Open properties panel"
        >
          <PanelRightOpen size={21} />
        </button>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          entries={[
            {
              label: `Remove ${
                contextMenu.type === "project" ? "Project" : "Lattice"
              }`,
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
