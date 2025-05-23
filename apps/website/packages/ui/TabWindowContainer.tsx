// src/components/layout/TabWindowContainer.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";
import CanvasToolbar from "./CanvasToolbar";
import { MeepProject } from "../types/meepProjectTypes";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;

// pick your desired integer grid size here (or pull from activeProject)
const GRID_W = 80;
const GRID_H = 80;

// dynamically load the client-only ProjectCanvas
const ProjectCanvas = dynamic<{
  project: MeepProject;
  minZoom: number;
  maxZoom: number;
  gridWidth: number;
  gridHeight: number;
}>(() => import("./ProjectCanvas"), { ssr: false });

const TabWindowContainer: React.FC<{ activeProject: MeepProject }> = ({
  activeProject,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CanvasToolbar />
      <ProjectCanvas
        project={activeProject}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        gridWidth={GRID_W}
        gridHeight={GRID_H}
      />
    </div>
  );
};

export default TabWindowContainer;
