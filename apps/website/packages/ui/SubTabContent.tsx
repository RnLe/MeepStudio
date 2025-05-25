"use client";
import React from "react";
import { SubTab } from "../providers/EditorStateStore";
import { MeepProject } from "../types/meepProjectTypes";
import TabWindowScene from "./TabWindowScene";
import LatticeBuilder from "./LatticeBuilder";
import CodeEditor from "./CodeEditor";

interface Props {
  subTab: SubTab;
  project: MeepProject;
  ghPages: boolean;
}

const SubTabContent: React.FC<Props> = ({ subTab, project, ghPages }) => {
  switch (subTab.type) {
    case "scene":
      return <TabWindowScene project={project} ghPages={ghPages} />;
    
    case "lattice":
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
          <LatticeBuilder />
        </div>
      );
    
    case "code":
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          <CodeEditor />
        </div>
      );
    
    default:
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Unknown sub-tab type: {subTab.type}
        </div>
      );
  }
};

export default SubTabContent;
