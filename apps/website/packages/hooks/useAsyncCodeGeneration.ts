import { useState, useEffect, useMemo } from 'react';
import { asyncCodeGenerator, CodeSection, SectionGenerationStatus } from '../codeAssembly/asyncCodeGeneration';

/**
 * Hook to track async code generation status for UI components
 */
export function useAsyncCodeGeneration() {
  const [sectionStatuses, setSectionStatuses] = useState<Map<CodeSection, SectionGenerationStatus>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Initialize with current status
    const allStatuses = asyncCodeGenerator.getAllSectionStatus();
    const statusMap = new Map(allStatuses.map(status => [status.section, status]));
    setSectionStatuses(statusMap);
    setIsGenerating(asyncCodeGenerator.isAnyGenerating());

    // Subscribe to status updates
    const unsubscribe = asyncCodeGenerator.onStatusUpdate((status) => {
      setSectionStatuses(prev => new Map(prev.set(status.section, status)));
      setIsGenerating(asyncCodeGenerator.isAnyGenerating());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Derived state
  const sectionStatusArray = useMemo(() => 
    Array.from(sectionStatuses.values()), 
    [sectionStatuses]
  );

  const generateCode = useMemo(() => ({
    // Generate dirty sections
    generateDirty: (project?: any) => asyncCodeGenerator.generateDirtySections(project),
    
    // Generate all sections
    generateAll: (project?: any) => asyncCodeGenerator.generateAllSections(project),
    
    // Abort generation
    abort: () => asyncCodeGenerator.abort(),
  }), []);

  const getters = useMemo(() => ({
    // Get status of specific section
    getSectionStatus: (section: CodeSection) => sectionStatuses.get(section) || { section, status: 'pending' as const },
    
    // Check if section is generating
    isSectionGenerating: (section: CodeSection) => {
      const status = sectionStatuses.get(section);
      return status?.status === 'generating';
    },
    
    // Check if section is complete
    isSectionComplete: (section: CodeSection) => {
      const status = sectionStatuses.get(section);
      return status?.status === 'complete';
    },
    
    // Check if section has error
    hasSectionError: (section: CodeSection) => {
      const status = sectionStatuses.get(section);
      return status?.status === 'error';
    },
    
    // Get section error message
    getSectionError: (section: CodeSection) => {
      const status = sectionStatuses.get(section);
      return status?.status === 'error' ? status.error : undefined;
    },
    
    // Get generation duration for completed sections
    getSectionDuration: (section: CodeSection) => {
      const status = sectionStatuses.get(section);
      if (status?.startTime && status?.endTime) {
        return status.endTime.getTime() - status.startTime.getTime();
      }
      return undefined;
    },
  }), [sectionStatuses]);

  const stats = useMemo(() => {
    const statuses = sectionStatusArray;
    return {
      total: statuses.length,
      pending: statuses.filter(s => s.status === 'pending').length,
      generating: statuses.filter(s => s.status === 'generating').length,
      complete: statuses.filter(s => s.status === 'complete').length,
      error: statuses.filter(s => s.status === 'error').length,
    };
  }, [sectionStatusArray]);

  return {
    // Status tracking
    sectionStatuses: sectionStatusArray,
    isGenerating,
    stats,
    
    // Actions
    generateCode,
    
    // Getters
    ...getters,
  };
}
