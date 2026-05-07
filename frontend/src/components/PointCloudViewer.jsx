import { useEffect, useState } from 'react'
import axios from 'axios'
import * as THREE from 'three'

export default function PointCloudViewer() {
  const [geometry, setGeometry] = useState(null)

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/pointcloud')
      .then((response) => {
        const points = response.data.points

        const vertices = []

        points.forEach((p) => {
          vertices.push(p[0], p[1], p[2])
        })

        const geo = new THREE.BufferGeometry()

        geo.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(vertices, 3)
        )

        setGeometry(geo)
      })
  }, [])

  if (!geometry) return null

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color={'white'}
        sizeAttenuation
      />
    </points>
  )
}