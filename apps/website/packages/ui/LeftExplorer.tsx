"use client";

import React, { useState } from "react";
import { MeepProject, Lattice } from "../types/meepProjectTypes";
import { MoreHorizontal, Plus, ChevronDown, ChevronRight } from "lucide-react";
import ContextMenu from "./ContextMenu";
import { useEditorStateStore } from "../providers/EditorStateStore";
import CreateProjectModal from "./CreateProjectModal";

export default function LeftExplorer() {
  const { 
    projects, 
    lattices,
    openProject, 
    openLattice,
    deleteProject,
    deleteLattice,
    closeProject,
    closeLattice,
    setLeftSidebarPanel
  } = useEditorStateStore();
  
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [latticesExpanded, setLatticesExpanded] = useState(true);
  
  // Context menus
  const [projectContextMenu, setProjectContextMenu] = useState<
    | { x: number; y: number; project: MeepProject }
    | null
  >(null);
  const [latticeContextMenu, setLatticeContextMenu] = useState<
    | { x: number; y: number; lattice: Lattice }
    | null
  >(null);

  const handleDeleteProject = async (project: MeepProject) => {
    if (window.confirm(`Are you sure you want to delete the project "${project.title}"? This cannot be undone.`)) {
      await deleteProject(project.documentId);
      closeProject(project.documentId);
    }
  };

  const handleDeleteLattice = async (lattice: Lattice) => {
    if (window.confirm(`Are you sure you want to delete the lattice "${lattice.title}"? This cannot be undone.`)) {
      await deleteLattice(lattice.documentId);
      closeLattice(lattice.documentId);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Projects Section */}
        <div className="border-b border-gray-700">
          <div 
            className="flex items-center justify-between px-3 py-1 text-sm font-medium text-gray-300 hover:bg-neutral-700 cursor-pointer"
            onClick={() => setProjectsExpanded(!projectsExpanded)}
          >
            <div className="flex items-center">
              {projectsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="ml-1">Projects ({projects.length})</span>
            </div>
            <button
              className="p-0.5 hover:bg-neutral-600 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateProjectModal(true);
              }}
            >
              <Plus size={14} />
            </button>
          </div>
          
          {projectsExpanded && (
            <div className="px-2 pb-2">
              {/* Project List */}
              <div className="space-y-1">
                {projects.map((project) => (
                  <div
                    key={project.documentId}
                    className={`flex items-center px-3 py-1 text-sm text-gray-300 transition-colors cursor-pointer truncate group 
                      ${projectContextMenu && projectContextMenu.project.documentId === project.documentId ? "" : "hover:bg-neutral-600"}`}
                    style={{
                      borderRadius: 0,
                      marginLeft: '-0.5rem',
                      marginRight: '-0.5rem',
                      width: 'calc(100% + 1rem)',
                    }}
                    onClick={() => openProject(project)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setProjectContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        project,
                      });
                    }}
                  >
                    <span className="truncate flex-1">{project.title}</span>
                    <button
                      className="ml-2 cursor-pointer project-menu-btn z-10 group/icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectContextMenu({
                          x: e.currentTarget.getBoundingClientRect().right + window.scrollX,
                          y: e.currentTarget.getBoundingClientRect().bottom + window.scrollY,
                          project,
                        });
                      }}
                    >
                      <MoreHorizontal
                        size={16}
                        className="text-gray-500 opacity-0 group-hover:opacity-100 group/icon:hover:text-gray-300 transition-all"
                      />
                    </button>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500 italic">
                    No projects yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lattices Section */}
        <div>
          <div 
            className="flex items-center justify-between px-3 py-1 text-sm font-medium text-gray-300 hover:bg-neutral-700 cursor-pointer"
            onClick={() => setLatticesExpanded(!latticesExpanded)}
          >
            <div className="flex items-center">
              {latticesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="ml-1">Lattices ({lattices.length})</span>
            </div>
            <button
              className="p-0.5 hover:bg-neutral-600 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setLeftSidebarPanel("latticeBuilder");
              }}
            >
              <Plus size={14} />
            </button>
          </div>
          
          {latticesExpanded && (
            <div className="px-2 pb-2">
              {/* Lattice List */}
              <div className="space-y-1">
                {lattices.map((lattice) => (
                  <div
                    key={lattice.documentId}
                    className={`flex items-center px-3 py-1 text-sm text-gray-300 transition-colors cursor-pointer truncate group 
                      ${latticeContextMenu && latticeContextMenu.lattice.documentId === lattice.documentId ? "" : "hover:bg-neutral-600"}`}
                    style={{
                      borderRadius: 0,
                      marginLeft: '-0.5rem',
                      marginRight: '-0.5rem',
                      width: 'calc(100% + 1rem)',
                    }}
                    onClick={() => openLattice(lattice)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setLatticeContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        lattice,
                      });
                    }}
                  >
                    <span className="truncate flex-1">{lattice.title}</span>
                    <button
                      className="ml-2 cursor-pointer project-menu-btn z-10 group/icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLatticeContextMenu({
                          x: e.currentTarget.getBoundingClientRect().right + window.scrollX,
                          y: e.currentTarget.getBoundingClientRect().bottom + window.scrollY,
                          lattice,
                        });
                      }}
                    >
                      <MoreHorizontal
                        size={16}
                        className="text-gray-500 opacity-0 group-hover:opacity-100 group/icon:hover:text-gray-300 transition-all"
                      />
                    </button>
                  </div>
                ))}
                {lattices.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500 italic">
                    No lattices yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Context Menus */}
        {projectContextMenu && (
          <ContextMenu
            x={projectContextMenu.x}
            y={projectContextMenu.y}
            onClose={() => setProjectContextMenu(null)}
            entries={[
              {
                label: "Open",
                onClick: () => {
                  openProject(projectContextMenu.project);
                  setProjectContextMenu(null);
                },
              },
              {
                label: "Delete",
                onClick: () => {
                  handleDeleteProject(projectContextMenu.project);
                  setProjectContextMenu(null);
                },
                danger: true,
              },
            ]}
          />
        )}

        {latticeContextMenu && (
          <ContextMenu
            x={latticeContextMenu.x}
            y={latticeContextMenu.y}
            onClose={() => setLatticeContextMenu(null)}
            entries={[
              {
                label: "Open",
                onClick: () => {
                  openLattice(latticeContextMenu.lattice);
                  setLatticeContextMenu(null);
                },
              },
              {
                label: "Delete",
                onClick: () => {
                  handleDeleteLattice(latticeContextMenu.lattice);
                  setLatticeContextMenu(null);
                },
                danger: true,
              },
            ]}
          />
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
      />
    </>
  );
}
