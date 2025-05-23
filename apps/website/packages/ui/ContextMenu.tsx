import React, { useEffect, useRef } from "react";

export interface ContextMenuEntry {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  entries: ContextMenuEntry[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, entries, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-gray-800 border border-gray-700 rounded shadow-lg min-w-[120px]"
      style={{ left: x, top: y }}
    >
      {entries.map((entry, i) => (
        <button
          key={i}
          className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-700 focus:bg-gray-700 transition-colors text-gray-200`}
          style={{ margin: 0, borderRadius: 0 }}
          onClick={() => {
            entry.onClick();
            onClose();
          }}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;
