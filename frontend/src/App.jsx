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
      
      // 4. Convert to JS Float32Array and store
      setPointsData(result.toJs())
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
      
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Grid args={[20, 20]} sectionColor="#333" cellColor="#222" />

        {pointsData && <PointCloudViewer positions={pointsData} />}

        <OrbitControls />
        <Stats />
      </Canvas>
    </div>
  )
}