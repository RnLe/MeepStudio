"use client";
import React from "react";
import { useCanvasStore } from "../providers/CanvasStore";
import { Cylinder, Rectangle, Triangle } from "../types/canvasElementTypes";
import { nanoid } from "nanoid";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { MeepProject } from "../types/meepProjectTypes";

interface CanvasToolbarProps {
  project: MeepProject;
  ghPages: boolean;
  dimension?: number;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ project, dimension, ghPages }) => {
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  const addGeometry = useCanvasStore((s) => s.addGeometry);
  const { updateProject } = useMeepProjects({ ghPages });
  const projectId = project.documentId;
  const geometries = project.geometries || [];

  const newCylinder = () => {
    const newGeom = {
      kind: "cylinder",
      id: nanoid(),
      pos: { x: 5, y: 5 },
      radius: 1,
    } as Cylinder;
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: {
        geometries: [...geometries, newGeom],
      },
    });
  };

  const newRect = () => {
    const newGeom = {
      kind: "rectangle",
      id: nanoid(),
      pos: { x: 10, y: 8 },
      width: 2,
      height: 3,
    } as Rectangle;
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: {
        geometries: [...geometries, newGeom],
      },
    });
  };

  const newTriangle = () => {
    const newGeom = {
      kind: "triangle",
      id: nanoid(),
      pos: { x: 8, y: 8 },
      vertices: [
        { x: 7, y: 7 },
        { x: 9, y: 7 },
        { x: 8, y: 10 },
      ],
    } as Triangle;
    addGeometry(newGeom);
    updateProject({
      documentId: projectId,
      project: {
        geometries: [...geometries, newGeom],
      },
    });
  };

  // Toolbar sets by dimension
  // If dimension is 2, show Circle, Rectangle, Triangle. If 3, show Cylinder, Block, etc.
  // For now, only 2D is implemented, so just use dimension === 2 logic.
  if (dimension === 2) {
    return (
      <div className="flex space-x-2 p-2 bg-gray-800 text-white text-xs">
        <button onClick={toggleSnap} className="px-2 py-1 bg-yellow-600 rounded">
          Snap: {snapToGrid ? "On" : "Off"}
        </button>
        <button onClick={newCylinder} className="px-2 py-1 bg-blue-600 rounded">
          + Circle
        </button>
        <button onClick={newRect} className="px-2 py-1 bg-emerald-600 rounded">
          + Rectangle
        </button>
        <button onClick={newTriangle} className="px-2 py-1 bg-pink-600 rounded">
          + Triangle
        </button>
      </div>
    );
  }

  return null; // or some other default UI for different dimensions
};

export default CanvasToolbar;
