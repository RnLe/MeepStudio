// src/components/layout/StudioLayout.tsx
"use client";

import React, {useEffect} from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import TabWindowContainer from "./TabWindowContainer";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useEditorStateStore } from "../providers/EditorStateStore";

interface Props {
  ghPages: boolean;     // Whether to use GitHub Pages; controls the availability of some features
}

const StudioLayout: React.FC<Props> = ({ ghPages }) => {
  // Only subscribe to the specific UI state we need
  const {
    rightSidebarOpen,
    setGhPages,
    setRightSidebarOpen,
  } = useEditorStateStore();
  
  // Initialize the store with ghPages flag
  useEffect(() => {
    setGhPages(ghPages);
  }, [ghPages, setGhPages]);

  return (
    <div className="flex flex-col h-full w-full bg-neutral-900 text-white overflow-hidden relative">
      <div className="flex flex-1 h-0 w-full overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TabWindowContainer />
        </div>
        {/* Right sidebar with smooth transition */}
        <div
          className={`flex-none bg-neutral-800 border-l border-gray-700 overflow-hidden transition-all duration-200 ${
            rightSidebarOpen ? "w-80" : "w-0"
          }`}
        >
          <RightSidebar 
            onClose={() => setRightSidebarOpen(false)} 
          />
        </div>
      </div>
    </div>
  );
};

export default StudioLayout;