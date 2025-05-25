"use client";
import React from "react";
import { Code, FileText, Play } from "lucide-react";

export default function CodeEditor() {
  return (
    <div className="flex flex-col h-full w-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Code size={16} className="text-blue-400" />
          <span className="text-white font-medium">Code Editor</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm">
            <Play size={14} />
            <span>Run</span>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex">
        {/* File Explorer */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-2">
          <div className="flex items-center space-x-2 mb-3">
            <FileText size={14} className="text-gray-400" />
            <span className="text-gray-300 text-sm font-medium">Files</span>
          </div>
          <div className="space-y-1">
            <div className="px-2 py-1 text-gray-300 text-sm hover:bg-gray-700 rounded cursor-pointer">
              main.py
            </div>
            <div className="px-2 py-1 text-gray-300 text-sm hover:bg-gray-700 rounded cursor-pointer">
              simulation.py
            </div>
            <div className="px-2 py-1 text-gray-300 text-sm hover:bg-gray-700 rounded cursor-pointer">
              config.json
            </div>
          </div>
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-gray-300 text-sm">main.py</span>
          </div>
          <div className="flex-1 p-4 font-mono text-sm bg-gray-900">
            <div className="text-gray-300">
              <div className="text-green-400"># Meep simulation code</div>
              <div className="text-blue-400">import</div> <span className="text-white">meep</span> <span className="text-blue-400">as</span> <span className="text-white">mp</span>
              <div className="text-blue-400">import</div> <span className="text-white">numpy</span> <span className="text-blue-400">as</span> <span className="text-white">np</span>
              <br />
              <div className="text-green-400"># Define simulation parameters</div>
              <div className="text-white">cell_size = mp.Vector3(16, 8, 0)</div>
              <div className="text-white">resolution = 10</div>
              <br />
              <div className="text-green-400"># Add your simulation code here...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
