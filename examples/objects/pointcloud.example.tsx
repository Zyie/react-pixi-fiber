// #region result
import { useCallback, useMemo, useRef } from 'react';
import { Canvas } from 'react-pixi-fiber';
import type { ThreeEvent } from 'react-pixi-fiber';
import { Color, MathUtils } from 'react-pixi-fiber/three';
import type { Points } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
const white = new Color('white');
const hotpink = new Color('hotpink');

function Particles({ pointCount = 1000 }) {
  const [positions, colors] = useMemo(() => {
    MathUtils.seededRandom(1);
    const positions = Float32Array.from({ length: pointCount * 3 }, () => 5 - MathUtils.seededRandom() * 10);
    const colors = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) hotpink.toArray(colors, i * 3);
    return [positions, colors];
  }, [pointCount]);

  const points = useRef<Points>(null!);
  const recolor = useCallback((color: Color, index: number) => {
    const attribute = points.current.geometry.attributes.color;
    color.toArray(attribute.array as Float32Array, index * 3);
    attribute.needsUpdate = true;
  }, []);

  return (
    <points
      ref={points}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => (e.stopPropagation(), recolor(white, e.index!))}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => recolor(hotpink, e.index!)}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={12} sizeAttenuation={false} vertexColors depthWrite={false} />
    </points>
  );
}

export function App() {
  return (
    <Canvas
      orthographic
      camera={{ zoom: 40, position: [0, 0, 100] }}
      raycaster={{ params: { Points: { threshold: 0.2 } } }}
    >
      <Particles />
    </Canvas>
  );
}
// #endregion result

/** r3f's legacy Pointcloud demo with a `pointsMaterial` in place of its shader material: hover a point to whiten it */
export const example: Example = {
  title: 'Point cloud',
  canvas: { orthographic: true },
  camera: { zoom: 40, position: [0, 0, 100] },
  render: () => <Particles />,
};
