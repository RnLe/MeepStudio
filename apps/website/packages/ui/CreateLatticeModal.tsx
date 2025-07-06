"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useEditorStateStore } from "../providers/EditorStateStore";
import { useMeepProjects } from "../hooks/useMeepProjects";

interface CreateLatticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  latticeType: 'square' | 'rectangular' | 'hexagonal' | 'rhombic' | 'oblique' | 'custom';
  latticeTypeInfo: {
    name: string;
    description: string;
  };
}

export default function CreateLatticeModal({ 
  isOpen, 
  onClose, 
  latticeType,
  latticeTypeInfo 
}: CreateLatticeModalProps) {
  const { openLattice } = useEditorStateStore();
  const { createLattice } = useMeepProjects();
  
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNewTitle("");
      setNewDescription("");
    }
  }, [isOpen]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    
    try {
      // Set lattice parameters based on selected type
      let parameters = { a: 1, b: 1, alpha: 90, gamma: 90 };
      let basis1 = { x: 1, y: 0, z: 0 };
      let basis2 = { x: 0, y: 1, z: 0 };

      switch (latticeType) {
        case 'hexagonal':
          parameters = { a: 1, b: 1, alpha: 90, gamma: 120 };
          basis2 = { x: -0.5, y: Math.sqrt(3)/2, z: 0 };
          break;
        case 'rhombic':
          parameters = { a: 1, b: 1, alpha: 90, gamma: 60 };
          basis2 = { x: 0.5, y: Math.sqrt(3)/2, z: 0 };
          break;
        case 'oblique':
          parameters = { a: 1, b: 1.2, alpha: 90, gamma: 75 };
          basis2 = { x: 0.259, y: 1.161, z: 0 };
          break;
        case 'rectangular':
          parameters = { a: 1, b: 1.5, alpha: 90, gamma: 90 };
          basis2 = { x: 0, y: 1.5, z: 0 };
          break;
      }

      const lattice = await createLattice({
        title,
        description: newDescription.trim() || undefined,
        latticeType,
        meepLattice: {
          basis1,
          basis2,
          basis3: { x: 0, y: 0, z: 1 },
          basis_size: { x: parameters.a, y: parameters.b, z: 1 }
        },
        parameters,
        displaySettings: {
          showWignerSeitz: false,
          showBrillouinZone: false,
          showHighSymmetryPoints: false,
          showReciprocal: false,
        }
      });
      
      if (lattice) {
        openLattice(lattice);
      }
      
      onClose();
    } catch (error) {
      console.error("Failed to create lattice", error);
    }
  };

  const hasContent = newTitle || newDescription;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create ${latticeTypeInfo.name} Lattice`}
      closeOnOutsideClick={!hasContent}
    >
      <div className="mb-4">
        <p className="text-sm text-gray-400">{latticeTypeInfo.description}</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Lattice Title
          </label>
          <input
            type="text"
            required
            placeholder="Enter lattice name"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm placeholder-gray-500 text-white focus:border-blue-500 focus:outline-none"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            placeholder="Enter description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm placeholder-gray-500 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          >
            Create Lattice
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
