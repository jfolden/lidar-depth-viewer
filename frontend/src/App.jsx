import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, Grid } from '@react-three/drei'
import PointCloudViewer from './components/PointCloudViewer'

export default function App() {
  const [pointsData, setPointsData] = useState(null)
  const [pyodide, setPyodide] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [loading, setLoading] = useState(true)

  const [pointSize, setPointSize] = useState(0.005);
  const [opacity, setOpacity] = useState(1.0);

  // 1. Initialize Pyodide once
  useEffect(() => {
    async function init() {
      const py = await window.loadPyodide()
      await py.loadPackage("numpy")
      // await py.loadPackage("micropip") // For colormaps
      // const micropip = py.pyimport("micropip");
      // await micropip.install("plyfile"); // Installs the PLY parser
      const pyCode = await (await fetch('./processor.py')).text()
      py.runPython(pyCode)
      setPyodide(py)
      setLoading(false)
      // Load initial default scene
      loadScene('./data/nyu_s0000.npy', py)
      setFileName('nyu_s0000.npy');
    }
    init()
  }, [])

    const [rotation, setRotation] = useState(0);
    const [rawBuffer, setRawBuffer] = useState(null); // Store the last buffer to re-process it
    const [activeColormap, setActiveColormap] = useState("virdis"); // virdis is default
    // Update processData to accept an angle
    const processData = useCallback(async (arrayBuffer, pyRuntime, angle, cmap, name) => {
      const runtime = pyRuntime || pyodide;
      if (!runtime || !arrayBuffer) return;

      try {
        const npyUint8 = new Uint8Array(arrayBuffer);
        
        // Log exactly what we are sending to Python to verify
        // console.log("Sending to Python:", { name, angle, cmap });

        // Ensure this order matches your Python def exactly:
        // Python: (file_bytes, filename, angle_deg, cmap_name)
        const result = runtime.globals.get('process_lidar_data')(
          npyUint8, 
          name,   // This must be the 2nd arg
          angle,  // This must be the 3rd arg
          cmap    // This must be the 4th arg
        );
        
        const jsData = result.toJs({ dict_converter: Object.fromEntries });
        setPointsData(jsData);
      } catch (err) {
        console.error("JS side error:", err);
      }
    }, [pyodide]);

    // Rotation handlers
    const rotateCW = () => {
      const newAngle = rotation + 90;
      setRotation(newAngle);
      if (rawBuffer) processData(rawBuffer, pyodide, newAngle, activeColormap,fileName);
    };

    const rotateCCW = () => {
      const newAngle = rotation - 90;
      setRotation(newAngle);
      if (rawBuffer) processData(rawBuffer, pyodide, newAngle, activeColormap,fileName);
    };
        // Handler for colormap change
    const handleColormapChange = (e) => {
      const newCmap = e.target.value;
      setActiveColormap(newCmap);
      if (rawBuffer) processData(rawBuffer, pyodide, rotation, newCmap, fileName);
    };

    useEffect(() => {
      if (pyodide && rawBuffer) {
        // console.log("GUI Change Detected! Re-processing...", { rotation, activeColormap });
        
        // We pass the states directly here to ensure Python gets the newest values
        processData(rawBuffer, pyodide, rotation, activeColormap, fileName);
      }
    }, [rotation, activeColormap, pyodide, rawBuffer, fileName, processData]);
      // Helper to load remote files
  const loadScene = async (url, pyRuntime) => {
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    const name = url.split('/').pop(); // Extract filename from URL
    setRawBuffer(buffer); // Save the raw buffer for future re-processing
    setFileName(name);
    processData(buffer, pyRuntime, rotation, activeColormap, name)

  }

  // // Handle User Upload
  // const handleFileUpload = (e) => {
  //   const file = e.target.files[0]
  //   if (!file) return
  //   const reader = new FileReader()
  //   reader.onload = (f) => processData(f.target.result)
  //   reader.readAsArrayBuffer(file)
    
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (f) => {
      const arrayBuffer = f.target.result;
      // Use the unified function so everything is saved/converted correctly
      setRawBuffer(arrayBuffer); // Save the raw buffer for future re-processing
      setFileName(file.name);
      processData(arrayBuffer, pyodide, rotation, activeColormap, file.name);
    };
    reader.readAsArrayBuffer(file);
  };
  const controlsRef = useRef();

  const resetCamera = () => {
    if (controlsRef.current) {
      // 1. Reset the OrbitControls target to the center of our unit cube
      controlsRef.current.target.set(0,0,0);
      
      // 2. Reset the camera position
      controlsRef.current.object.position.set(0, 0, 2);
      
      // 3. Force the controls to update internal matrices
      controlsRef.current.update();
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: '#111' }}>
      
      {/* --- SIDEBAR UI --- */}
      <div style={{
        width: '300px', 
        minWidth: '300px', // Prevent squishing
        flexShrink: 0,     // Crucial for Flexbox stability
        background: 'rgba(0,0,0,0.9)', 
        color: 'white', 
        padding: '20px', 
        zIndex: 10,
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto'
        }}>
        <h2>LiDAR Viewer</h2>
        
        <div>
          <h4>Default Scenes</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <button onClick={() => loadScene('./data/room_scene0000.npy')}>NYUv2 - 1</button>
            <button onClick={() => loadScene('./data/toilet_scene0000.npy')}>NYUv2 - 2</button>
          </div>
        </div>

        <div>
          <h4>Upload Data</h4>
          <input type="file" accept=".npy,.ply,.csv" onChange={handleFileUpload} style={{fontSize: '12px'}} />
        </div>

        <section>
          <h4 style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Visualization</h4>
          <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '5px' }}>Color Map</label>
          <select 
            value={activeColormap} 
            onChange={handleColormapChange}
            style={{
              width: '100%',
              background: '#222',
              color: '#fff',
              border: '1px solid #444',
              padding: '8px',
              borderRadius: '4px'
            }}
          >
            <option value="viridis">Viridis (Default)</option>
            <option value="plasma">Plasma</option>
            <option value="magma">Magma</option>
            <option value="inferno">Inferno</option>
            <option value="jet">Jet</option>
          </select>
        </section>

        <section>
          <h4 style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Orientation</h4>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={rotateCCW} title="Rotate 90° CCW">⟲</button>
            <button onClick={rotateCW} title="Rotate 90° CW">⟳</button>
            <span style={{ fontSize: '0.8rem', alignSelf: 'center' }}>{rotation}°</span>
          </div>
        </section>

        <section>
          <h4 style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>View Controls</h4>
          <button 
            onClick={resetCamera}
            style={{
              width: '100%',
              padding: '8px',
              background: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset Camera
          </button>

          <label style={{ fontSize: '0.75rem' }}>Size: {pointSize}</label>
          <input 
            type="range" min="0.001" max="0.25" step="0.001" 
            value={pointSize} 
            onChange={(e) => setPointSize(parseFloat(e.target.value))}
            style={{ width: '100%', marginBottom: '10px' }}
          />

          <label style={{ fontSize: '0.75rem' }}>Opacity: {opacity}</label>
          <input 
            type="range" min="0.1" max="1.0" step="0.05" 
            value={opacity} 
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            style={{ width: '100%', marginBottom: '10px' }}
          />

        </section>

        {loading && <div style={{color: '#00ff88', fontSize: '0.8rem'}}>Loading Python</div>}
      </div> {/* This CLOSES the Sidebar */}

      {/* --- 3D CANVAS --- */}
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
          <ambientLight intensity={0.5} />
          {pointsData && (
            <PointCloudViewer 
              data={pointsData} 
              pointSize={pointSize} 
              opacity={opacity} 
            />
          )}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            target={[0, 0, 0]} 
          />
          <Grid args={[10, 10]} sectionColor="#333" cellColor="#222" position={[0, -0.5, 0]} />
          <Stats />
        </Canvas>
      </div>
    </div> // This CLOSES the App
  )
}