// src/components/meep/Explorer/ProjectExplorer.tsx
"use client";

import React, { useState } from "react";
import { nanoid } from "nanoid";
import { MeepProject } from "../types/meepProjectTypes";
import { MoreHorizontal, Ban } from "lucide-react";
import ContextMenu from "./ContextMenu";
import { projectSettings } from "../types/editorSettings";

interface Props {
  projects: MeepProject[];
  openProject: (p: MeepProject) => void;
  createProject: (p: MeepProject) => Promise<MeepProject>;
  deleteProject: (id: string) => Promise<void>;
  onCloseTab?: (id: string) => void; // Added prop for closing tab
}

export default function ProjectExplorer({ projects, openProject, createProject, deleteProject, onCloseTab }: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDimension, setNewDimension] = useState<number>(2);
  const [newRectWidth, setNewRectWidth] = useState(projectSettings.rectWidth.default);
  const [newRectHeight, setNewRectHeight] = useState(projectSettings.rectHeight.default);
  const [newResolution, setNewResolution] = useState(projectSettings.resolution.default);
  const [showAdditional, setShowAdditional] = useState(false);
  const [contextMenu, setContextMenu] = useState<
    | { x: number; y: number; project: MeepProject }
    | null
  >(null);
  const predefinedResolutions = [4, 8, 16, 32, 64]; // 128 removed
  const [resolutionMode, setResolutionMode] = useState<'predefined' | 'custom'>('predefined');

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const project = await createProject({
        documentId: nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title,
        dimension,
        rectWidth,
        rectHeight,
        resolution,
        description: newDescription.trim(),
        geometries: [],
      });
      setNewTitle("");
      setNewDescription("");
      setNewRectWidth(10);
      setNewRectHeight(10);
      setNewResolution(4);
      setResolutionMode('predefined');
      setShowCreateForm(false);
      setShowAdditional(false);
      openProject(project);
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  const handleDelete = async (project: MeepProject) => {
    if (window.confirm(`Are you sure you want to delete the project "${project.title}"? This cannot be undone.`)) {
      await deleteProject(project.documentId);
      onCloseTab?.(project.documentId); // Close tab after deletion
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-2 py-2">
      <div className="space-y-1">
        {projects.map((project) => (
          <div
            key={project.documentId}
            className={`flex items-center px-3 py-1 text-sm text-gray-300 transition-colors cursor-pointer truncate group 
              ${contextMenu && contextMenu.project.documentId === project.documentId ? "" : "hover:bg-neutral-600"}`}
            style={{
              borderRadius: 0,
              marginLeft: '-0.5rem', // -2 for px-2 parent
              marginRight: '-0.5rem',
              width: 'calc(100% + 1rem)', // compensate for px-2 parent
            }}
            onClick={() => openProject(project)}
            // Remove hover when three-dots is hovered
            onMouseEnter={e => {
              const btn = e.currentTarget.querySelector('.project-menu-btn');
              if (btn) btn.classList.remove('pointer-events-none');
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget.querySelector('.project-menu-btn');
              if (btn) btn.classList.add('pointer-events-none');
            }}
          >
            <span className="truncate flex-1">{project.title}</span>
            <button
              className="ml-2 cursor-pointer project-menu-btn z-10 group/icon"
              onClick={(e) => {
              e.stopPropagation();
              setContextMenu({
                x: e.currentTarget.getBoundingClientRect().right + window.scrollX,
                y: e.currentTarget.getBoundingClientRect().bottom + window.scrollY,
                project,
              });
              }}
              title="More"
              tabIndex={-1}
              style={{ opacity: 1, borderRadius: 0 }}
              onMouseEnter={e => {
              // Remove hover from parent
              e.currentTarget.parentElement?.classList.remove('hover:bg-neutral-600');
              }}
              onMouseLeave={e => {
              // Restore hover to parent
              e.currentTarget.parentElement?.classList.add('hover:bg-neutral-600');
              }}
            >
              <MoreHorizontal size={16} className="transition-all group-hover/icon:stroke-3" />
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
              onClick: () => handleDelete(contextMenu.project),
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
      <div className="px-2 py-2 border-t border-gray-700">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full px-2 py-2 border-2 border-gray-600 border-dashed text-sm text-gray-300 hover:text-white rounded"
          >
            Create New Project
          </button>
        ) : (
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              type="text"
              required
              placeholder="New project title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full mb-2 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm placeholder-gray-500 text-white"
            />
            {/* Dimensions label */}
            <div className="flex flex-col items-center mb-1">
              <span className="text-xs text-gray-400 mb-1 text-center">Dimensions</span>
              <div className="flex space-x-2 w-full">
                {[1, 2, 3].map((d) => {
                  const isDisabled = d !== 2;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => !isDisabled && setNewDimension(d)}
                      className={`flex-1 px-2 py-1 rounded relative flex items-center justify-center ${
                        newDimension === d
                          ? "bg-blue-500 text-white"
                          : isDisabled
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                      disabled={isDisabled}
                      title={isDisabled ? `${d}D is not supported yet` : undefined}
                    >
                      {d}D
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Rectangle size fields with X */}
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="number"
                min={projectSettings.rectWidth.min}
                max={projectSettings.rectWidth.max}
                required
                value={newRectWidth}
                onChange={e => setNewRectWidth(Number(e.target.value))}
                className="flex-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-sm text-white"
                placeholder={`Rectangle width (${projectSettings.rectWidth.min}-${projectSettings.rectWidth.max})`}
                aria-label="Rectangle width"
              />
              <span className="text-gray-400 text-base font-semibold select-none" style={{lineHeight: '1'}}>×</span>
              <input
                type="number"
                min={projectSettings.rectHeight.min}
                max={projectSettings.rectHeight.max}
                required
                value={newRectHeight}
                onChange={e => setNewRectHeight(Number(e.target.value))}
                className="flex-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-sm text-white"
                placeholder={`Rectangle height (${projectSettings.rectHeight.min}-${projectSettings.rectHeight.max})`}
                aria-label="Rectangle height"
              />
            </div>
            {/* Additional Properties button/card */}
            <button
              type="button"
              className="w-full text-xs text-gray-400 hover:text-gray-200 mb-1 rounded bg-gray-700/80 hover:bg-gray-600/80 px-2 py-1 cursor-pointer transition-colors flex items-center justify-center"
              style={{ border: "none", padding: 0 }}
              onClick={() => setShowAdditional(v => !v)}
            >
              <span className="w-full text-center">{showAdditional ? "Hide Additional Properties" : "Additional Properties"}</span>
            </button>
            {showAdditional && (
              <div className="space-y-2 pl-2 border-l border-gray-700 bg-gray-800/60 rounded p-2 flex flex-col items-center">
                <ul className="space-y-2 w-full">
                  <li>
                    <textarea
                      placeholder="Description (optional)"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm placeholder-gray-500 text-white"
                    />
                  </li>
                  <li>
                    <label className="block text-xs text-gray-400 mb-1">Resolution</label>
                    <div className="flex flex-row justify-evenly gap-2 mb-2">
                      {predefinedResolutions.map((val) => (
                        <button
                          key={val}
                          type="button"
                          className={`px-2 py-1 rounded text-sm font-mono border border-gray-600 transition-colors cursor-pointer select-none ${
                            resolutionMode === 'predefined' && newResolution === val
                              ? 'bg-blue-600 text-white border-blue-400'
                              : 'bg-gray-800 text-gray-200 hover:bg-blue-500 hover:text-white'
                          }`}
                          onClick={() => {
                            setNewResolution(val);
                            setResolutionMode('predefined');
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <div className="w-full flex">
                      <input
                        type="number"
                        min={projectSettings.resolution.min}
                        max={projectSettings.resolution.max}
                        step={projectSettings.resolution.step}
                        value={resolutionMode === 'custom' ? newResolution : ''}
                        onChange={e => {
                          setNewResolution(Math.max(projectSettings.resolution.min, Math.min(projectSettings.resolution.max, Math.floor(Number(e.target.value)))));
                        }}
                        onFocus={() => {
                          if (resolutionMode !== 'custom') {
                            setResolutionMode('custom');
                            setNewResolution(newResolution || projectSettings.resolution.default);
                          }
                        }}
                        placeholder="Custom"
                        className={`w-full px-2 py-1 rounded text-sm font-mono border border-gray-600 bg-gray-800 text-white transition-colors text-center ${
                          resolutionMode === 'custom' ? 'ring-2 ring-blue-400' : 'opacity-60 cursor-pointer'
                        }`}
                        disabled={false}
                        tabIndex={0}
                        style={{ marginLeft: 0 }}
                        onClick={() => {
                          if (resolutionMode !== 'custom') {
                            setResolutionMode('custom');
                            setNewResolution(newResolution || projectSettings.resolution.default);
                          }
                        }}
                      />
                    </div>
                  </li>
                  {/* Add more optional properties here as <li> elements */}
                </ul>
              </div>
            )}
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded cursor-pointer transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTitle("");
                  setNewDescription("");
                  setNewRectWidth(10);
                  setNewRectHeight(10);
                  setNewResolution(4);
                  setShowAdditional(false);
                }}
                className="flex-1 px-2 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
