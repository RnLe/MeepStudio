import { useCanvasStore } from '../providers/CanvasStore';
import { useCodeAssemblyStore } from '../providers/CodeAssemblyStore';
import { generateInitializationCode } from './initialisationAssembly';
import { generateGeometryCode } from './geometryAssembly';
import { generateSourcesCode } from './sourcesAssembly';
import { generateBoundariesCode } from './boundariesAssembly';
import { generateMaterialsCode } from './materialAssembly';
import { generateRegionsCode } from './regionsAssembly';
import { generateLatticeCode } from './latticeAssembly';
import { generateSimulationCode } from './simulationAssembly';
import { MeepProject } from '../types/meepProjectTypes';
import { ConversionContext } from './codeAssemblyConversion2D';

export type CodeSection = 
  | 'initialization' 
  | 'materials' 
  | 'geometries' 
  | 'lattices' 
  | 'sources' 
  | 'boundaries' 
  | 'regions' 
  | 'simulation';

export interface SectionGenerationStatus {
  section: CodeSection;
  status: 'pending' | 'generating' | 'complete' | 'error';
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export type GenerationStatusCallback = (status: SectionGenerationStatus) => void;

/**
 * Async code generation orchestrator that generates sections one by one
 * and provides progress updates via callbacks
 */
export class AsyncCodeGenerator {
  private statusCallbacks: Set<GenerationStatusCallback> = new Set();
  private sectionStatus: Map<CodeSection, SectionGenerationStatus> = new Map();
  private isGenerating = false;
  private abortController: AbortController | null = null;

  constructor() {
    // Initialize all sections as pending
    this.resetStatus();
  }

  /**
   * Add a callback to receive status updates
   */
  onStatusUpdate(callback: GenerationStatusCallback) {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  /**
   * Get current status of a section
   */
  getSectionStatus(section: CodeSection): SectionGenerationStatus {
    return this.sectionStatus.get(section) || {
      section,
      status: 'pending'
    };
  }

  /**
   * Get status of all sections
   */
  getAllSectionStatus(): SectionGenerationStatus[] {
    return Array.from(this.sectionStatus.values());
  }

  /**
   * Check if any section is currently generating
   */
  isAnyGenerating(): boolean {
    return this.isGenerating;
  }

  /**
   * Reset all sections to pending status
   */
  private resetStatus() {
    const sections: CodeSection[] = [
      'initialization', 'materials', 'geometries', 'lattices',
      'sources', 'boundaries', 'regions', 'simulation'
    ];

    sections.forEach(section => {
      this.sectionStatus.set(section, {
        section,
        status: 'pending'
      });
    });
  }

  /**
   * Notify all callbacks of a status change
   */
  private notifyStatusUpdate(status: SectionGenerationStatus) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        // Handle callback errors silently
      }
    });
  }

  /**
   * Update section status and notify listeners
   */
  private updateSectionStatus(section: CodeSection, updates: Partial<SectionGenerationStatus>) {
    const currentStatus = this.sectionStatus.get(section);
    const newStatus: SectionGenerationStatus = {
      ...currentStatus!,
      ...updates
    };
    
    this.sectionStatus.set(section, newStatus);
    this.notifyStatusUpdate(newStatus);
  }

  /**
   * Generate code for dirty sections asynchronously (truly parallel)
   */
  async generateDirtySections(project?: MeepProject): Promise<void> {
    if (this.isGenerating) {
      return;
    }

    const canvasState = useCanvasStore.getState();
    const codeState = useCodeAssemblyStore.getState();

    // Check which sections are dirty
    const dirtySections = canvasState.getDirtySections();
    
    if (dirtySections.length === 0) {
      return;
    }

    this.isGenerating = true;
    this.abortController = new AbortController();
    
    // Update simulation parameters from project if provided
    if (project?.scene) {
      codeState.setSimulationParams({
        cellSize: { 
          x: project.scene.rectWidth, 
          y: project.scene.rectHeight, 
          z: 0 
        },
        resolution: project.scene.resolution,
        runtime: project.scene.runTime,
      });
    }

    const context: ConversionContext = {
      canvasState,
      codeState,
      project
    };

    // Set generating state in code store
    codeState.setIsGenerating(true);
    codeState.clearAllErrors();

    try {
      // Mark all dirty sections as generating immediately (for parallel UI updates)
      dirtySections.forEach(section => {
        this.updateSectionStatus(section, {
          status: 'generating',
          startTime: new Date()
        });
      });

      // Generate all dirty sections in parallel
      const generationPromises = dirtySections.map(async (section) => {
        try {
          // Check if generation was aborted
          if (this.abortController?.signal.aborted) {
            return { section, success: false, error: 'Aborted' };
          }

          // Generate code for this section
          const result = await this.generateSection(section, context);
          

          
          if (result.success) {
            // Mark as complete and clear dirty flag
            this.updateSectionStatus(section, {
              status: 'complete',
              endTime: new Date()
            });
            canvasState.clearCodeSectionDirty(section);
            return { section, success: true };
          } else {
            // Mark as error
            this.updateSectionStatus(section, {
              status: 'error',
              endTime: new Date(),
              error: result.error || 'Generation failed'
            });
            codeState.setError(section, result.error || 'Generation failed');
            return { section, success: false, error: result.error };
          }
        } catch (error) {
          // Handle generation error
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.updateSectionStatus(section, {
            status: 'error',
            endTime: new Date(),
            error: errorMessage
          });
          codeState.setError(section, errorMessage);
          return { section, success: false, error: errorMessage };
        }
      });

      // Wait for all sections to complete
      const results = await Promise.all(generationPromises);

      // Mark generation complete
      codeState.setLastGeneratedAt(new Date());

    } catch (error) {
      // Handle any unexpected errors
    } finally {
      this.isGenerating = false;
      this.abortController = null;
      codeState.setIsGenerating(false);
    }
  }

  /**
   * Generate code for a specific section
   */
  private async generateSection(section: CodeSection, context: ConversionContext): Promise<{ success: boolean; error?: string }> {
    switch (section) {
      case 'initialization':
        return await generateInitializationCode(context);
      
      case 'materials':
        return await generateMaterialsCode(context);
      
      case 'geometries':
        return await generateGeometryCode(context);
      
      case 'lattices':
        return await generateLatticeCode(context);
      
      case 'sources':
        return await generateSourcesCode(context);
      
      case 'boundaries':
        return await generateBoundariesCode(context);
      
      case 'regions':
        return await generateRegionsCode(context);
      
      case 'simulation':
        return await generateSimulationCode(context);
      
      default:
        return { success: false, error: `Unknown section: ${section}` };
    }
  }

  /**
   * Abort ongoing generation
   */
  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Force regenerate all sections (ignore dirty flags)
   */
  async generateAllSections(project?: MeepProject): Promise<void> {
    const canvasState = useCanvasStore.getState();
    
    // Mark all sections as dirty
    canvasState.markMultipleCodeSectionsDirty([
      'initialization', 'materials', 'geometries', 'lattices',
      'sources', 'boundaries', 'regions', 'simulation'
    ]);

    // Generate dirty sections
    await this.generateDirtySections(project);
  }
}

// Global instance for the async code generator
export const asyncCodeGenerator = new AsyncCodeGenerator();
