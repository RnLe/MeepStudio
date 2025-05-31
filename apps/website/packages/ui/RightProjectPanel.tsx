import React from "react";
import { Code2, Layers, Download } from "lucide-react";
import { MeepProject, LengthUnit } from "../types/meepProjectTypes";
import { projectSettings } from "../types/editorSettings";
import ObjectsList from "./ObjectList";
import ObjectPropertiesPanel from "./ObjectPropertiesPanels";
import { useMeepProjects } from "../hooks/useMeepProjects";
import { useCanvasStore } from "../providers/CanvasStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEditorStateStore } from "../providers/EditorStateStore";
import { MaterialSelectionMenu } from "./MaterialSelectionMenu";
import { MaterialCatalog } from "../constants/meepMaterialPresets";
import { useMaterialColorStore } from "../providers/MaterialColorStore";
import { SIMULATION_DEFAULTS } from "../constants/meepSimulationDefaults";

interface Props {
  project: MeepProject;
  ghPages: boolean;
  onCancel?: () => void;
}

const RightProjectPanel: React.FC<Props> = ({ project, ghPages, onCancel }) => {
  const { 
    deleteProject,
    addCodeTabToProject,
    removeCodeTabFromProject,
    getTabsForProject,
    getActiveTab,
    isEditingProject: editing,
    setIsEditingProject: setEditing
  } = useEditorStateStore();
  
  const activeTab = getActiveTab();
  const projectTabs = getTabsForProject(project.documentId);
  // Treat the canvas sub-tab like the scene tab
  const activeTabType =
    activeTab?.type === "canvas"
      ? "scene"
      : activeTab?.type || "scene";

  const [editValues, setEditValues] = React.useState({
    title: project?.title || "",
    rectWidth: project?.scene?.rectWidth || projectSettings.rectWidth.default,
    rectHeight: project?.scene?.rectHeight || projectSettings.rectHeight.default,
    resolution: project?.scene?.resolution || projectSettings.resolution.default,
    a: project?.scene?.a || 1.0,
    unit: project?.scene?.unit || LengthUnit.NM,
    material: project?.scene?.material || SIMULATION_DEFAULTS.scene.material,
  });
  
  // Material selection state
  const [showMaterialMenu, setShowMaterialMenu] = React.useState(false);
  const materialButtonRef = React.useRef<HTMLDivElement>(null);
  const { getMaterialColor } = useMaterialColorStore();
  const setSceneMaterial = useCanvasStore((s) => s.setSceneMaterial);

  const { updateProject } = useMeepProjects({ ghPages });
  const setGeometries = useCanvasStore((s) => s.setGeometries);
  const setSources = useCanvasStore((s) => s.setSources);
  const setBoundaries = useCanvasStore((s) => s.setBoundaries);
  const qc = useQueryClient();

  React.useEffect(() => {
    setEditValues({
      title: project?.title || "",
      rectWidth: project?.scene?.rectWidth || projectSettings.rectWidth.default,
      rectHeight: project?.scene?.rectHeight || projectSettings.rectHeight.default,
      resolution: project?.scene?.resolution || projectSettings.resolution.default,
      a: project?.scene?.a || 1.0,
      unit: project?.scene?.unit || LengthUnit.NM,
      material: project?.scene?.material || SIMULATION_DEFAULTS.scene.material,
    });
    if (project?.scene?.geometries) setGeometries(project.scene.geometries);
    if (project?.scene?.sources) setSources(project.scene.sources);
    if (project?.scene?.boundaries) setBoundaries(project.scene.boundaries);
    if (project?.scene?.material) setSceneMaterial(project.scene.material);
  }, [project, setGeometries, setSources, setBoundaries, setSceneMaterial]);

  const handleCancel = () => {
    setEditing(false);
    setEditValues({
      title: project?.title || "",
      rectWidth: project?.scene?.rectWidth || projectSettings.rectWidth.default,
      rectHeight: project?.scene?.rectHeight || projectSettings.rectHeight.default,
      resolution: project?.scene?.resolution || projectSettings.resolution.default,
      a: project?.scene?.a || 1.0,
      unit: project?.scene?.unit || LengthUnit.NM,
      material: project?.scene?.material || SIMULATION_DEFAULTS.scene.material,
    });
    onCancel?.();
  };

  const refreshProjectInStore = React.useCallback((updatedProject: MeepProject) => {
    setGeometries(updatedProject.scene?.geometries || []);
    setSources(updatedProject.scene?.sources || []);
    setBoundaries(updatedProject.scene?.boundaries || []);
    setSceneMaterial(updatedProject.scene?.material || SIMULATION_DEFAULTS.scene.material);
  }, [setGeometries, setSources, setBoundaries, setSceneMaterial]);

  const handleSave = async () => {
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
          a: editValues.a,
          unit: editValues.unit,
          material: editValues.material,
        },
      };
      await updateProject({
        documentId: project.documentId,
        project: updated,
      });
      qc.invalidateQueries({ queryKey: ["meepProjects"] });
      refreshProjectInStore(updated);
    }
  };

  // Listen for save event from sidebar
  React.useEffect(() => {
    const handleSaveEvent = () => {
      if (editing) {
        handleSave();
      }
    };
    
    window.addEventListener('rightSidebarSave', handleSaveEvent);
    return () => window.removeEventListener('rightSidebarSave', handleSaveEvent);
  }, [editing, editValues, project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ 
      ...prev, 
      [name]: name === 'title' ? value : name === 'a' ? (value === '' ? '' : Number(value)) : value === '' ? '' : Number(value) 
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };

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

  // Define action buttons
  const actionButtons = [
    {
      label: "Code Editor",
      icon: Code2,
      onClick: () => {
        addCodeTabToProject(project.documentId);
      }
    },
    {
      label: "Add to Scene",
      icon: Layers,
      onClick: () => {
        // TODO: Implement add to scene functionality
      }
    },
    {
      label: "Export",
      icon: Download,
      onClick: () => {
        // TODO: Implement export functionality
      }
    }
  ];

  // Unit tooltips mapping
  const unitTooltips: Record<LengthUnit, string> = {
    [LengthUnit.AM]: "Attometers",
    [LengthUnit.FM]: "Femtometers",
    [LengthUnit.PM]: "Picometers",
    [LengthUnit.NM]: "Nanometers",
    [LengthUnit.UM]: "Micrometers",
    [LengthUnit.MM]: "Millimeters",
    [LengthUnit.CM]: "Centimeters",
    [LengthUnit.M]: "Meters",
    [LengthUnit.KM]: "Kilometers",
  };

  const handleMaterialSelect = (materialKey: string) => {
    setEditValues((prev) => ({ ...prev, material: materialKey }));
    setSceneMaterial(materialKey);
  };

  // Get current material info
  const currentMaterial = MaterialCatalog[editValues.material as keyof typeof MaterialCatalog] || MaterialCatalog["Air"];
  const materialColor = getMaterialColor(editValues.material, currentMaterial?.color);
  const materialDisplayName = currentMaterial?.name || editValues.material;

  return (
    <div className="p-4 overflow-y-auto flex-1">
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
        .characteristic-input {
          width: 3rem !important;
        }
        .unit-select {
          padding: 0 2px;
        }
      `}</style>
      
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

        {/* Only show project properties for scene tab */}
        {activeTabType === "scene" && (
          <>
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
                    />
                  </span>
                ) : (
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
                  />
                ) : (
                  <span className="flex-1 text-xs text-gray-300 text-right">{project.scene?.resolution}</span>
                )}
              </div>
              <div className="flex flex-row w-full items-center justify-between">
                <span className="w-32 text-xs text-gray-400 font-medium text-left" title="Characteristic Length">Characteristic Length</span>
                {editing ? (
                  <span className="flex gap-1 items-center">
                    <input
                      type="number"
                      name="a"
                      min={0.001}
                      step={0.1}
                      value={editValues.a}
                      onChange={handleChange}
                      onWheel={handleNumberWheel}
                      className="characteristic-input text-xs text-right bg-neutral-700 rounded focus:bg-neutral-600 outline-none appearance-none border-none p-0 m-0 no-spinner"
                    />
                    <select
                      name="unit"
                      value={editValues.unit}
                      onChange={handleSelectChange}
                      className="unit-select text-xs bg-neutral-700 rounded focus:bg-neutral-600 outline-none appearance-none border-none"
                    >
                      {Object.entries(LengthUnit).map(([key, value]) => (
                        <option key={key} value={value} title={unitTooltips[value as LengthUnit]}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </span>
                ) : (
                  <span className="flex-1 text-xs text-gray-300 text-right">{project.scene?.a} {project.scene?.unit}</span>
                )}
              </div>

              {/* Background Material */}
              <div className="flex flex-row w-full items-center justify-between">
                <span className="w-32 text-xs text-gray-400 font-medium text-left">Background Material</span>
                {editing ? (
                  <div 
                    ref={materialButtonRef}
                    className="flex items-center gap-2 cursor-pointer hover:bg-neutral-700 rounded px-2 py-1 transition-colors"
                    onClick={() => setShowMaterialMenu(true)}
                  >
                    <div 
                      className="w-3 h-3 rounded border border-neutral-600"
                      style={{ backgroundColor: materialColor }}
                    />
                    <span className="text-xs text-gray-300">{materialDisplayName}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded border border-neutral-600"
                      style={{ backgroundColor: materialColor }}
                    />
                    <span className="flex-1 text-xs text-gray-300 text-right">{materialDisplayName}</span>
                  </div>
                )}
              </div>
            </div>

            {project.description && (
              <p className="text-sm text-gray-400 text-center">{project.description}</p>
            )}
          </>
        )}

        <hr className="border-gray-700 my-4" />

        {/* Tab-specific content */}
        {activeTabType === "scene" && (
          <>
            <ObjectsList project={project} />
            <hr className="border-gray-700" />
            <ObjectPropertiesPanel 
              project={project} 
              ghPages={ghPages}
              projectA={project?.scene?.a || 1}
              projectUnit={project?.scene?.unit || LengthUnit.NM}
            />
            
            {/* Actions */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {actionButtons.map((action, index) => {
                  const Icon = action.icon;
                  const isLastAndOdd = index === actionButtons.length - 1 && actionButtons.length % 2 === 1;
                  return (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={`flex flex-col items-center justify-center p-3 rounded bg-neutral-700/30 hover:bg-neutral-700/50 transition-colors group cursor-pointer ${
                        isLastAndOdd ? 'col-span-2' : ''
                      }`}
                    >
                      <Icon 
                        size={20} 
                        className="text-gray-400 group-hover:text-gray-200 transition-colors mb-1"
                      />
                      <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors text-center">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
        
        {activeTabType === "code" && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300">Code Editor Settings</h3>
            <div className="text-gray-400 text-sm">
              <div className="flex justify-between">
                <span>Language:</span>
                <span className="text-gray-300">Python</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Theme:</span>
                <span className="text-gray-300">Dark</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Auto-save:</span>
                <span className="text-green-400">Enabled</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Material Selection Menu */}
      <MaterialSelectionMenu
        isOpen={showMaterialMenu}
        onClose={() => setShowMaterialMenu(false)}
        onSelect={handleMaterialSelect}
        currentMaterial={editValues.material}
        anchorEl={materialButtonRef.current}
      />
    </div>
  );
};

export default RightProjectPanel;
