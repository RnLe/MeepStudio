// src/components/layout/TabWindowLattice.tsx
"use client";
import React from "react";
import { Lattice } from "../types/meepProjectTypes";
import LatticeCanvas from "./LatticeCanvas";
import LatticeToolbar from "./LatticeToolbar";
import { useLatticeDataLoader } from "../hooks/useLatticeDataLoader";

interface Props {
  lattice: Lattice;
  ghPages: boolean;
}

const TabWindowLattice: React.FC<Props> = ({ lattice, ghPages }) => {
  // Initialize the data loader
  useLatticeDataLoader({ lattice, ghPages });

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-gray-900">
      <LatticeToolbar lattice={lattice} ghPages={ghPages} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <LatticeCanvas lattice={lattice} ghPages={ghPages} />
      </div>
    </div>
  );
};

export default TabWindowLattice;
