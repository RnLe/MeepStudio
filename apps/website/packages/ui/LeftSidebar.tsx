"use client";

import React, { useState } from "react";
import { Folder, Hexagon } from "lucide-react";
import { MeepProject } from "../types/meepProjectTypes";
import ProjectExplorer from "./ProjectExplorer";
import LatticeBuilder from "./LatticeBuilder";

type Panel = "explorer" | "lattice" | null;

interface Props {
  projects: MeepProject[];
  openProject: (p: MeepProject) => void;
  createProject: (p: MeepProject) => Promise<MeepProject>;
  deleteProject: (id: string) => Promise<void>;
  onCloseTab?: (id: string) => void;
}

export default function LeftSidebar({ projects, openProject, createProject, deleteProject, onCloseTab }: Props) {
  const [panel, setPanel] = useState<Panel>("explorer");

  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  const icons = [
    { key: "explorer", Icon: Folder, title: "Project Explorer" },
    { key: "lattice", Icon: Hexagon, title: "Lattice Builder" },
  ] as const;

  return (
    <div className="flex h-full">
      {/* Icon column */}
      <div className="flex flex-col w-14 bg-gray-800 border-r border-gray-700 space-y-2">
        {icons.map(({ key, Icon, title }) => {
          const isActive = panel === key;
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              title={title}
              className={`group cursor-pointer relative flex items-center justify-center w-full h-12 box-border ${
                isActive ? "border-l-4 border-blue-400" : "border-l-4 border-transparent"
              }`}
            >
              <Icon
                size={25}
                className={`transition-colors ${
                  isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Sliding panel */}
      <div
        className={`flex-none bg-neutral-800 border-r border-gray-700 overflow-hidden transition-all duration-200 ${
          panel ? "w-64" : "w-0"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Panel Top Navbar */}
          <div className="h-8 w-full flex items-center px-4 text-xs tracking-widest uppercase text-gray-300 select-none" style={{ minHeight: 32 }}>
            {panel === "explorer" && "Project Explorer"}
            {panel === "lattice" && "Lattice Builder"}
          </div>
          {/* Panel Content */}
          <div className="flex-1">
            {panel === "explorer" && (
              <ProjectExplorer
                projects={projects}
                openProject={openProject}
                createProject={createProject}
                deleteProject={deleteProject}
                onCloseTab={onCloseTab}
              />
            )}
            {panel === "lattice" && <LatticeBuilder />}
          </div>
        </div>
      </div>
    </div>
  );
}
