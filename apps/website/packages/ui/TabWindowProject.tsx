// src/components/layout/TabWindowProject.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";
import CanvasToolbar from "./CanvasToolbar";
import { MeepProject } from "../types/meepProjectTypes";
import { useCanvasStore } from "../providers/CanvasStore";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;

// pick your desired integer grid size here (or pull from activeProject)
const GRID_W = 80;
const GRID_H = 80;

// dynamically load the client-only ProjectCanvas
const ProjectCanvas = dynamic<{
  project: MeepProject;
  ghPages: boolean;
  minZoom: number;
  maxZoom: number;
  gridWidth: number;
  gridHeight: number;
}>(() => import("./ProjectCanvas"), { ssr: false });

interface Props {
  project: MeepProject;
  ghPages: boolean;
}

const TabWindowProject: React.FC<Props> = ({ project, ghPages }) => {
  const setActiveProject = useCanvasStore((s) => s.setActiveProject);
  const dimension = project.dimension;
  React.useEffect(() => {
    if (project?.documentId) {
      setActiveProject(project.documentId);
    }
  }, [project?.documentId, setActiveProject]);
  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
      <CanvasToolbar project={project} dimension={dimension} ghPages={ghPages} />
      <ProjectCanvas
        project={project}
        ghPages={ghPages}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        gridWidth={GRID_W}
        gridHeight={GRID_H}
      />
    </div>
  );
};

export default TabWindowProject;