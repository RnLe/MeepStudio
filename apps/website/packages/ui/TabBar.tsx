import React, { useState } from "react";
import { X } from "lucide-react";
import ContextMenu from "./ContextMenu";
import { MeepProject } from "../types/meepProjectTypes";

interface Props {
  tabs: MeepProject[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onRemoveProject?: (id: string) => void;
}

const TabBar: React.FC<Props> = ({ tabs, activeId, onSelect, onClose, onRemoveProject }) => {
  const [contextMenu, setContextMenu] = useState<null | { x: number; y: number; tab: MeepProject }>(null);

  const handleContextMenu = (e: React.MouseEvent, tab: MeepProject) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tab,
    });
  };

  const handleRemove = (tab: MeepProject) => {
    if (window.confirm(`Are you sure you want to delete the project "${tab.title}"? This cannot be undone.`)) {
      onRemoveProject?.(tab.documentId);
    }
  };

  return (
    <div className="flex items-center h-10 bg-gray-800 border-b border-gray-700 px-2">
      <div className="flex space-x-1 overflow-x-auto">
        {tabs.map((t) => (
          <div
            key={t.documentId}
            onClick={() => onSelect(t.documentId!)}
            onContextMenu={(e) => handleContextMenu(e, t)}
            className={`flex items-center px-3 py-1 rounded-t cursor-pointer ${
              t.documentId === activeId ? "bg-gray-900" : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            <span className="truncate max-w-xs">{t.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(t.documentId!);
              }}
            >
              <X size={12} className="ml-1 text-gray-400 hover:text-white" />
            </button>
          </div>
        ))}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          entries={[
            {
              label: "Remove Project",
              danger: true,
              onClick: () => handleRemove(contextMenu.tab),
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default TabBar;
