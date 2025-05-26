// src/components/layout/TabWindowProject.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";
import CanvasToolbar from "./CanvasToolbar";
import { MeepProject } from "../types/meepProjectTypes";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;

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

const TabWindowScene: React.FC<Props> = ({ project, ghPages }) => {
  const scene = project.scene;
  
  return (
    <div className="flex-1 flex flex-row w-full h-full overflow-hidden">
      <CanvasToolbar project={project} dimension={scene.dimension} ghPages={ghPages} />
      <div className="flex-1 flex flex-col w-full h-full">
        <ProjectCanvas
          project={project}
          ghPages={ghPages}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          gridWidth={scene.rectWidth}
          gridHeight={scene.rectHeight}
        />
      </div>
    </div>
  );
};

export default TabWindowScene;