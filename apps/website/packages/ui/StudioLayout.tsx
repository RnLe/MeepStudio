// src/components/layout/StudioLayout.tsx
"use client";

import React, { useState } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import TopNavBar from "./TopNavBar";
import TabWindowContainer from "./TabWindowContainer";
import { StudioTabsProvider, useStudioTabs } from "./StudioTabsContext";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useCanvasStore } from "../providers/CanvasStore";

interface Props {
  ghPages: boolean;     // Whether to use GitHub Pages; controls the availability of some features
}

const InnerLayout: React.FC<Props> = ({ghPages}) => {
  const { projects, isLoading, createProject, deleteProject } = useMeepProjects({ ghPages });
  const [rightOpen, setRightOpen] = useState(true);
  const { tabs, activeId, openTab, closeTab, selectTab } = useStudioTabs();
  const setActiveProject = useCanvasStore((s) => s.setActiveProject);

  const activeProject = tabs.find(tab => tab.documentId === activeId);
  React.useEffect(() => {
    setActiveProject(activeProject?.documentId || null);
  }, [activeProject?.documentId, setActiveProject]);

  // Handler to open right sidebar when a project or tab is selected
  const handleOpenTab = (project: any) => {
    setRightOpen(true);
    openTab(project);
  };
  const handleSelectTab = (id: string) => {
    setRightOpen(true);
    selectTab(id);
  };

  if (isLoading) return <div className="p-4">Loading …</div>;

  return (
    <div className="flex flex-col h-full w-full bg-neutral-900 text-white overflow-hidden relative">
      <TopNavBar />
      <div className="flex flex-1 h-0 w-full overflow-hidden">
        <LeftSidebar 
          projects={projects}
          openProject={handleOpenTab}
          createProject={createProject}
          deleteProject={deleteProject}
          onCloseTab={closeTab} // Pass closeTab to ProjectExplorer
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TabWindowContainer 
            tabs={tabs}
            ghPages={ghPages}
            activeId={activeId}
            onSelect={handleSelectTab}
            onClose={closeTab}
            onRemoveProject={deleteProject}
          />
        </div>
        {rightOpen && (
          <RightSidebar open={rightOpen} ghPages={ghPages} project={activeProject} onClose={() => setRightOpen(false)} deleteProject={deleteProject} />
        )}
      </div>
    </div>
  );
};

interface StudioLayoutProps {
  ghPages: boolean;     // Whether to use GitHub Pages; controls the availability of some features
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({ ghPages }) => (
  <StudioTabsProvider>
    <InnerLayout ghPages={ghPages} />
  </StudioTabsProvider>
);