// src/components/layout/TabWindowContainer.tsx
"use client";
import React from "react";
import TabWindowProject from "./TabWindowProject";
import TabBar from "./TabBar";
import { MeepProject } from "../types/meepProjectTypes";
import { useMeepProjects } from '../hooks/useMeepProjects';

interface Props {
  tabs: MeepProject[];
  ghPages: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onRemoveProject?: (id: string) => void;
}

const TabWindowContainer: React.FC<Props> = ({
  tabs,
  ghPages,
  activeId,
  onSelect,
  onClose,
  onRemoveProject,
}) => {
  // Get the up-to-date projects list
  const { projects } = useMeepProjects({ ghPages });
  // Remap open tabs to the latest project objects
  const displayedTabs = React.useMemo(
    () => tabs.map(tab => projects.find(p => p.documentId === tab.documentId) || tab),
    [tabs, projects]
  );
  // Use displayedTabs for both TabBar and finding the active project
  const activeProject = displayedTabs.find(tab => tab.documentId === activeId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TabBar
        tabs={displayedTabs}
        activeId={activeId}
        onSelect={onSelect}
        onClose={onClose}
        onRemoveProject={onRemoveProject}
      />
      {activeProject ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* The actual project window */}
          <TabWindowProject project={activeProject} ghPages={ghPages} />
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
