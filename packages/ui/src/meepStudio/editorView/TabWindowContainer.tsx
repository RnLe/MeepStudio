// src/components/layout/TabWindowContainer.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";
import CanvasToolbar from "./CanvasToolbar";
import { MeepProject } from "@meepstudio/types";

// dynamically load the client-only ProjectCanvas with typed props (so it never touches the SSR compiler)
const ProjectCanvas = dynamic<{ project: MeepProject }>(
  () => import("../canvas/ProjectCanvas"),
  { ssr: false }
);

const TabWindowContainer: React.FC<{ activeProject: MeepProject }> = ({
  activeProject,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* toolbar can sit above the canvas */}
      <CanvasToolbar />

      {/* this import only runs in the browser */}
      <ProjectCanvas project={activeProject} />
    </div>
  );
};

export default TabWindowContainer;
