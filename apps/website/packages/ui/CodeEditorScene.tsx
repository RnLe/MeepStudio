"use client";
import React, { useRef, useEffect, useState } from "react";
import { Code, FileText, Play, Copy, Check } from "lucide-react";
import { MeepProject } from "../types/meepProjectTypes";
import { useEditorStateStore } from "../providers/EditorStateStore";
import { useCanvasStore } from "../providers/CanvasStore";

// Define the code block groups (from CanvasToolbar, excluding snapping and overlays)
const CODE_BLOCK_GROUPS = [
  { key: "geometries", label: "Geometries", color: "#b6a6ca" },
  { key: "materials", label: "Materials", color: "#c7bca1" },
  { key: "sources", label: "Sources", color: "#b1cfc1" },
  { key: "boundaries", label: "Boundaries", color: "#c9b1bd" },
  { key: "regions", label: "Regions", color: "#b1b8c9" },
] as const;

interface Props {
  project: MeepProject;
  ghPages: boolean;
}

export default function CodeEditor({ project, ghPages }: Props) {
  const codeData = project.code;
  
  // Get tab awareness from store
  const activeTab = useEditorStateStore((s) => s.getActiveTab());
  const activeProjectId = activeTab?.projectId;
  
  // Get geometry count from canvas store
  const geometries = useCanvasStore((s) => s.geometries);
  const geometryCount = geometries.length;
  
  // Copy state
  const [isCopied, setIsCopied] = useState(false);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  
  // Get counts for other object types (currently hardcoded to 0)
  const getObjectCount = (groupKey: string): number => {
    switch (groupKey) {
      case "geometries":
        return geometryCount;
      case "materials":
        return 0; // TODO: implement when materials are added
      case "sources":
        return 0; // TODO: implement when sources are added
      case "boundaries":
        return 0; // TODO: implement when boundaries are added
      case "regions":
        return 0; // TODO: implement when regions are added
      default:
        return 0;
    }
  };
  
  // Selected code block state
  const [selectedBlock, setSelectedBlock] = useState("initialization");
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  
  // Refs for scroll handling
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // All blocks in order
  const allBlocks = [
    { key: "initialization", label: "Initialization" },
    ...CODE_BLOCK_GROUPS.map(g => ({ key: g.key, label: g.label, color: g.color })),
    { key: "simulation-assembly", label: "Simulation Assembly" }
  ];
  
  // Convert project title to snake_case filename
  const getSnakeCaseFilename = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '_') + '.py';
  };
  
  // Handle scroll to detect active section
  useEffect(() => {
    const handleScroll = () => {
      if (!codeContainerRef.current) return;
      
      const scrollTop = codeContainerRef.current.scrollTop;
      const containerHeight = codeContainerRef.current.clientHeight;
      const threshold = containerHeight * 0.15; // 15% from top
      
      // Find which section is closest to the threshold
      let activeSection = "initialization";
      
      for (const block of allBlocks) {
        const ref = sectionRefs.current[block.key];
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const containerRect = codeContainerRef.current.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
          
          if (relativeTop <= threshold) {
            activeSection = block.key;
          }
        }
      }
      
      if (activeSection !== selectedBlock) {
        setSelectedBlock(activeSection);
      }
    };
    
    const container = codeContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [selectedBlock, allBlocks]);
  
  // Handle block click to scroll
  const handleBlockClick = (blockKey: string) => {
    const ref = sectionRefs.current[blockKey];
    if (ref && codeContainerRef.current) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Collect all code content for copying
  const getAllCodeContent = (): string => {
    const codeLines: string[] = [];
    
    allBlocks.forEach(block => {
      const content = getCodeContent(block.key, block.label);
      if (content) {
        codeLines.push(content);
      }
    });
    
    return codeLines.join('\n');
  };
  
  // Get code content as plain text
  const getCodeContent = (key: string, title: string): string => {
    const separator = `# ${'─'.repeat(8)} ${title.toUpperCase()} ${'─'.repeat(Math.max(0, 60 - title.length - 12))}`;
    
    switch (key) {
      case "initialization":
        return `${separator}

# Initialize Meep simulation environment
import meep as mp
import numpy as np

# Define simulation parameters
cell_size = mp.Vector3(${project.scene?.rectWidth || 16}, ${project.scene?.rectHeight || 8}, 0)
resolution = ${project.scene?.resolution || 10}

# Initialize coordinate system
pml_layers = [mp.PML(1.0)]
`;
        
      case "geometries":
        return `${separator}

# Define geometry objects (${geometryCount} total)
geometry = []

${geometryCount > 0 ? '# Geometry definitions will appear here' : '# No geometries defined yet'}
`;
        
      case "materials":
        return `${separator}

# Define materials (0 total)
# No materials defined yet
`;
        
      case "sources":
        return `${separator}

# Define sources (0 total)
# No sources defined yet
`;
        
      case "boundaries":
        return `${separator}

# Define boundary conditions (0 total)
# No boundaries defined yet
`;
        
      case "regions":
        return `${separator}

# Define simulation regions (0 total)
# No regions defined yet
`;
        
      case "simulation-assembly":
        return `${separator}

# Assemble simulation components and define monitors
sim = mp.Simulation(
    cell_size=cell_size,
    boundary_layers=pml_layers,
    geometry=geometry,
    sources=sources,
    resolution=resolution
)

# Define flux monitors
flux_monitor = sim.add_flux(...)

# Define field monitors and callbacks
field_monitor = sim.add_dft_fields(...)

# Ready to run simulation
sim.run(...)`;
        
      default:
        return '';
    }
  };
  
  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      const codeContent = getAllCodeContent();
      await navigator.clipboard.writeText(codeContent);
      setIsCopied(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  // Handle block-specific copy
  const handleBlockCopy = async (blockKey: string, blockTitle: string) => {
    try {
      const content = getCodeContent(blockKey, blockTitle);
      await navigator.clipboard.writeText(content);
      setCopiedBlock(blockKey);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedBlock(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy block:', err);
    }
  };
  
  // Handle hovering code blocks - use separate handlers for sidebar vs editor
  const handleSidebarBlockHover = (blockKey: string | null) => {
    setHoveredBlock(blockKey);
  };
  
  const handleEditorBlockHover = (blockKey: string | null) => {
    setHoveredBlock(blockKey);
  };
  
  // Render code section
  const renderCodeSection = (key: string, title: string) => {
    const separator = `# ${'─'.repeat(8)} ${title.toUpperCase()} ${'─'.repeat(Math.max(0, 60 - title.length - 12))}`;
    const isHovered = hoveredBlock === key;
    const isCopiedBlock = copiedBlock === key;
    
    return (
      <div className="relative group">
        {/* Copy button for individual blocks */}
        <button
          onClick={() => handleBlockCopy(key, title)}
          className={`absolute right-2 top-2 p-1.5 rounded transition-all duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } ${
            isCopiedBlock 
              ? 'text-gray-400' 
              : 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200'
          }`}
          title={isCopiedBlock ? 'Copied!' : 'Copy block'}
        >
          {isCopiedBlock ? (
            <Check size={14} className="transition-all duration-200" />
          ) : (
            <Copy size={14} className="transition-all duration-200" />
          )}
        </button>
        
        {/* Render the code content based on key */}
        {(() => {
          switch (key) {
            case "initialization":
              return (
                <>
                  <div className="text-yellow-400 font-bold">{separator}</div>
                  <br />
                  <div className="text-[#84bf6a]"># Initialize Meep simulation environment</div>
                  <div className="text-[#c586b6]">import</div> <span className="text-white">meep</span> <span className="text-[#c586b6]">as</span> <span className="text-white">mp</span>
                  <div className="text-[#c586b6]">import</div> <span className="text-white">numpy</span> <span className="text-[#c586b6]">as</span> <span className="text-white">np</span>
                  <br />
                  <div className="text-[#84bf6a]"># Define simulation parameters</div>
                  <div className="text-white">cell_size = mp.Vector3({project.scene?.rectWidth || 16}, {project.scene?.rectHeight || 8}, 0)</div>
                  <div className="text-white">resolution = {project.scene?.resolution || 10}</div>
                  <br />
                  <div className="text-[#84bf6a]"># Initialize coordinate system</div>
                  <div className="text-white">pml_layers = [mp.PML(1.0)]</div>
                  <br />
                </>
              );
              
            case "geometries":
              return (
                <>
                  <div className="text-yellow-400 font-bold">{separator}</div>
                  <br />
                  <div className="text-[#84bf6a]"># Define geometry objects ({geometryCount} total)</div>
                  <div className="text-white">geometry = []</div>
                  <br />
                  {geometryCount > 0 ? (
                    <div className="text-[#84bf6a]"># Geometry definitions will appear here</div>
                  ) : (
                    <div className="text-gray-500"># No geometries defined yet</div>
                  )}
                  <br />
                </>
              );
              
            case "materials":
              return (
                <>
                  <div className="text-yellow-400 font-bold">{separator}</div>
                  <br />
                  <div className="text-[#84bf6a]"># Define materials (0 total)</div>
                  <div className="text-gray-500"># No materials defined yet</div>
                  <br />
                </>
              );
              
            case "sources":
              return (
                <>
                  <div className="text-yellow-400 font-bold">{separator}</div>
                  <br />
                  <div className="text-[#84bf6a]"># Define sources (0 total)</div>
                  <div className="text-gray-500"># No sources defined yet</div>
                  <br />
                </>
              );
              
            case "boundaries":
              return (
                <>
                  <div className="text-yellow-400 font-bold">{separator}</div>
                  <br />
                  <div className="text-[#84bf6a]"># Define boundary conditions (0 total)</div>
                  <div className="text-gray-500"># No boundaries defined yet</div>
                  <br />
                </>
              );
              
            case "regions":
              return (
                <>
                  <div className="text-yellow-400 font-bold">{separator}</div>
                  <br />
                  <div className="text-[#84bf6a]"># Define simulation regions (0 total)</div>
                  <div className="text-gray-500"># No regions defined yet</div>
                  <br />
                </>
              );
              
            case "simulation-assembly":
              return (
                <>
                  <div className="text-yellow-400 font-bold">{separator}</div>
                  <br />
                  <div className="text-[#84bf6a]"># Assemble simulation components and define monitors</div>
                  <div className="text-white">sim = mp.Simulation(</div>
                  <div className="text-white">    cell_size=cell_size,</div>
                  <div className="text-white">    boundary_layers=pml_layers,</div>
                  <div className="text-white">    geometry=geometry,</div>
                  <div className="text-white">    sources=sources,</div>
                  <div className="text-white">    resolution=resolution</div>
                  <div className="text-white">)</div>
                  <br />
                  <div className="text-[#84bf6a]"># Define flux monitors</div>
                  <div className="text-white">flux_monitor = sim.add_flux(...)</div>
                  <br />
                  <div className="text-[#84bf6a]"># Define field monitors and callbacks</div>
                  <div className="text-white">field_monitor = sim.add_dft_fields(...)</div>
                  <br />
                  <div className="text-[#84bf6a]"># Ready to run simulation</div>
                  <div className="text-white">sim.run(...)</div>
                </>
              );
              
            default:
              return null;
          }
        })()}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full w-full bg-gray-900 overflow-hidden">
      {/* Custom CSS for text selection */}
      <style>{`
        .code-editor-content ::selection {
          background-color: #254f77;
          color: white;
        }
        .code-editor-content ::-moz-selection {
          background-color: #254f77;
          color: white;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Code size={16} className="text-blue-400" />
          <span className="text-white font-medium">Code Editor</span>
          {activeProjectId && (
            <span className="text-gray-400 text-sm">
              - {project.title}
            </span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Blocks Explorer */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-2 flex flex-col overflow-hidden">
          <div className="flex items-center space-x-2 mb-3">
            <FileText size={14} className="text-gray-400" />
            <span className="text-gray-300 text-sm font-medium">Code Blocks</span>
          </div>
          <div className="space-y-1 overflow-y-auto flex-1">
            {/* Initialization block */}
            <div 
              onClick={() => handleBlockClick("initialization")}
              onMouseEnter={() => handleSidebarBlockHover("initialization")}
              onMouseLeave={() => handleSidebarBlockHover(null)}
              className={`px-2 py-1 text-gray-300 text-sm rounded cursor-pointer transition-colors ${
                selectedBlock === "initialization" 
                  ? "bg-gray-700 text-white" 
                  : hoveredBlock === "initialization"
                    ? "bg-gray-700/50"
                    : "hover:bg-gray-700/50"
              }`}
            >
              Initialization
            </div>
            
            {/* Dynamic code blocks based on toolbar groups */}
            {CODE_BLOCK_GROUPS.map((group) => {
              const count = getObjectCount(group.key);
              return (
                <div 
                  key={group.key}
                  onClick={() => handleBlockClick(group.key)}
                  onMouseEnter={() => handleSidebarBlockHover(group.key)}
                  onMouseLeave={() => handleSidebarBlockHover(null)}
                  className={`px-2 py-1 text-gray-300 text-sm rounded cursor-pointer transition-colors flex items-center justify-between ${
                    selectedBlock === group.key 
                      ? "bg-gray-700 text-white" 
                      : hoveredBlock === group.key
                        ? "bg-gray-700/50"
                        : "hover:bg-gray-700/50"
                  }`}
                >
                  <span>{group.label}</span>
                  <span 
                    className="text-xs px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-400"
                    style={{ 
                      backgroundColor: count > 0 ? `${group.color}20` : undefined,
                      color: count > 0 ? group.color : undefined
                    }}
                  >
                    ({count})
                  </span>
                </div>
              );
            })}
            
            {/* Simulation Assembly block */}
            <div 
              onClick={() => handleBlockClick("simulation-assembly")}
              onMouseEnter={() => handleSidebarBlockHover("simulation-assembly")}
              onMouseLeave={() => handleSidebarBlockHover(null)}
              className={`px-2 py-1 text-gray-300 text-sm rounded cursor-pointer transition-colors ${
                selectedBlock === "simulation-assembly" 
                  ? "bg-gray-700 text-white" 
                  : hoveredBlock === "simulation-assembly"
                    ? "bg-gray-700/50"
                    : "hover:bg-gray-700/50"
              }`}
            >
              Simulation Assembly
            </div>
          </div>
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 h-10">
            <span className="text-gray-300 text-sm">{getSnakeCaseFilename(project.title)}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-all duration-200 h-7"
              title="Copy to clipboard"
            >
              {isCopied ? (
                <>
                  <Check size={14} className="transition-all duration-200" />
                </>
              ) : (
                <Copy size={14} className="transition-all duration-200" />
              )}
            </button>
          </div>
          <div 
            ref={codeContainerRef}
            className="flex-1 p-4 font-mono text-sm bg-[#222222] overflow-y-auto overflow-x-auto cursor-text code-editor-content"
          >
            <div className="text-gray-300 min-w-0">
              {allBlocks.map((block) => (
                <div 
                  key={block.key}
                  ref={el => { sectionRefs.current[block.key] = el; }}
                  onMouseEnter={() => handleEditorBlockHover(block.key)}
                  onMouseLeave={() => handleEditorBlockHover(null)}
                  className={`transition-colors duration-200 rounded px-2 -mx-2 ${
                    hoveredBlock === block.key ? 'bg-gray-700/20' : ''
                  }`}
                >
                  {renderCodeSection(block.key, block.label)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}