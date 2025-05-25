// src/components/layout/TabWindowCode.tsx
"use client";
import React from "react";
import { MeepProject } from "../types/meepProjectTypes";
import CodeEditor from "./CodeEditor";

interface Props {
  project: MeepProject;
  ghPages: boolean;
}

const TabWindowCode: React.FC<Props> = ({ project, ghPages }) => {
  // Access the code data from the project
  const codeData = project.code;
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CodeEditor project={project} ghPages={ghPages} />
    </div>
  );
};

export default TabWindowCode;
