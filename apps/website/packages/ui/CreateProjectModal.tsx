"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { projectSettings } from "../types/editorSettings";
import { useEditorStateStore } from "../providers/EditorStateStore";
import { LengthUnit } from "../types/meepProjectTypes";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { createProject } = useEditorStateStore();
  
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDimension, setNewDimension] = useState<number>(2);
  const [newRectWidth, setNewRectWidth] = useState(projectSettings.rectWidth.default);
  const [newRectHeight, setNewRectHeight] = useState(projectSettings.rectHeight.default);
  const [newResolution, setNewResolution] = useState(projectSettings.resolution.default);
  const [resolutionMode, setResolutionMode] = useState<'predefined' | 'custom'>('predefined');
  const [newA, setNewA] = useState(1);
  const [newUnit, setNewUnit] = useState<LengthUnit>(LengthUnit.UM);
  
  const predefinedResolutions = [4, 8, 16, 32, 64];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNewTitle("");
      setNewDescription("");
      setNewDimension(2);
      setNewRectWidth(projectSettings.rectWidth.default);
      setNewRectHeight(projectSettings.rectHeight.default);
      setNewResolution(projectSettings.resolution.default);
      setResolutionMode('predefined');
      setNewA(1);
      setNewUnit(LengthUnit.UM);
    }
  }, [isOpen]);

  // Close modal if nothing entered and clicked outside
  const hasContent = newTitle || newDescription || 
    newDimension !== 2 || 
    newRectWidth !== projectSettings.rectWidth.default || 
    newRectHeight !== projectSettings.rectHeight.default || 
    newResolution !== projectSettings.resolution.default ||
    newA !== 1 ||
    newUnit !== LengthUnit.UM;

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    
    const dimension = newDimension;
    const rectWidth = Math.max(projectSettings.rectWidth.min, Math.min(projectSettings.rectWidth.max, Math.floor(Number(newRectWidth))));
    const rectHeight = Math.max(projectSettings.rectHeight.min, Math.min(projectSettings.rectHeight.max, Math.floor(Number(newRectHeight))));
    let resolution = projectSettings.resolution.default;
    if (resolutionMode === 'predefined') {
      resolution = newResolution;
    } else {
      resolution = Math.max(projectSettings.resolution.min, Math.min(projectSettings.resolution.max, Math.floor(Number(newResolution))));
    }
    
    try {
      await createProject({
        title,
        scene: {
          dimension,
          rectWidth,
          rectHeight,
          resolution,
          a: newA,
          unit: newUnit,
          geometries: [],
        },
        description: newDescription.trim() || undefined,
      });
      
      onClose();
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      closeOnOutsideClick={!hasContent}
    >
      <form onSubmit={handleCreateProject} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter project title"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            autoFocus
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description (optional)
          </label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Enter description"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Characteristic Length (a)
            </label>
            <input
              type="number"
              value={newA}
              onChange={(e) => setNewA(Number(e.target.value))}
              min="0.001"
              step="0.001"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Unit
            </label>
            <select
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value as LengthUnit)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {Object.values(LengthUnit).map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors"
          >
            Create Project
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
