// src/components/layout/TabWindowLattice.tsx
"use client";
import React from "react";
import { Lattice } from "../types/meepLatticeTypes";
import LatticeCanvas from "./LatticeCanvas";
import LatticeToolbar from "./LatticeToolbar";
import { useLatticeDataLoader } from "../hooks/useLatticeDataLoader";

interface Props {
  lattice: Lattice;
  ghPages: boolean;
}

const TabWindowLattice: React.FC<Props> = ({ lattice, ghPages }) => {
  // Initialize the data loader and get its results
  const dataLoader = useLatticeDataLoader({ lattice, ghPages });

  return (
    <div className="flex-1 flex flex-row w-full h-full overflow-hidden">
      {/* fixed-width toolbar */}
      <div className="flex-none">
        <LatticeToolbar lattice={lattice} ghPages={ghPages} />
      </div>

      {/* canvas area */}
      <div className="flex-1 relative min-w-0 min-h-0">
        <LatticeCanvas lattice={lattice} ghPages={ghPages} />
      </div>
    </div>
  );
};

export default TabWindowLattice;
