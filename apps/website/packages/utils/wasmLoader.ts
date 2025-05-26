let wasmModule: any = null;
let loadingPromise: Promise<any> | null = null;

export async function getWasmModule() {
  if (wasmModule) return wasmModule;
  
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = import("../../pkg/wasm.js").then((wasm) => {
    wasmModule = wasm;
    return wasm;
  });
  
  return loadingPromise;
}
