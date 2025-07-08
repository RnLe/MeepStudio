import React, { useState } from "react";
import { Folder, Hexagon, Home, Github } from "lucide-react";
import LeftExplorer from "./LeftExplorer";
import LeftLatticeBuilder from "./LeftLatticeBuilder";
import { useEditorStateStore } from "../providers/EditorStateStore";
import CustomLucideIcon from "./CustomLucideIcon";
import { useRouter } from "next/navigation";

type Panel = "explorer" | "latticeBuilder" | null;

export default function LeftSidebar() {
  const [panel, setPanel] = useState<Panel>("explorer");
  const { setLeftSidebarPanel, leftSidebarPanel, openDashboard, activeDashboardId } = useEditorStateStore();
  const router = useRouter();

  React.useEffect(() => {
    if (leftSidebarPanel) {
      setPanel(leftSidebarPanel);
    }
  }, [leftSidebarPanel]);

  const toggle = (p: Panel) => {
    const newPanel = panel === p ? null : p;
    setPanel(newPanel);
    setLeftSidebarPanel(newPanel);
  };

  const handleDashboardClick = () => {
    // Don't close panels, just open dashboard
    openDashboard();
  };

  const handleGitHubClick = () => {
    window.open(
      "https://github.com/RnLe/MeepStudio",
      "_blank",
      "noopener,noreferrer"
    );
  };

  // const handleHomeClick = () => {
  //   router.push("/");
  // };

  const icons = [
    { 
      key: "github", 
      Icon: Github, 
      title: "GitHub Repository",
      onClick: handleGitHubClick,
      isSpecial: true
    },
    // { 
    //   key: "home", 
    //   Icon: Home, 
    //   title: "Home",
    //   onClick: handleHomeClick,
    //   isSpecial: true
    // },
    // { 
    //   key: "dashboard", 
    //   Icon: ({ className }: { className?: string }) => (
    //     <CustomLucideIcon src="/icons/dashboard.svg" size={25} className={className} />
    //   ), 
    //   title: "Dashboard",
    //   onClick: handleDashboardClick,
    //   isSpecial: true
    // },
    { key: "explorer", Icon: Folder, title: "Explorer", onClick: undefined, isSpecial: false },
    { key: "latticeBuilder", Icon: ({ className }: { className?: string }) => (
        <CustomLucideIcon src="/icons/lattice.svg" size={25} className={className} />
      ),  title: "Lattice Builder", onClick: undefined, isSpecial: false },
  ];

  return (
    <div className="flex h-full">
      {/* Icon column */}
      <div className="flex flex-col w-14 bg-gray-800 border-r border-gray-700 space-y-2">
        {icons.map((icon) => {
          const { key, Icon, title, onClick, isSpecial } = icon;
          const isActive = !isSpecial && panel === key;
          const isGitHub = key === "github";
          return (
            <button
              key={key}
              onClick={() => isSpecial && onClick ? onClick() : toggle(key as Panel)}
              title={title}
              className={`group cursor-pointer relative flex items-center justify-center w-full h-12 box-border ${
                isActive ? "border-l-4 border-blue-400" : "border-l-4 border-transparent"
              } ${isGitHub ? "bg-gray-700 hover:bg-gray-600" : ""}`}
            >
              <Icon
                size={25}
                className={`transition-colors ${
                  isActive || isGitHub ? "text-white" : "text-gray-400 group-hover:text-white"
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
            {panel === "explorer" && "Explorer"}
            {panel === "latticeBuilder" && "Lattice Builder"}
          </div>
          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {panel === "explorer" && <LeftExplorer />}
            {panel === "latticeBuilder" && (
              <LeftLatticeBuilder onCancel={() => toggle("explorer")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
