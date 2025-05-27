// src/components/layout/TabWindowContainer.tsx
"use client";
import React from "react";
import TabBar from "./TabBar";
import TabWindowLattice from "./TabWindowLattice";
import TabWindowScene from "./TabWindowScene";
import CodeEditor from "./CodeEditorScene";
import { useEditorStateStore } from "../providers/EditorStateStore";

const TabWindowContainer: React.FC = () => {
  const {
    getActiveTab,
    getActiveProject,
    getActiveLattice,
    ghPages,
  } = useEditorStateStore();
  
  const activeTab = getActiveTab();
  const activeProject = getActiveProject();
  const activeLattice = getActiveLattice();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TabBar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab?.type === "lattice" && activeLattice ? (
          <TabWindowLattice lattice={activeLattice} ghPages={ghPages} />
        ) : activeTab?.type === "scene" && activeProject ? (
          <TabWindowScene project={activeProject} ghPages={ghPages} />
        ) : activeTab?.type === "code" && activeProject ? (
          <CodeEditor project={activeProject} ghPages={ghPages} />
        ) : activeTab?.type === "dashboard" ? (
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
