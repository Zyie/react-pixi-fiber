// #region result
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from 'react-pixi-fiber';
import { BoxGeometry, BufferGeometry, Vector3 } from 'react-pixi-fiber/three';
import type { Points } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
function Starfield({ count = 400 }) {
  const points = useRef<Points>(null!);
  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.2 + ((i * 7919) % 100) / 100;
      const theta = i * 2.39996;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      array.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)], i * 3);
    }
    return array;
  }, [count]);
  useFrame((_, delta) => {
    points.current.rotation.y += delta * 0.2;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#f9d56e" />
    </points>
  );
}

function Wires() {
  const spiral = useMemo(() => {
    const points = Array.from({ length: 80 }, (_, i) => {
      const t = i / 79;
      return new Vector3(Math.cos(t * 12) * t * 0.9, t * 2 - 1, Math.sin(t * 12) * t * 0.9);
    });
    return new BufferGeometry().setFromPoints(points);
  }, []);
  const box = useMemo(() => new BoxGeometry(1.2, 1.2, 1.2), []);

  return (
    <>
      <threeLine geometry={spiral} position={[-2.6, 0, 0]}>
        <lineBasicMaterial color="#ff6f91" />
      </threeLine>
      <lineSegments position={[2.6, 0, 0]} rotation={[0.5, 0.6, 0]}>
        <edgesGeometry args={[box]} />
        <lineBasicMaterial color="#4ecdc4" />
      </lineSegments>
      <gridHelper args={[8, 16, '#888888', '#333333']} position={[0, -1.5, 0]} />
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 1, 6] }}>
      <Starfield />
      <Wires />
    </Canvas>
  );
}
// #endregion result

export const example: Example = {
  title: 'Points and lines',
  camera: { position: [0, 1, 6] },
  render: () => (
    <>
      <Starfield />
      <Wires />
    </>
  ),
  // WebGPU rasterises 1 pixel lines by its own rule, a pixel over from WebGL's and three's here and there.
  parity: { maxDiff: 0.06 },
};
