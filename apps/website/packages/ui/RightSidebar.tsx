// src/components/layout/RightSidebar.tsx
import React from "react";
import { SimulationConsole } from "./SimulationConsole";
import { MeepProject } from "../types/meepProjectTypes";
import ObjectsList from "./ObjectList";
import ObjectPropertiesPanel from "./ObjectPropertiesPanels";


interface Props {
  open: boolean;
  project: MeepProject | null;
}

const RightSidebar: React.FC<Props> = ({ open, project }) => {
  return (
    <div
      className={`flex-shrink-0 w-80 bg-gray-900 border-l border-gray-700 p-4 space-y-4
        transform transition-transform duration-200
        ${open ? "translate-x-0" : "translate-x-full"}`}
    >
      {project ? (
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-white">{project.title}</h2>
          {project.description && (
            <p className="text-sm text-gray-400">{project.description}</p>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No project selected</p>
      )}

      <hr className="border-gray-700" />
      <ObjectsList />
      <hr className="border-gray-700" />
      <ObjectPropertiesPanel />

    </div>
  );
};

export default RightSidebar;
