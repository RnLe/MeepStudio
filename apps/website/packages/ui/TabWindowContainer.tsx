// src/components/layout/TabWindowContainer.tsx
"use client";
import React from "react";
import TabBar from "./TabBar";
import SubTabContent from "./SubTabContent";
import { useEditorStateStore } from "../providers/EditorStateStore";

const TabWindowContainer: React.FC = () => {
  const {
    openProjects,
    activeProjectId,
    activeSubTabId,
    subTabs,
    ghPages,
    projects,
    getActiveProject,
  } = useEditorStateStore();
  
  // Remap open projects to the latest project objects
  const displayedProjects = React.useMemo(
    () => openProjects.map(project => 
      projects.find(p => p.documentId === project.documentId) || project
    ),
    [openProjects, projects]
  );
  
  // Find the active project and sub-tab
  const activeProject = displayedProjects.find(project => project.documentId === activeProjectId);
  const activeSubTab = subTabs.find(tab => tab.id === activeSubTabId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TabBar />
      
      {activeProject && activeSubTab ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <SubTabContent 
            subTab={activeSubTab}
            project={activeProject}
            ghPages={ghPages}
          />
        </div>
      ) : activeProject ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No sub-tab selected for project "{activeProject.title}"
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No project selected
        </div>
      )}
    </div>
  );
};

export default TabWindowContainer;
