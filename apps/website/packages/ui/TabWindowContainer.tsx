// src/components/layout/TabWindowContainer.tsx
"use client";
import React, { useRef, useEffect, useState } from "react";
import TabBar from "./TabBar";
import TabWindowLattice from "./TabWindowLattice";
import TabWindowScene from "./TabWindowScene";
import CodeEditor from "./CodeEditorScene";
import { useEditorStateStore, Tab } from "../providers/EditorStateStore";

const TabWindowContainer: React.FC = () => {
  const {
    getActiveTab,
    getActiveProject,
    getActiveLattice,
    getMainTabs,
    getSubTabsForMainTab,
    activeTabId,
    activeSubTabId,
    setActiveTab,
    setActiveSubTab,
    closeTab,
    closeSubTab,
    ghPages,
  } = useEditorStateStore();
  
  const activeTab = getActiveTab();
  const activeProject = getActiveProject();
  const activeLattice = getActiveLattice();
  
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
        {activeContentTab?.type === "lattice" && activeLattice ? (
          <TabWindowLattice lattice={activeLattice} ghPages={ghPages} />
        ) : activeContentTab?.type === "scene" && activeProject ? (
          <TabWindowScene project={activeProject} ghPages={ghPages} />
        ) : activeContentTab?.type === "code" && activeProject ? (
          <CodeEditor project={activeProject} ghPages={ghPages} />
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
