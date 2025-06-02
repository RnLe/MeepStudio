"use client";

import React, { useState, useEffect, useRef } from "react";
import { MeepProject } from "../types/meepProjectTypes";
import { Lattice } from "../types/meepLatticeTypes";
import { MoreHorizontal, Plus, ChevronDown, ChevronRight, Layers, Hexagon, CodeXml, FileText, Trash2, Edit, Grid3x3 } from "lucide-react";
import ContextMenu from "./ContextMenu";
import { useEditorStateStore } from "../providers/EditorStateStore";
import { useMeepProjects } from "../hooks/useMeepProjects";
import CreateProjectModal from "./CreateProjectModal";
import CustomLucideIcon from "./CustomLucideIcon";

export default function LeftExplorer() {
  const { 
    projects, 
    openProject, 
    openLattice,
    deleteProject,
    deleteLattice,
    closeProject,
    closeLattice,
    setLeftSidebarPanel,
    activeProjectId,
    activeLatticeId,
    selectedProjectIds,
    selectedLatticeIds,
    toggleProjectSelection,
    toggleLatticeSelection,
    clearAllSelections,
    addCodeTabToProject,
    openTabs,
    activeTabId,
    createProject,
    createLattice
  } = useEditorStateStore();
  
  const { updateProject, updateLattice, lattices } = useMeepProjects({ ghPages: true });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const explorerRef = useRef<HTMLDivElement>(null);
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

  // Add focus tracking
  const [isComponentFocused, setIsComponentFocused] = useState(false);
  
  // Rename functionality
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Sort projects and lattices alphabetically
  const sortedProjects = [...projects].sort((a, b) => a.title.localeCompare(b.title));
  const sortedLattices = [...lattices].sort((a, b) => a.title.localeCompare(b.title));

  // Handle focus loss to clear selections
  useEffect(() => {
    const handleFocusOut = (e: FocusEvent) => {
      // Check if the new focus target is outside our container
      if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
        clearAllSelections();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('focusout', handleFocusOut);
      return () => container.removeEventListener('focusout', handleFocusOut);
    }
  }, [clearAllSelections]);

  const handleProjectClick = (project: MeepProject, e: React.MouseEvent) => {
    const isMulti = e.ctrlKey || e.metaKey;
    const isRange = e.shiftKey;
    
    if (isMulti || isRange) {
      e.preventDefault();
      toggleProjectSelection(project.documentId, isMulti, isRange);
    } else {
      clearAllSelections();
      openProject(project);
    }
  };

  const handleLatticeClick = (lattice: Lattice, e: React.MouseEvent) => {
    const isMulti = e.ctrlKey || e.metaKey;
    const isRange = e.shiftKey;
    
    if (isMulti || isRange) {
      e.preventDefault();
      toggleLatticeSelection(lattice.documentId, isMulti, isRange);
    } else {
      clearAllSelections();
      openLattice(lattice);
    }
  };

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

  // Start renaming
  const startRename = (id: string, currentTitle: string, type: 'project' | 'lattice') => {
    setRenamingId(id);
    setRenameValue(currentTitle);
    // Focus will be set in useEffect
  };
  
  // Handle rename submission with refresh
  const handleRenameSubmit = async (type: 'project' | 'lattice') => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    
    if (type === 'project') {
      const updated = await updateProject({
        documentId: renamingId,
        project: { title: renameValue.trim() }
      });
      
      // Refresh the projects list in EditorStateStore
      if (updated) {
        const updatedProjects = projects.map(p => 
          p.documentId === renamingId ? { ...p, title: renameValue.trim() } : p
        );
        useEditorStateStore.getState().setProjects(updatedProjects);
      }
    } else {
      const updated = await updateLattice({
        documentId: renamingId,
        lattice: { title: renameValue.trim() }
      });
      
      // Refresh the lattices list in EditorStateStore
      if (updated) {
        const updatedLattices = lattices.map(l => 
          l.documentId === renamingId ? { ...l, title: renameValue.trim() } : l
        );
        useEditorStateStore.getState().setLattices(updatedLattices);
      }
    }
    
    setRenamingId(null);
  };
  
  // Cancel rename
  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };
  
  // Focus and select text when starting rename
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Handle F2 key for rename
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && isComponentFocused) {
        e.preventDefault();
        
        // If a single project is selected, rename it
        if (selectedProjectIds.size === 1) {
          const projectId = Array.from(selectedProjectIds)[0];
          const project = projects.find(p => p.documentId === projectId);
          if (project) {
            startRename(projectId, project.title, 'project');
          }
        }
        // If a single lattice is selected, rename it
        else if (selectedLatticeIds.size === 1) {
          const latticeId = Array.from(selectedLatticeIds)[0];
          const lattice = lattices.find(l => l.documentId === latticeId);
          if (lattice) {
            startRename(latticeId, lattice.title, 'lattice');
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComponentFocused, selectedProjectIds, selectedLatticeIds, projects, lattices]);
  
  // Track focus state
  useEffect(() => {
    const handleFocus = () => setIsComponentFocused(true);
    const handleBlur = (e: FocusEvent) => {
      // Check if focus is still within the component
      if (!explorerRef.current?.contains(e.relatedTarget as Node)) {
        setIsComponentFocused(false);
      }
    };
    
    const element = explorerRef.current;
    if (element) {
      element.addEventListener('focusin', handleFocus);
      element.addEventListener('focusout', handleBlur);
      
      return () => {
        element.removeEventListener('focusin', handleFocus);
        element.removeEventListener('focusout', handleBlur);
      };
    }
  }, []);
  
  const handleProjectContextMenu = (e: React.MouseEvent, project: MeepProject) => {
    e.preventDefault();
    // If right-clicking on a selected item, keep selection
    if (!selectedProjectIds.has(project.documentId)) {
      clearAllSelections();
    }
    setProjectContextMenu({
      x: e.clientX,
      y: e.clientY,
      project,
    });
  };

  const handleLatticeContextMenu = (e: React.MouseEvent, lattice: Lattice) => {
    e.preventDefault();
    // If right-clicking on a selected item, keep selection
    if (!selectedLatticeIds.has(lattice.documentId)) {
      clearAllSelections();
    }
    setLatticeContextMenu({
      x: e.clientX,
      y: e.clientY,
      lattice,
    });
  };

  return (
    <div 
      ref={explorerRef}
      className="h-full bg-neutral-800 text-gray-100 flex flex-col select-none"
      tabIndex={0}
    >
      <div ref={containerRef} className="flex-1 flex flex-col overflow-y-auto outline-none" tabIndex={-1}>
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
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-1 top-0 bottom-0 w-px bg-gray-600"></div>
                
                {sortedProjects.map((project) => {
                  const isActive = activeProjectId === project.documentId;
                  const isSelected = selectedProjectIds.has(project.documentId);
                  const hasCodeTab = openTabs.some(t => t.id === `code-${project.documentId}`);
                  const isCodeTabActive = activeTabId === `code-${project.documentId}`;
                  const isRenaming = renamingId === project.documentId;
                  
                  return (
                    <div
                      key={project.documentId}
                      className={`group cursor-pointer select-none px-2 py-1 hover:bg-gray-700 flex items-center justify-between transition-colors
                        ${projectContextMenu && projectContextMenu.project.documentId === project.documentId ? "" : 
                          isActive || isCodeTabActive ? "bg-neutral-600" : 
                          isSelected ? "bg-neutral-700" : "hover:bg-neutral-700"}`}
                      style={{
                        borderRadius: 0,
                        marginLeft: '-0.5rem',
                        marginRight: '-0.5rem',
                        width: 'calc(100% + 1rem)',
                      }}
                      onClick={(e) => handleProjectClick(project, e)}
                      onContextMenu={(e) => handleProjectContextMenu(e, project)}
                      onDoubleClick={() => openProject(project)}
                    >
                      <Layers size={16} className={`mr-2 flex-shrink-0 ml-3 ${isActive || isCodeTabActive ? 'text-blue-400' : isSelected ? 'text-blue-300' : 'text-gray-400'}`} />
                      
                      <div className="flex items-center min-w-0 flex-1">
                        {isRenaming ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameSubmit('project')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleRenameSubmit('project');
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelRename();
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-900 text-white px-1 py-0 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500 w-full"
                          />
                        ) : (
                          <span className={`truncate flex-1 ${isActive || isCodeTabActive ? 'font-medium' : ''}`}>{project.title}</span>
                        )}
                      </div>
                      
                      {/* Code icon - always shown */}
                      <button
                        className="p-0.5 mr-1 rounded hover:bg-neutral-600 transition-colors group/code"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllSelections(); // Clear selections when opening code tab
                          addCodeTabToProject(project.documentId);
                        }}
                        title="Open code editor"
                      >
                        <CodeXml
                          size={16}
                          className={`${
                            isCodeTabActive 
                              ? 'text-blue-400' 
                              : hasCodeTab 
                                ? 'text-blue-300' 
                                : 'text-gray-400 group-hover/code:text-gray-200'
                          } transition-colors`}
                        />
                      </button>
                      
                      <button
                        className="ml-1 cursor-pointer project-menu-btn z-10 group/icon"
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
                          className="text-gray-400 opacity-0 group-hover:opacity-100 group/icon:hover:text-gray-100 transition-all"
                        />
                      </button>
                    </div>
                  );
                })}
                {projects.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500 italic ml-3">
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
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-1 top-0 bottom-0 w-px bg-gray-600"></div>
                
                {sortedLattices.map((lattice) => {
                  const isActive = activeLatticeId === lattice.documentId;
                  const isSelected = selectedLatticeIds.has(lattice.documentId);
                  const isRenaming = renamingId === lattice.documentId;
                  
                  return (
                    <div
                      key={lattice.documentId}
                      className={`group cursor-pointer select-none px-2 py-1 hover:bg-gray-700 flex items-center justify-between transition-colors
                        ${latticeContextMenu && latticeContextMenu.lattice.documentId === lattice.documentId ? "" : 
                          isActive ? "bg-neutral-600" : 
                          isSelected ? "bg-neutral-700" : "hover:bg-neutral-700"}`}
                      style={{
                        borderRadius: 0,
                        marginLeft: '-0.5rem',
                        marginRight: '-0.5rem',
                        width: 'calc(100% + 1rem)',
                      }}
                      onClick={(e) => handleLatticeClick(lattice, e)}
                      onContextMenu={(e) => handleLatticeContextMenu(e, lattice)}
                      onDoubleClick={() => openLattice(lattice)}
                    >
                      <CustomLucideIcon src={"/icons/lattice.svg"} size={16} className={`mr-2 flex-shrink-0 ml-3 ${isActive ? 'text-green-400' : isSelected ? 'text-green-300' : 'text-gray-400'}`} />
                      
                      <div className="flex items-center min-w-0 flex-1">
                        {isRenaming ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameSubmit('lattice')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleRenameSubmit('lattice');
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelRename();
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-900 text-white px-1 py-0 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500 w-full"
                          />
                        ) : (
                          <span className={`truncate flex-1 ${isActive ? 'font-medium' : ''}`}>{lattice.title}</span>
                        )}
                      </div>
                      
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
                          className="text-gray-400 opacity-0 group-hover:opacity-100 group/icon:hover:text-gray-100 transition-all"
                        />
                      </button>
                    </div>
                  );
                })}
                {lattices.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500 italic ml-3">
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
            onClose={() => {
              setProjectContextMenu(null);
              clearAllSelections();
            }}
            entries={
              selectedProjectIds.size > 1
                ? [
                    // Multi-selection entries
                    {
                      label: `Remove ${selectedProjectIds.size} Projects`,
                      onClick: () => {
                        if (window.confirm(`Are you sure you want to delete ${selectedProjectIds.size} projects? This cannot be undone.`)) {
                          selectedProjectIds.forEach(id => {
                            const project = projects.find(p => p.documentId === id);
                            if (project) {
                              deleteProject(project.documentId);
                              closeProject(project.documentId);
                            }
                          });
                        }
                        setProjectContextMenu(null);
                        clearAllSelections();
                      },
                      danger: true,
                    },
                  ]
                : [
                    // Single-selection entries
                    {
                      label: "Open",
                      onClick: () => {
                        openProject(projectContextMenu.project);
                        setProjectContextMenu(null);
                        clearAllSelections();
                      },
                    },
                    {
                      label: "Remove",
                      onClick: () => {
                        handleDeleteProject(projectContextMenu.project);
                        setProjectContextMenu(null);
                        clearAllSelections();
                      },
                      danger: true,
                    },
                    {
                      label: "Rename",
                      onClick: () => startRename(projectContextMenu.project.documentId, projectContextMenu.project.title, 'project'),
                    },
                  ]
            }
          />
        )}

        {latticeContextMenu && (
          <ContextMenu
            x={latticeContextMenu.x}
            y={latticeContextMenu.y}
            onClose={() => {
              setLatticeContextMenu(null);
              clearAllSelections();
            }}
            entries={
              selectedLatticeIds.size > 1
                ? [
                    // Multi-selection entries
                    {
                      label: `Remove ${selectedLatticeIds.size} Lattices`,
                      onClick: () => {
                        if (window.confirm(`Are you sure you want to delete ${selectedLatticeIds.size} lattices? This cannot be undone.`)) {
                          selectedLatticeIds.forEach(id => {
                            const lattice = lattices.find(l => l.documentId === id);
                            if (lattice) {
                              deleteLattice(lattice.documentId);
                              closeLattice(lattice.documentId);
                            }
                          });
                        }
                        setLatticeContextMenu(null);
                        clearAllSelections();
                      },
                      danger: true,
                    },
                  ]
                : [
                    // Single-selection entries
                    {
                      label: "Open",
                      onClick: () => {
                        openLattice(latticeContextMenu.lattice);
                        setLatticeContextMenu(null);
                        clearAllSelections();
                      },
                    },
                    {
                      label: "Remove",
                      onClick: () => {
                        handleDeleteLattice(latticeContextMenu.lattice);
                        setLatticeContextMenu(null);
                        clearAllSelections();
                      },
                      danger: true,
                    },
                    {
                      label: "Rename",
                      onClick: () => startRename(latticeContextMenu.lattice.documentId, latticeContextMenu.lattice.title, 'lattice'),
                    },
                  ]
            }
          />
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
      />
    </div>
  );
}
