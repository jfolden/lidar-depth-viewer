import { useMemo, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

export default function PointCloudViewer({ data, pointSize, opacity }) {
  // console.log("Rendering PointCloudViewer with data:", data);
  const geometryRef = useRef();

  // Support both Object and Map styles for Pyodide flexibility
  const rawPos = data?.positions || (data?.get ? data.get('positions') : null);
  const rawCol = data?.colors || (data?.get ? data.get('colors') : null);

  if (!rawPos || !rawCol) return null;

  // Memoize attributes so wiggling sliders doesn't re-upload 4M points to GPU
  const posAttr = useMemo(() => 
    rawPos instanceof Float32Array ? rawPos : new Float32Array(rawPos), 
  [rawPos]);
  
  const colAttr = useMemo(() => 
    rawCol instanceof Float32Array ? rawCol : new Float32Array(rawCol), 
  [rawCol]);

  // Recalculate bounds so the camera/frustum doesn't cull the object
  useLayoutEffect(() => {
    if (geometryRef.current) {
      // 1. Tell Three.js the data in the buffers has changed
      geometryRef.current.attributes.position.needsUpdate = true;
      geometryRef.current.attributes.color.needsUpdate = true;

      // 2. Recalculate bounds so the points don't disappear when you rotate
      geometryRef.current.computeBoundingBox();
      geometryRef.current.computeBoundingSphere();
      
      console.log("GPU Buffers Updated & Bounds Recalculated");
    }
  }, [posAttr, colAttr]); // Trigger whenever the arrays change

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={posAttr.length / 3}
          array={posAttr}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colAttr.length / 3}
          array={colAttr}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={pointSize} 
        vertexColors={true}
        transparent={opacity < 1}
        opacity={opacity}
        sizeAttenuation={true} // Points scale with distance
        depthWrite={opacity === 1} // Improves rendering when points overlap
      />
    </points>
  );
}