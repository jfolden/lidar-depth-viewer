# LiDAR Depth Map & SPAD Simulator
An interactive, in-browser 3D point cloud visualizer and sensor simulation suite. This application leverages Pyodide (Python compiled to WebAssembly) to execute high-performance NumPy data processing pipelines directly inside the browser, rendering dense spatial structures via React Three Fiber (WebGL).

## Core Features (Current Functionality)
- Native NumPy Ingestion: Directly reads and processes standard .npy binary files containing singular 2D depth arrays.

- Wasm-Powered Processing: Uses a browser-side Python environment to parse data, execute geometric transformations, and handle dynamic data orientation changes (90° rotations).

- High-Density 3D Rendering: Renders hundreds of thousands of points efficiently utilizing WebGL vertex buffers and custom Three.js bufferGeometry.

- Perceptually Uniform Color Maps: Includes custom, lightweight mathematical Look-Up Tables (LUTs) for smooth height-based data visualization using Viridis, Plasma, Magma, Inferno, and Jet.

- Interactive Viewport Controls: Real-time point sizing adjustments, alpha opacity controls, camera resetting, and orbit controls.

## Tech Stack
- Frontend Library: React (Hooks, Context, State Synchronization)

- 3D Graphics: Three.js / React Three Fiber (R3F) / @react-three/drei

- WebAssembly Engine: Pyodide

- Core Math Pipeline: NumPy (Matrix manipulation, vectorized linear interpolation)

## Future Enhancements
- Expanded Data Pipelines
 - Multi-Format Ingestion: Implement native parsing modules for .csv coordinate lists, .ply (Polygon File Format), and compressed .laz / .las LiDAR files without server-side dependencies.

- Advanced Sensor Simulations
 - Simulated Adaptive Sampling: Introduce intelligent region-of-interest (ROI) algorithms that dynamically vary spatial sampling density based on depth gradients and object contours.

- SPAD Array Simulation: Model Single-Photon Avalanche Diode (SPAD) arrays, introducing realistic optical phenomena such as dark count rate (DCR), afterpulsing, ambient photon noise, and timing jitter.

- Analytics & Deep-Dive Diagnostics
 - Per-Point/Pixel Inspection: Implement interactive raycasting to allow users to click individual points and inspect raw metrics alongside real-time waveforms or histogram plots.

- Comparative Diagnostics: Introduce frame-by-frame statistical benchmarking. Users can upload a "Ground Truth" dataset to calculate structural error metrics (RMSE, MAE) globally or within user-drawn regional bounding boxes.