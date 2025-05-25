// src/components/layout/StudioLayout.tsx
"use client";

import React, {useEffect} from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import TopNavBar from "./TopNavBar";
import TabWindowContainer from "./TabWindowContainer";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useCanvasStore } from "../providers/CanvasStore";
import { useEditorStateStore } from "../providers/EditorStateStore";

interface Props {
  ghPages: boolean;     // Whether to use GitHub Pages; controls the availability of some features
}

const StudioLayout: React.FC<Props> = ({ ghPages }) => {
  const { projects, isLoading, createProject, deleteProject } = useMeepProjects({ ghPages });
  const setActiveProject = useCanvasStore((s) => s.setActiveProject);
  
  const {
    rightSidebarOpen,
    setGhPages,
    setProjects,
    setIsLoading,
    setProjectManagementFunctions,
    setRightSidebarOpen,
    getActiveProject,
  } = useEditorStateStore();
  // Initialize the store with projects data and functions
  useEffect(() => {
    setGhPages(ghPages);
  }, [ghPages]);

  useEffect(() => {
    // Sync projects to editor store once data is loaded to avoid initial empty-loop
    if (!isLoading) {
      setProjects(projects);
    }
  }, [isLoading, projects, setProjects]);

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    // Initialize project management functions once to avoid infinite update loops
    setProjectManagementFunctions(createProject, deleteProject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Sync active project with canvas store
  useEffect(() => {
    const activeProject = getActiveProject();
    setActiveProject(activeProject?.documentId || null);
  }, [getActiveProject, setActiveProject]);

  if (isLoading) return <div className="p-4">Loading …</div>;

  return (
    <div className="flex flex-col h-full w-full bg-neutral-900 text-white overflow-hidden relative">
      <TopNavBar />
      <div className="flex flex-1 h-0 w-full overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TabWindowContainer />
        </div>        {rightSidebarOpen && (
          <RightSidebar 
            onClose={() => setRightSidebarOpen(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default StudioLayout;