// src/components/layout/TabWindowLattice.tsx
"use client";
import React from "react";
import { MeepProject } from "../types/meepProjectTypes";
import LatticeBuilder from "./LatticeBuilder";

interface Props {
  project: MeepProject;
  ghPages: boolean;
}

const TabWindowLattice: React.FC<Props> = ({ project, ghPages }) => {
  // Access the lattice data from the project
  const latticeData = project.lattice;
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
      <LatticeBuilder project={project} ghPages={ghPages} />
    </div>
  );
};

export default TabWindowLattice;
