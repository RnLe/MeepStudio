"use client";
import { useEffect, useState } from "react";
 
export default function Documentation() {
  // Logging
  const [sum, setSum] = useState(Number);

  useEffect(() => {
    // Loading the wasm-bindgen JS and .wasm
    import("../../pkg/wasm.js").then((wasm) => {
      // After initialization, call the exported `add` function
      const result = wasm.add(7, 20);
      setSum(result);
    });
  }, []);
 
  // Return the JSX
  return (
    <div className="w-auto h-auto">
      {sum === null ? (
        <p>Loading…</p>
      ) : (
        <p>
          7 + 13 via Rust/WASM = <strong>{sum}</strong>
        </p>
      )}
    </div>
  );
}