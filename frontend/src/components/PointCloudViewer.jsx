import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function PointCloudViewer({ data }) {
  const geometry = useMemo(() => {
    // Safety check: if data isn't loaded yet, return null or empty geo
    if (!data) return new THREE.BufferGeometry();

    const geo = new THREE.BufferGeometry();
    
    // Use .get() because Pyodide dictionaries become JS Maps
    const posArray = data.get('positions');
    const colorArray = data.get('colors');

    if (posArray) {
      geo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
    }
    
    if (colorArray) {
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3));
    }
    
    return geo;
  }, [data]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors={!!data?.get('colors')} // Enable vertex colors if they exist
        sizeAttenuation={false}
      />
    </points>
  );
}