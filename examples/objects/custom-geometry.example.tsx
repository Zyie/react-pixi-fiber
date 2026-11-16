// #region result
import { Canvas } from '@react-fiber/threejs-compat';
import { useMemo } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Fan({ blades = 12 }) {
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(blades * 9);
    const colors = new Float32Array(blades * 9);
    for (let i = 0; i < blades; i++) {
      const a = (i / blades) * Math.PI * 2;
      const b = ((i + 0.6) / blades) * Math.PI * 2;
      positions.set([0, 0, 0, Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0, Math.cos(b) * 1.6, Math.sin(b) * 1.6, 0], i * 9);
      const t = i / blades;
      colors.set([1, 1, 1, t, 0.4, 1 - t, t, 0.4, 1 - t], i * 9);
    }
    return [positions, colors];
  }, [blades]);

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <meshBasicMaterial vertexColors side={2} />
    </mesh>
  );
}

export function App() {
  return (
    <Canvas>
      <Fan />
    </Canvas>
  );
}
// #endregion result

export const example: Example = {
  title: 'A custom buffer geometry',
  render: () => <Fan />,
};
