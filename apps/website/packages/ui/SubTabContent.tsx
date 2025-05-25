"use client";
import React from "react";
import { SubTab } from "../providers/EditorStateStore";
import { MeepProject } from "../types/meepProjectTypes";
import TabWindowScene from "./TabWindowScene";
import TabWindowLattice from "./TabWindowLattice";
import TabWindowCode from "./TabWindowCode";

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
      return <TabWindowLattice project={project} ghPages={ghPages} />;
    
    case "code":
      return <TabWindowCode project={project} ghPages={ghPages} />;
    
    default:
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Unknown sub-tab type: {subTab.type}
        </div>
      );
  }
};

export default SubTabContent;
