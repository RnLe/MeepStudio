// src/components/meep/Explorer/ProjectExplorer.tsx
"use client";

import React, { useState } from "react";
import { nanoid } from "nanoid";
import { MeepProject } from "../types/meepProjectTypes";
import { MoreHorizontal } from "lucide-react";
import ContextMenu from "./ContextMenu";

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
  const [contextMenu, setContextMenu] = useState<
    | { x: number; y: number; project: MeepProject }
    | null
  >(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const dimension = newDimension;
    try {
      const project = await createProject({
        documentId: nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title,
        dimension,
        description: newDescription.trim()
      });
      setNewTitle("");
      setNewDescription("");
      setShowCreateForm(false);
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
            <textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full mb-2 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm placeholder-gray-500 text-white"
            />
            <div className="flex space-x-2 mb-2">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setNewDimension(d)}
                  className={`flex-1 px-2 py-1 rounded ${
                    newDimension === d
                      ? "bg-blue-500 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTitle("");
                  setNewDescription("");
                }}
                className="flex-1 px-2 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
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
