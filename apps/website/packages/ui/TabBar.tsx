import React, { useState } from "react";
import { X, CodeXml, Layers, Hexagon, PanelRightOpen } from "lucide-react";
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
    default:
      return Layers;
  }
};

const TabBar: React.FC = () => {
  const [contextMenu, setContextMenu] = useState<null | { x: number; y: number; item: MeepProject | Lattice; type: 'project' | 'lattice' }>(null);
  const [detachedTabs, setDetachedTabs] = useState<Set<string>>(new Set());
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
  const {
    openTabs,
    activeTabId,
    projects,
    lattices,
    setActiveTab,
    closeTab,
    deleteProject,
    deleteLattice,
    addCodeTabToProject,
    rightSidebarOpen,
    setRightSidebarOpen,
  } = useEditorStateStore();

  // Group tabs by their parent relationship
  const tabGroups = React.useMemo(() => {
    const groups: Map<string, Tab[]> = new Map();
    const standalone: Tab[] = [];
    const processed = new Set<string>();
    
    // First pass: identify all parent tabs
    openTabs.forEach(tab => {
      if (!tab.parentId && !detachedTabs.has(tab.id)) {
        // This is a parent tab, check if it has children
        const children = openTabs.filter(t => 
          t.parentId === tab.id && 
          !detachedTabs.has(t.id) && 
          openTabs.some(p => p.id === tab.id) // Parent still exists
        );
        if (children.length > 0) {
          groups.set(tab.id, [tab, ...children]);
          processed.add(tab.id);
          children.forEach(child => processed.add(child.id));
        }
      }
    });
    
    // Second pass: add standalone tabs
    openTabs.forEach(tab => {
      if (!processed.has(tab.id) || detachedTabs.has(tab.id)) {
        standalone.push(tab);
      }
    });
    
    return { groups, standalone };
  }, [openTabs, detachedTabs]);

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

  const renderTab = (tab: Tab, isAttached: boolean = false, isLastInGroup: boolean = false, groupId?: string) => {
    const IconComponent = getTabIcon(tab.type);
    const isActive = tab.id === activeTabId;
    
    // Check if any tab in the group is active
    const parentId = groupId || tab.parentId || tab.id;
    const groupTabs = tabGroups.groups.get(parentId) || [];
    const isInActiveGroup = groupTabs.some(t => t.id === activeTabId);
    const isSiblingActive = isInActiveGroup && !isActive;
    
    // Check if a sibling is being hovered
    const siblingHovered = groupTabs.some(t => t.id === hoveredTab && t.id !== tab.id);
    const isHovered = hoveredTab === tab.id;
    
    // Hide detached sub tabs whose parent still exists
    if (detachedTabs.has(tab.id) && tab.parentId && openTabs.some(t => t.id === tab.parentId)) {
      return null;
    }
    
    return (
      <div
        key={tab.id}
        onClick={() => {
          setActiveTab(tab.id);
          // Re-attach sub tab when parent is activated
          if (tab.type === "project" || tab.type === "scene") {
            const childTabs = openTabs.filter(t => t.parentId === tab.id);
            childTabs.forEach(child => {
              setDetachedTabs(prev => {
                const next = new Set(prev);
                next.delete(child.id);
                return next;
              });
            });
          }
        }}
        onMouseEnter={() => setHoveredTab(tab.id)}
        onMouseLeave={() => setHoveredTab(null)}
        onContextMenu={(e) => handleContextMenu(e, tab)}
        className={`group flex items-center cursor-pointer transition-all duration-300 ease-out relative ${
          isActive
            ? "bg-slate-700 text-white z-10"
            : isSiblingActive
              ? isHovered
                ? "bg-slate-700/95 text-white z-10"   // increased brightness on hover
                : "bg-slate-700/60 text-white/90 z-10" // lowered brightness when inactive
              : isHovered
                ? "bg-slate-700/85 text-white z-10"
                : "bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white"
        } ${isAttached ? "-ml-px pl-3 pr-10" : "px-4"} ${!isLastInGroup && isAttached ? "" : ""}`}
        style={{
          paddingTop: "10px",
          paddingBottom: "10px",
          clipPath: isAttached && !isLastInGroup ? "polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%)" : undefined
        }}
      >
        <IconComponent size={isAttached ? 18 : 14} className={`${isAttached ? "mr-2" : "mr-2"} text-slate-400`} />
        {!isAttached && <span className="truncate max-w-40 font-semibold text-sm tracking-wide mr-8">{tab.title}</span>}
        
        {/* Show close button for all tabs */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isAttached && groupTabs.length > 1) {
              // Detach all sub tabs when closing parent
              groupTabs.slice(1).forEach(child => {
                setDetachedTabs(prev => new Set([...prev, child.id]));
              });
            }
            closeTab(tab.id);
          }}
          className={`absolute right-2 p-1.5 transition-all duration-200 hover:bg-slate-600/50 rounded cursor-pointer ${
            isActive
              ? "opacity-60 hover:opacity-100" 
              : isHovered
                ? "opacity-60 hover:opacity-100"
                : "opacity-0 group-hover:opacity-60 group-hover:hover:opacity-100"
          }`}
        >
          <X size={14} className="text-slate-400 hover:text-slate-200 transition-colors" />
        </button>
        
        {/* Active indicator */}
        {isActive && (
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
        
        {/* Sibling active indicator - thin line that moves with tab */}
        {isSiblingActive && (
          <div
            className={`absolute top-0 left-0 right-0 h-0.5 ${
              tab.type === "dashboard"
                ? "bg-purple-400/60"
                : tab.type === "lattice"
                  ? "bg-green-400/60"
                  : "bg-blue-400/60"
            } rounded-full`}
          />
        )}
      </div>
    );
  };

  const renderTabGroup = (tabs: Tab[]) => {
    const groupId = tabs[0].id;
    return (
      <div
        key={groupId}              // <- unique key for list items
        className="flex"
      >
        {tabs.map((tab, index) =>
          renderTab(tab, index > 0, index === tabs.length - 1, groupId)
        )}
      </div>
    );
  };
  
  return (
    /* z-index added so lowered tabs sit above the viewport content below */
    <div className="min-h-12 bg-slate-800 border-b border-slate-700/50 shadow-xl flex items-end relative z-30">
      <div className="flex overflow-hidden flex-1">
        {/* Render grouped tabs */}
        {Array.from(tabGroups.groups.values()).map(renderTabGroup)}

        {/* Render standalone tabs */}
        {tabGroups.standalone.map(tab => renderTab(tab))}

        {/* Add code tab button for active project */}
        {(() => {
          const activeTab = openTabs.find(t => t.id === activeTabId);
          if (
            (activeTab?.type === "project" || activeTab?.type === "scene") &&
            activeTab.projectId
          ) {
            const hasCodeTab = openTabs.some(
              t => t.id === `code-${activeTab.projectId}`
            );
            const project = projects.find(
              p => p.documentId === activeTab.projectId
            );
            if (project?.code && !hasCodeTab) {
              return (
                <button
                  onClick={() => addCodeTabToProject(activeTab.projectId!)}
                  className="ml-2 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Add code tab"
                >
                  <CodeXml size={16}/>
                </button>
              );
            }
          }
          return null;
        })()}
      </div>

      {/* Right sidebar toggle button */}
      {!rightSidebarOpen && (
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="ml-2 mr-2 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all duration-200 opacity-100 data-[open=true]:opacity-0 flex items-center justify-center"
          title="Open properties panel"
          data-open={rightSidebarOpen}
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
