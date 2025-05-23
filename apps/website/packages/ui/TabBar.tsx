import React from "react";
import { X } from "lucide-react";
import { MeepProject } from "../types/meepProjectTypes";

interface Props {
  tabs: MeepProject[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

const TabBar: React.FC<Props> = ({ tabs, activeId, onSelect, onClose }) => (
  <div className="flex items-center h-10 bg-gray-800 border-b border-gray-700 px-2">
    <div className="flex space-x-1 overflow-x-auto">
      {tabs.map((t) => (
        <div
          key={t.documentId}
          onClick={() => onSelect(t.documentId!)}
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
  </div>
);

export default TabBar;
