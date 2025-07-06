// src/components/layout/TabWindowContainer.tsx
"use client";
import React, { useRef, useEffect, useState } from "react";
import TabBar from "./TabBar";
import TabWindowLattice from "./TabWindowLattice";
import TabWindowScene from "./TabWindowScene";
import CodeEditor from "./CodeEditorScene";
import { useEditorStateStore, Tab } from "../providers/EditorStateStore";
import { useProjectById, useLatticeById, useMeepProjects } from "../hooks/useMeepProjects";
import { useProjectsStore } from "../stores/projects";

const TabWindowContainer: React.FC = () => {
  // Use individual selectors to avoid object creation
  const getActiveTab = useEditorStateStore((state) => state.getActiveTab);
  const getMainTabs = useEditorStateStore((state) => state.getMainTabs);
  const getSubTabsForMainTab = useEditorStateStore((state) => state.getSubTabsForMainTab);
  const activeTabId = useEditorStateStore((state) => state.activeTabId);
  const activeSubTabId = useEditorStateStore((state) => state.activeSubTabId);
  const setActiveTab = useEditorStateStore((state) => state.setActiveTab);
  const setActiveSubTab = useEditorStateStore((state) => state.setActiveSubTab);
  const closeTab = useEditorStateStore((state) => state.closeTab);
  const closeSubTab = useEditorStateStore((state) => state.closeSubTab);
  const ghPages = useEditorStateStore((state) => state.ghPages);
  
  // Get getter functions for inline use (stable references)
  const getProjectById = useProjectsStore((state) => state.getProjectById);
  const getLatticeById = useProjectsStore((state) => state.getLatticeById);
  
  const activeTab = getActiveTab();
  
  // Get project and lattice data using optimized hooks that only subscribe when IDs change
  const activeProject = useProjectById(activeTab?.projectId);
  const activeLattice = useLatticeById(activeTab?.latticeId);
  
  // Get main tabs and sub tabs for current main tab
  const mainTabs = getMainTabs();
  const subTabs = activeTabId ? getSubTabsForMainTab(activeTabId) : [];
  
  // Determine which content to show
  let activeContentTab = activeTab;
  
  // If we have a canvas sub tab active, show the main tab content
  if (activeSubTabId) {
    const activeSubTab = subTabs.find((t: Tab) => t.id === activeSubTabId);
    if (activeSubTab?.type === 'canvas') {
      // Show main tab content when canvas is selected
      activeContentTab = mainTabs.find((t: Tab) => t.id === activeTabId);
    } else {
      // Show sub tab content for other types
      activeContentTab = activeSubTab;
    }
  }

  const mainTabBarRef = useRef<HTMLDivElement>(null);
  const [firstTabWidth, setFirstTabWidth] = useState<number | undefined>(undefined);

  // Measure first tab width when mainTabs change
  useEffect(() => {
    if (mainTabs.length > 0 && mainTabBarRef.current) {
      // Find the first tab element in the main tab bar
      const firstTabElement = mainTabBarRef.current.querySelector(`[data-tab-id="${mainTabs[0].id}"]`) as HTMLElement;
      if (firstTabElement) {
        const width = firstTabElement.getBoundingClientRect().width;
        setFirstTabWidth(width);
      }
    } else {
      setFirstTabWidth(undefined);
    }
  }, [mainTabs]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main Tab Bar */}
      <div ref={mainTabBarRef}>
        <TabBar 
          tabs={mainTabs}
          activeTabId={activeTabId}
          onTabClick={setActiveTab}
          onTabClose={closeTab}
        />
      </div>
      
      {/* Sub Tab Bar - only show if there are sub tabs (excluding the canvas tab if it's alone) */}
      {subTabs.length > 1 && (
        <div className="-mt-px"> {/* Negative margin to remove gap */}
          <TabBar 
            tabs={subTabs}
            activeTabId={activeSubTabId}
            onTabClick={setActiveSubTab}
            onTabClose={closeSubTab}
            isSubTabBar={true}
            parentTabWidth={firstTabWidth} // Always pass the first tab width
          />
        </div>
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeContentTab?.type === "lattice" && activeContentTab.latticeId ? (
          (() => {
            const lattice = getLatticeById(activeContentTab.latticeId);
            return lattice ? (
              <TabWindowLattice lattice={lattice} ghPages={ghPages} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Lattice not found for tab: {activeContentTab.title} (ID: {activeContentTab.latticeId})
              </div>
            );
          })()
        ) : activeContentTab?.type === "scene" && activeContentTab.projectId ? (
          (() => {
            const project = getProjectById(activeContentTab.projectId);
            return project ? (
              <TabWindowScene project={project} ghPages={ghPages} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Project not found for tab: {activeContentTab.title} (type: {activeContentTab.type}, projectId: {activeContentTab.projectId})
              </div>
            );
          })()
        ) : activeContentTab?.type === "code" && activeContentTab.projectId ? (
          (() => {
            const project = getProjectById(activeContentTab.projectId);
            return project ? (
              <CodeEditor project={project} ghPages={ghPages} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Project not found for tab: {activeContentTab.title} (type: {activeContentTab.type}, projectId: {activeContentTab.projectId})
              </div>
            );
          })()
        ) : activeContentTab?.type === "dashboard" ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Dashboard view (not implemented)
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No tab selected
          </div>
        )}
      </div>
    </div>
  );
};

export default TabWindowContainer;
