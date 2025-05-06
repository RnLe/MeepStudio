"use client";
import React from "react";
import { useCanvasStore } from "@meepstudio/providers";
import { Cylinder, Rectangle } from "@meepstudio/types";

const CanvasToolbar: React.FC = () => {
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  const addCylinder = useCanvasStore((s) => s.addCylinder);
  const addRectangle = useCanvasStore((s) => s.addRectangle);

  const newCylinder = () =>
    addCylinder({
      kind: "cylinder",
      pos: { x: 5, y: 5 },
      radius: 1,
    } as Omit<Cylinder, "id">);

  const newRect = () =>
    addRectangle({
      kind: "rectangle",
      pos: { x: 10, y: 8 },
      width: 2,
      height: 3,
    } as Omit<Rectangle, "id">);

  return (
    <div className="flex space-x-2 p-2 bg-gray-800 text-white text-xs">
      <button onClick={toggleSnap} className="px-2 py-1 bg-yellow-600 rounded">
        Snap: {snapToGrid ? "On" : "Off"}
      </button>
      <button onClick={newCylinder} className="px-2 py-1 bg-blue-600 rounded">
        + Cylinder
      </button>
      <button onClick={newRect} className="px-2 py-1 bg-emerald-600 rounded">
        + Rectangle
      </button>
    </div>
  );
};

export default CanvasToolbar;
