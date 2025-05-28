import { useCanvasStore } from '../providers/CanvasStore';
import { useCodeAssemblyStore } from '../providers/CodeAssemblyStore';
import { convertCanvasToMeepCode } from './codeAssemblyConversion2D';

/**
 * Create a circle geometry on the canvas
 */
export function createCircleGeometry(x: number, y: number, radius: number = 1) {
  const canvasStore = useCanvasStore.getState();
  
  const circle = {
    id: `circle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'cylinder' as const,
    kind: 'cylinder' as const, // Add kind field for proper type detection
    pos: { x, y },
    orientation: 0,
    radius,
    material: 'mp.Medium(epsilon=12)',
    fill: '#b6a6ca',
    stroke: '#8b7aa1',
    strokeWidth: 1,
    draggable: true
  };
  
  canvasStore.addGeometry(circle);
  
  // Trigger code regeneration
  convertCanvasToMeepCode();
}

/**
 * Create a rectangle geometry on the canvas
 */
export function createRectangleGeometry(x: number, y: number, width: number = 2, height: number = 1) {
  const canvasStore = useCanvasStore.getState();
  
  const rectangle = {
    id: `rect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'rectangle' as const,
    kind: 'rectangle' as const, // Add kind field for proper type detection
    pos: { x, y },
    orientation: 0,
    width,
    height,
    material: 'mp.Medium(epsilon=12)',
    fill: '#c7bca1',
    stroke: '#9d9481',
    strokeWidth: 1,
    draggable: true
  };
  
  canvasStore.addGeometry(rectangle);
  
  // Trigger code regeneration
  convertCanvasToMeepCode();
}

/**
 * Create a triangle geometry on the canvas
 */
export function createTriangleGeometry(x: number, y: number, size: number = 1) {
  const canvasStore = useCanvasStore.getState();
  
  // Create equilateral triangle vertices
  const height = size * Math.sqrt(3) / 2;
  const vertices = [
    { x: x, y: y - height * 2/3 },           // Top vertex
    { x: x - size/2, y: y + height * 1/3 }, // Bottom left
    { x: x + size/2, y: y + height * 1/3 }  // Bottom right
  ];
  
  const triangle = {
    id: `triangle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'triangle' as const,
    kind: 'triangle' as const, // Add kind field for proper type detection
    pos: { x, y },
    orientation: 0,
    vertices,
    material: 'mp.Medium(epsilon=12)',
    fill: '#b1cfc1',
    stroke: '#8dab9d',
    strokeWidth: 1,
    draggable: true
  };
  
  canvasStore.addGeometry(triangle);
  
  // Trigger code regeneration
  convertCanvasToMeepCode();
}

/**
 * Update geometry material
 */
export function updateGeometryMaterial(geometryId: string, material: string) {
  const canvasStore = useCanvasStore.getState();
  
  canvasStore.updateGeometry(geometryId, { material });
  
  // Trigger code regeneration
  convertCanvasToMeepCode();
}

/**
 * Batch update geometries
 */
export function batchUpdateGeometries(updates: Array<{ id: string; changes: any }>) {
  const canvasStore = useCanvasStore.getState();
  
  updates.forEach(({ id, changes }) => {
    canvasStore.updateGeometry(id, changes);
  });
  
  // Trigger code regeneration
  convertCanvasToMeepCode();
}

/**
 * Initialize code assembly for a new project
 */
export function initializeCodeAssembly(projectScene: any) {
  const codeStore = useCodeAssemblyStore.getState();
  
  // Set simulation parameters from project scene
  codeStore.setSimulationParams({
    cellSize: {
      x: projectScene?.rectWidth || 16,
      y: projectScene?.rectHeight || 8,
      z: 0
    },
    resolution: projectScene?.resolution || 10,
    pmlThickness: projectScene?.pmlThickness || 1.0
  });
  
  // Clear any existing errors
  codeStore.clearAllErrors();
  
  // Trigger initial code generation
  convertCanvasToMeepCode();
}

/**
 * Export the current code to a Python file
 */
export function exportToPythonFile(filename: string) {
  const codeStore = useCodeAssemblyStore.getState();
  const code = codeStore.getAssembledCode();
  
  // Create a blob and download
  const blob = new Blob([code], { type: 'text/x-python' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.py') ? filename : `${filename}.py`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
