import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, Grid } from '@react-three/drei'
import PointCloudViewer from './components/PointCloudViewer'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <Grid args={[20, 20]} />

        <PointCloudViewer />

        <OrbitControls />
        <Stats />
      </Canvas>
    </div>
  )
}