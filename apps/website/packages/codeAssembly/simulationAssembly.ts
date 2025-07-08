import { ConversionContext, generateSectionSeparator } from './codeAssemblyConversion2D';
import { CodeBlock } from '../providers/CodeAssemblyStore';

export interface SimulationResult {
  success: boolean;
  error?: string;
}

/**
 * Generate simulation assembly code block that ties everything together
 */
export async function generateSimulationCode(context: ConversionContext): Promise<SimulationResult> {
  try {
    const { canvasState, codeState, project } = context;
    
    // Get counts of different elements
    const geometryCount = canvasState.geometries?.length || 0;
    const sourceCount = canvasState.sources?.length || 0;
    const boundaryCount = canvasState.boundaries?.length || 0;
    const regionCount = canvasState.regions?.length || 0;
    
    // Get simulation parameters
    const params = codeState.simulationParams;
    
    const lines: string[] = [
      generateSectionSeparator('SIMULATION ASSEMBLY'),
      '',
      '# Assemble and run the FDTD simulation',
      ''
    ];
    
    // Build simulation object
    lines.push(
      '# Create the simulation object',
      'sim = mp.Simulation(',
      `    cell_size=mp.Vector3(${params.cellSize.x}, ${params.cellSize.y}, ${params.cellSize.z}),`,
      `    resolution=${params.resolution},`,
      '    geometry=geometry_objects,',
      '    sources=sources,',
      '    boundary_layers=boundary_layers,',
      '    default_material=default_material',
      ')',
      ''
    );
    
    // Add DFT monitors if regions exist
    if (regionCount > 0) {
      lines.push(
        '# Add DFT monitors for flux/energy/force calculations',
        '# Extract frequency range from sources for DFT monitoring',
        'source_frequencies = []',
        'for source in sources:',
        '    if hasattr(source, "frequency"):',
        '        source_frequencies.append(source.frequency)',
        '',
        '# Set up frequency range for DFT monitors',
        'if source_frequencies:',
        '    freq_min = min(source_frequencies) * 0.8  # 20% below minimum',
        '    freq_max = max(source_frequencies) * 1.2  # 20% above maximum',
        '    nfreq = 21  # Number of frequency points',
        'else:',
        '    # Default frequency range if no sources with frequency found',
        '    freq_min, freq_max, nfreq = 0.5, 1.5, 21',
        '',
        'dft_frequencies = mp.LinearInterpolatedDistribution(frequency_list=',
        '    [freq_min + i * (freq_max - freq_min) / (nfreq - 1) for i in range(nfreq)])',
        '',
        'if flux_regions:',
        '    # Add flux monitors for Poynting vector calculations',
        '    flux_monitor = sim.add_flux(dft_frequencies, flux_regions)',
        '    print(f"Added flux monitor with {len(flux_regions)} regions")',
        '',
        'if energy_regions:',
        '    # Add energy density monitors',
        '    energy_monitor = sim.add_energy(dft_frequencies, energy_regions)',
        '    print(f"Added energy monitor with {len(energy_regions)} regions")',
        '',
        'if force_regions:',
        '    # Add force monitors for Maxwell stress tensor',
        '    force_monitor = sim.add_force(dft_frequencies, force_regions)',
        '    print(f"Added force monitor with {len(force_regions)} regions")',
        ''
      );
    }
    
    // Add field output (optional)
    lines.push(
      '# Optional: Add field output during simulation',
      '# sim.use_output_directory("output")  # Uncomment to save outputs',
      ''
    );
    
    // Run simulation
    const runtime = params.runtime || 100;
    lines.push(
      '# Run the simulation',
      'print("Starting FDTD simulation...")',
      `print(f"Simulation parameters: {params.cellSize.x}×{params.cellSize.y} cell, resolution={params.resolution}")`,
      `print(f"Objects: {geometryCount} geometries, {sourceCount} sources, ${boundaryCount} boundaries, ${regionCount} regions")`,
      '',
      `sim.run(until=${runtime})`,
      '',
      'print("Simulation completed!")',
      ''
    );
    
    // Post-processing and data extraction
    if (regionCount > 0) {
      lines.push(
        '# Post-processing and results extraction',
        'print("\\nExtracting simulation results...")',
        '',
        'if flux_regions:',
        '    # Extract flux data for transmission/reflection analysis',
        '    flux_data = sim.get_flux_data(flux_monitor)',
        '    print(f"Flux data extracted: {len(flux_data)} frequency points")',
        '    # Example: Calculate transmission/reflection',
        '    # flux_total = sum(flux_data)  # Total flux through region',
        '',
        'if energy_regions:',
        '    # Extract energy density data',
        '    energy_data = sim.get_energy_data(energy_monitor)',
        '    print(f"Energy data extracted: {len(energy_data)} frequency points")',
        '    # Example: Energy stored in cavity or resonator',
        '',
        'if force_regions:',
        '    # Extract force data for optical forces analysis',
        '    force_data = sim.get_force_data(force_monitor)',
        '    print(f"Force data extracted: {len(force_data)} frequency points")',
        '    # Example: Radiation pressure, gradient forces',
        '',
        '# Save results to files (optional)',
        '# import numpy as np',
        '# if "flux_data" in locals():',
        '#     np.savetxt("flux_results.csv", flux_data, delimiter=",")',
        '# if "energy_data" in locals():',
        '#     np.savetxt("energy_results.csv", energy_data, delimiter=",")',
        '# if "force_data" in locals():',
        '#     np.savetxt("force_results.csv", force_data, delimiter=",")',
        ''
      );
    }
    
    // Optional visualization and analysis
    lines.push(
      '# Optional: Visualization and field analysis',
      '# Uncomment the following lines to enable visualization',
      '',
      '# import matplotlib.pyplot as plt',
      '# import numpy as np',
      '',
      '# # Plot dielectric structure',
      '# eps_data = sim.get_array(center=mp.Vector3(), size=cell_size, component=mp.Dielectric)',
      '# plt.figure(figsize=(10, 6))',
      '# plt.subplot(1, 2, 1)',
      '# plt.imshow(eps_data.transpose(), interpolation="spline36", cmap="RdYlBu")',
      '# plt.title("Dielectric Structure")',
      '# plt.colorbar()',
      '',
      '# # Plot electric field magnitude (at final time)',
      '# ez_data = sim.get_array(center=mp.Vector3(), size=cell_size, component=mp.Ez)',
      '# plt.subplot(1, 2, 2)',
      '# plt.imshow(np.abs(ez_data).transpose(), interpolation="spline36", cmap="hot")',
      '# plt.title("Electric Field |Ez|")',
      '# plt.colorbar()',
      '',
      '# plt.tight_layout()',
      '# plt.savefig("simulation_results.png", dpi=300, bbox_inches="tight")',
      '# plt.show()',
      ''
    );
    
    // Create code block
    const codeBlock: CodeBlock = {
      key: 'simulation-assembly',
      label: 'Simulation Assembly',
      content: lines.join('\n'),
      imports: [],
      dependencies: ['initialization', 'materials', 'geometries', 'lattices', 'sources', 'boundaries', 'regions']
    };
    
    // Store in code state
    codeState.setCodeBlock('simulation-assembly', codeBlock);
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate simulation code'
    };
  }
}

/**
 * Validate simulation parameters
 */
export function validateSimulation(context: ConversionContext): string[] {
  const errors: string[] = [];
  const { canvasState, codeState } = context;
  
  // Check for required elements
  if (!canvasState.sources || canvasState.sources.length === 0) {
    errors.push('At least one source is required for FDTD simulation');
  }
  
  // Check cell size
  const cellSize = codeState.simulationParams.cellSize;
  if (cellSize.x <= 0 || cellSize.y <= 0) {
    errors.push('Cell size must be positive');
  }
  
  // Check resolution
  if (codeState.simulationParams.resolution <= 0) {
    errors.push('Resolution must be positive');
  }
  
  // Check runtime
  if (codeState.simulationParams.runtime && codeState.simulationParams.runtime <= 0) {
    errors.push('Runtime must be positive');
  }
  
  return errors;
}
