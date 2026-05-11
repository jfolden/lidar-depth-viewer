import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, Grid } from '@react-three/drei'
import PointCloudViewer from './components/PointCloudViewer'

export default function App() {
  const [pointsData, setPointsData] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    async function initLidarSim() {
      // 1. Load Pyodide from window (ensure script is in index.html)
      const pyodide = await window.loadPyodide()
      await pyodide.loadPackage("numpy")
      
      // 2. Fetch the .npy and the .py script from /public
      const [npyRes, pyRes] = await Promise.all([
        fetch('./data/nyu_s0000.npy'),
        fetch('./processor.py')
      ])
      
      const npyBytes = await npyRes.arrayBuffer()
      const npyUint8 = new Uint8Array(npyBytes)
      const pythonCode = await pyRes.text()

      // 3. Run the Python logic
      pyodide.runPython(pythonCode)
      const result = pyodide.globals.get('process_depth_to_xyz')(pyodide.toPy(npyUint8))
      console.log(result.toJs())
      
      // 4. Convert to JS Float32Array and store
      setPointsData(result.toJs())
      const jsData = result.toJs();
      // In App.jsx, replace the Math.min/max lines with this:
      const pos = jsData.get('positions');

      const minX = pos.reduce((min, val) => val < min ? val : min, pos[2]);
      const maxX = pos.reduce((max, val) => val > max ? val : max, pos[2]);

      console.log("Min X:", minX, "Max X:", maxX);
      console.log("Point Count:", pos.length / 3);
      setIsReady(true)
    }

    initLidarSim()
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      {!isReady && (
        <div style={{ color: 'white', position: 'absolute', zIndex: 10, padding: 20 }}>
          Initializing Pyodide & NumPy...
        </div>
      )}
      
    <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <PointCloudViewer data={pointsData} />
      <OrbitControls />
    </Canvas>
    </div>
  )
}