// src/components/layout/RightSidebar.tsx
import React from "react";
import { Pen, X, Code, Grid3X3, Plus } from "lucide-react";
import { MeepProject } from "../types/meepProjectTypes";
import { projectSettings } from "../types/editorSettings";
import ContextMenu from "./ContextMenu";
import ObjectsList from "./ObjectList";
import ObjectPropertiesPanel from "./ObjectPropertiesPanels";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useCanvasStore } from "../providers/CanvasStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEditorStateStore } from "../providers/EditorStateStore";

interface Props {
  onClose?: () => void;
}

const RightSidebar: React.FC<Props> = ({ onClose }) => {
  const { 
    ghPages, 
    getActiveProject, 
    deleteProject,
    addCodeTabToProject,
    addLatticeTabToProject,
    removeCodeTabFromProject,
    removeLatticeTabFromProject,
    getActiveProjectSubTabs
  } = useEditorStateStore();
  const project = getActiveProject();

  const [editing, setEditing] = React.useState(false);  const [editValues, setEditValues] = React.useState({
    title: project?.title || "",
    rectWidth: project?.scene?.rectWidth || projectSettings.rectWidth.default,
    rectHeight: project?.scene?.rectHeight || projectSettings.rectHeight.default,
    resolution: project?.scene?.resolution || projectSettings.resolution.default,
  });

  // --- Add hooks for project update and canvas store ---
  const { updateProject } = useMeepProjects({ ghPages });
  const setGeometries = useCanvasStore((s) => s.setGeometries);
  const setActiveProject = useCanvasStore((s) => s.setActiveProject);
  const qc = useQueryClient();
  const setGridSize = React.useCallback((width: number, height: number) => {
    // Optionally, you could add a setGridSize action to CanvasStore for more explicitness
    // For now, just update the project and let ProjectCanvas pick up changes
  }, []);
  const setResolution = React.useCallback((res: number) => {
    // Optionally, you could add a setResolution action to CanvasStore
  }, []);
  React.useEffect(() => {
    setEditValues({
      title: project?.title || "",
      rectWidth: project?.scene?.rectWidth || projectSettings.rectWidth.default,
      rectHeight: project?.scene?.rectHeight || projectSettings.rectHeight.default,
      resolution: project?.scene?.resolution || projectSettings.resolution.default,
    });
    if (project?.documentId) setActiveProject(project.documentId);
    if (project?.scene?.geometries) setGeometries(project.scene.geometries);
  }, [project, setActiveProject, setGeometries]);

  const handleEditClick = () => setEditing(true);  const handleCancel = () => {
    setEditing(false);
    setEditValues({
      title: project?.title || "",
      rectWidth: project?.scene?.rectWidth || projectSettings.rectWidth.default,
      rectHeight: project?.scene?.rectHeight || projectSettings.rectHeight.default,
      resolution: project?.scene?.resolution || projectSettings.resolution.default,
    });
  };  const refreshProjectInStore = React.useCallback((updatedProject: MeepProject) => {
    // Update the canvas store with the new project properties
    setActiveProject(updatedProject.documentId);
    setGeometries(updatedProject.scene?.geometries || []);
  }, [setActiveProject, setGeometries]);  const handleSave = async () => {
    setEditing(false);
    if (project) {
      const updated = {
        ...project,
        title: editValues.title,
        scene: {
          ...project.scene,
          rectWidth: editValues.rectWidth,
          rectHeight: editValues.rectHeight,
          resolution: editValues.resolution,
        },
      };
      await updateProject({
        documentId: project.documentId,
        project: updated,
      });
      // Invalidate React Query cache so parent re-fetches and updates project prop
      qc.invalidateQueries({ queryKey: ["meepProjects"] });
      // Immediately update zustand store for real-time UI update
      refreshProjectInStore(updated);
      // Optionally, update local state for immediate feedback
      setEditValues({
        title: updated.title,
        rectWidth: updated.scene.rectWidth,
        rectHeight: updated.scene.rectHeight,
        resolution: updated.scene.resolution,
      });
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: name === 'title' ? value : value === '' ? '' : Number(value) }));
  };

  const handleDelete = async () => {
    if (project && deleteProject) {
      if (window.confirm(`Are you sure you want to delete the project "${project.title}"? This cannot be undone.`)) {
        await deleteProject(project.documentId);
      }
    }
  };

  // Custom wheel handler for number inputs
  const handleNumberWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const name = input.name;
    const step = Number(input.step) || 1;
    const min = input.min !== '' ? Number(input.min) : -Infinity;
    const max = input.max !== '' ? Number(input.max) : Infinity;
    let value = Number(input.value);
    if (isNaN(value)) value = 0;
    e.preventDefault();
    let newValue = value;
    if (e.deltaY < 0) {
      newValue = Math.min(max, value + step);
    } else if (e.deltaY > 0) {
      newValue = Math.max(min, value - step);
    }
    setEditValues((prev) => ({ ...prev, [name]: newValue }));
  };

  return (
    <div
      className="flex-shrink-0 w-80 bg-neutral-800 border-l border-gray-700 p-0 space-y-4"
    >
      {/* Top navbar-like container, not affected by parent padding */}
      <div className="flex items-center h-10 bg-gray-800 border-b border-gray-700 justify-between sticky top-0 z-10" style={{ margin: 0, padding: 0 }}>
        <span className="font-semibold text-white pl-2">Project Properties</span>
        {editing ? (
          <div className="flex gap-2 mr-2">
            <button className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleSave}>Save</button>
            <button className="text-xs px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-700" onClick={handleCancel}>Cancel</button>
          </div>
        ) : (
          <div className="flex gap-1 mr-2">
            <button className="p-1 rounded hover:bg-gray-700" onClick={handleEditClick} aria-label="Edit project properties">
              <Pen size={18} className="text-gray-400 hover:text-white" />
            </button>
            <button className="p-1 rounded hover:bg-gray-700" onClick={onClose}>
              <X size={18} className="text-gray-400 hover:text-white" />
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        <style>{`
          input.no-spinner::-webkit-outer-spin-button,
          input.no-spinner::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
            display: none;
          }
          input.no-spinner[type=number] {
            -moz-appearance: textfield;
            appearance: textfield;
            height: 16px !important;
            line-height: 16px !important;
            width: 2.2rem !important;
            text-align: center;
          }
        `}</style>
        {project ? (
          <div className="space-y-3">
            <div className="flex justify-center items-center">
              {editing ? (
                <input
                  className="not-prose text-xl font-semibold text-white text-center rounded px-1 py-0.5 focus:bg-neutral-600 bg-neutral-700 transition-colors outline-none"
                  name="title"
                  value={editValues.title}
                  minLength={1}
                  maxLength={128}
                  required
                  onChange={handleChange}
                  style={{ minWidth: 0, width: '100%' }}
                />
              ) : (
                <h2 className="not-prose text-xl font-semibold text-white text-center w-full">{project.title}</h2>
              )}
            </div>
            {/* Table-like project properties */}
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex flex-row w-full items-center justify-between">
                <span className="w-28 text-xs text-gray-400 font-medium text-left">Grid Size</span>
                {editing ? (
                  <span className="flex gap-1 items-center">
                    <input
                      type="number"
                      name="rectWidth"
                      min={projectSettings.rectWidth.min}
                      max={projectSettings.rectWidth.max}
                      step={projectSettings.rectWidth.step}
                      value={editValues.rectWidth}
                      onChange={handleChange}
                      onWheel={handleNumberWheel}
                      className="w-10 text-xs text-right bg-neutral-700 rounded focus:bg-neutral-600 outline-none appearance-none border-none p-0 m-0 no-spinner"
                      style={{ MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'textfield', height: '16px', lineHeight: '16px' }}                      onBlur={() => {
                        if (project && editValues.rectWidth !== project.scene?.rectWidth) {
                          const updated = { 
                            ...project, 
                            scene: { 
                              ...project.scene, 
                              rectWidth: editValues.rectWidth 
                            } 
                          };
                          updateProject({
                            documentId: project.documentId,
                            project: updated,
                          });
                          refreshProjectInStore(updated);
                        }
                      }}
                    />
                    <span className="mx-0.5 text-gray-500">×</span>
                    <input
                      type="number"
                      name="rectHeight"
                      min={projectSettings.rectHeight.min}
                      max={projectSettings.rectHeight.max}
                      step={projectSettings.rectHeight.step}
                      value={editValues.rectHeight}
                      onChange={handleChange}
                      onWheel={handleNumberWheel}
                      className="w-10 text-xs text-right bg-neutral-700 rounded focus:bg-neutral-600 outline-none appearance-none border-none p-0 m-0 no-spinner"
                      style={{ MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'textfield', height: '16px', lineHeight: '16px' }}                      onBlur={() => {
                        if (project && editValues.rectHeight !== project.scene?.rectHeight) {
                          const updated = { 
                            ...project, 
                            scene: { 
                              ...project.scene, 
                              rectHeight: editValues.rectHeight 
                            } 
                          };
                          updateProject({
                            documentId: project.documentId,
                            project: updated,
                          });
                          refreshProjectInStore(updated);
                        }
                      }}
                    />
                  </span>                ) : (
                  <span className="flex gap-1 items-center text-xs text-gray-300 text-right">
                    {project.scene?.rectWidth} <span className="mx-0.5 text-gray-500">×</span> {project.scene?.rectHeight}
                  </span>
                )}
              </div>
              <div className="flex flex-row w-full items-center justify-between">
                <span className="w-28 text-xs text-gray-400 font-medium text-left">Resolution</span>
                {editing ? (
                  <input
                    type="number"
                    name="resolution"
                    min={projectSettings.resolution.min}
                    max={projectSettings.resolution.max}
                    step={projectSettings.resolution.step}
                    value={editValues.resolution}
                    onChange={handleChange}
                    onWheel={handleNumberWheel}
                    className="w-10 text-xs text-right bg-neutral-700 rounded focus:bg-neutral-600 outline-none appearance-none border-none p-0 m-0 no-spinner"
                    style={{ MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'textfield', height: '16px', lineHeight: '16px' }}                    onBlur={() => {
                      if (project && editValues.resolution !== project.scene?.resolution) {
                        const updated = { 
                          ...project, 
                          scene: { 
                            ...project.scene, 
                            resolution: editValues.resolution 
                          } 
                        };
                        updateProject({
                          documentId: project.documentId,
                          project: updated,
                        });
                        refreshProjectInStore(updated);
                      }
                    }}
                  />                ) : (
                  <span className="flex-1 text-xs text-gray-300 text-right">{project.scene?.resolution}</span>
                )}
              </div>
              {/* More properties can be added here in the same style */}
            </div>            {project.description && (
              <p className="text-sm text-gray-400 text-center">{project.description}</p>
            )}
            
            {/* Tab Management Section */}
            <div className="mt-4 pt-3 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Project Tabs</h3>
              <div className="space-y-2">
                {/* Code Tab Management */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Code size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-300">Code Editor</span>
                  </div>
                  {getActiveProjectSubTabs().some(tab => tab.type === "code") ? (
                    <button
                      onClick={() => removeCodeTabFromProject(project.documentId)}
                      className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => addCodeTabToProject(project.documentId)}
                      className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
                
                {/* Lattice Tab Management */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Grid3X3 size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-300">Lattice Builder</span>
                  </div>
                  {getActiveProjectSubTabs().some(tab => tab.type === "lattice") ? (
                    <button
                      onClick={() => removeLatticeTabFromProject(project.documentId)}
                      className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => addLatticeTabToProject(project.documentId)}
                      className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No project selected</p>
        )}
        <hr className="border-gray-700 my-4" />
        {project && <ObjectsList project={project} />}
        <hr className="border-gray-700" />
        {project && <ObjectPropertiesPanel project={project} ghPages={ghPages} />}
      </div>
    </div>
  );
};

export default RightSidebar;
