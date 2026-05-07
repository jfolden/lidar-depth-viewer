import { useMemo } from 'react'
import * as THREE from 'three'

export default function PointCloudViewer() {
  const points = useMemo(() => {
    const geometry = new THREE.BufferGeometry()

    const vertices = []

    for (let i = 0; i < 10000; i++) {
      vertices.push(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      )
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    )

    return geometry
  }, [])

  return (
    <points geometry={points}>
      <pointsMaterial
        size={0.03}
        color={'white'}
        sizeAttenuation
      />
    </points>
  )
}