import { Canvas, Environment } from '@react-fiber/threejs-compat';
// #region result
import { Suspense } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
const SPHERES = [
  { metalness: 0, roughness: 0.3 },
  { metalness: 1, roughness: 0.4 },
  { metalness: 1, roughness: 0.05 },
];

function Spheres() {
  return (
    <>
      {SPHERES.map(({ metalness, roughness }, index) => (
        <mesh key={index} position={[(index - 1) * 1.6, 0, 0]}>
          <sphereGeometry args={[0.7, 64, 32]} />
          <meshStandardMaterial color="#ffffff" metalness={metalness} roughness={roughness} />
        </mesh>
      ))}
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <Suspense fallback={null}>
        {/* #region environment */}
        <Environment files="/environment/equirect.hdr" background />
        {/* #endregion environment */}
        <Spheres />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/**
 * `<Environment files>` with an `.hdr`: the sky lights three white spheres, a dielectric one, a rough
 * metal one and a polished one, and is drawn behind them with `background`
 */
export const example: Example = {
  title: 'An environment from an .hdr file',
  render: () => (
    <>
      <Environment files="/environment/equirect.hdr" background />
      <Spheres />
    </>
  ),
};
