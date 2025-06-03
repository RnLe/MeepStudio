import { useCanvasStore } from '../../providers/CanvasStore';
import { useMaterialColorStore } from '../../providers/MaterialColorStore';
import { MaterialCatalog } from '../../constants/meepMaterialPresets';

export function useCanvasColors() {
  const { showXRayMode, getElementColorVisibility, getElementXRayTransparency } = useCanvasStore();
  const { getMaterialColor } = useMaterialColorStore();

  const getFillColor = (element: any): string => {
    const showColors = getElementColorVisibility('geometries');
    const transparency = getElementXRayTransparency('geometries');
    
    if (!showColors) {
      return showXRayMode ? `rgba(0, 0, 0, ${transparency})` : "rgba(0, 0, 0, 1)";
    }
    
    const materialKey = element.material;
    if (!materialKey) {
      return showXRayMode ? `rgba(128, 128, 128, ${transparency})` : "rgba(128, 128, 128, 1)";
    }
    
    const customColor = getMaterialColor(materialKey);
    const color = customColor || MaterialCatalog[materialKey as keyof typeof MaterialCatalog]?.color;
    
    if (color) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const opacity = showXRayMode ? transparency : 1;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return showXRayMode ? `rgba(128, 128, 128, ${transparency})` : "rgba(128, 128, 128, 1)";
  };

  const getStrokeColor = (element: any, isSelected: boolean): string => {
    if (!isSelected) return "transparent";
    
    const fillColor = getFillColor(element);
    return getSelectionBorderColor(fillColor);
  };

  const getStrokeWidth = (isSelected: boolean, scale: number): number => {
    return isSelected ? 2 / scale : 0;
  };

  return { getFillColor, getStrokeColor, getStrokeWidth };
}

export function getSelectionBorderColor(fillColor: string): string {
  // Smart selection color based on fill
  return "#50a2ff";
}

export function getSelectionStrokeWidth(scale: number, isSelected: boolean): number {
  return isSelected ? 2 / scale : 0;
}
