// src/components/layout/TabWindowContainer.tsx
"use client";
import React from "react";
import TabWindowProject from "./TabWindowProject";
import TabBar from "./TabBar";
import { MeepProject } from "../types/meepProjectTypes";

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
  const activeProject = tabs.find(tab => tab.documentId === activeId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TabBar tabs={tabs} activeId={activeId} onSelect={onSelect} onClose={onClose} onRemoveProject={onRemoveProject} />
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
