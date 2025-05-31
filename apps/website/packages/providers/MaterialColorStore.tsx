import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MaterialCatalog } from 'packages/constants/meepMaterialPresets';

interface MaterialColorState {
  customColors: Record<string, string>;
  customFontColors: Record<string, string>;
  setMaterialColor: (materialKey: string, color: string) => void;
  getMaterialColor: (materialKey: string, defaultColor?: string) => string | undefined;
  setMaterialFontColor: (materialKey: string, color: string) => void;
  getMaterialFontColor: (materialKey: string, defaultColor?: string) => string | undefined;
  resetMaterialColor: (materialKey: string) => void;
  resetAllColors: () => void;
}

export const useMaterialColorStore = create<MaterialColorState>()(
  persist(
    (set, get) => ({
      customColors: {},
      customFontColors: {},
      
      setMaterialColor: (materialKey: string, color: string) => {
        set((state) => ({
          customColors: {
            ...state.customColors,
            [materialKey]: color
          }
        }));
      },
      
      getMaterialColor: (materialKey?: string, defaultColor?: string) => {
        if (!materialKey) return defaultColor;
        
        const customColor = get().customColors[materialKey];
        if (customColor) return customColor;
        
        // Try to get from catalog if no custom color
        const material = MaterialCatalog[materialKey as keyof typeof MaterialCatalog];
        if (material?.color) return material.color;
        
        return defaultColor;
      },
      
      setMaterialFontColor: (materialKey: string, color: string) => {
        set((state) => ({
          customFontColors: {
            ...state.customFontColors,
            [materialKey]: color
          }
        }));
      },
      
      getMaterialFontColor: (materialKey: string, defaultColor?: string) => {
        const customColor = get().customFontColors[materialKey];
        return customColor || defaultColor;
      },
      
      resetMaterialColor: (materialKey: string) => {
        set((state) => {
          const newColors = { ...state.customColors };
          const newFontColors = { ...state.customFontColors };
          delete newColors[materialKey];
          delete newFontColors[materialKey];
          return { 
            customColors: newColors,
            customFontColors: newFontColors
          };
        });
      },
      
      resetAllColors: () => {
        set({ customColors: {}, customFontColors: {} });
      }
    }),
    {
      name: 'material-colors-storage',
    }
  )
);
