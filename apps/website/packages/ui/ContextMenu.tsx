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
      className="fixed z-50 bg-slate-800/95 backdrop-blur-md border border-slate-600/50 rounded-lg shadow-2xl min-w-[120px] py-0.5"
      style={{ left: x, top: y }}
    >
      {entries.map((entry, i) => (
        <button
          key={i}
          className="w-full text-left px-3 py-1.5 text-sm transition-all duration-200 first:rounded-t-lg last:rounded-b-lg text-slate-200 hover:bg-slate-700/60 hover:text-white focus:bg-slate-700/60"
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
