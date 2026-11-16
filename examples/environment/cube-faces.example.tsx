import { Canvas, Environment } from '@react-fiber/threejs-compat';
// #region result
import { Suspense } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
const faces = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];

function Scene() {
  return (
    <>
      {/* #region environment */}
      <Environment files={faces} path="/environment/cube/" background backgroundBlurriness={0.15} />
      {/* #endregion environment */}
      <mesh>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial color="#d9d9d9" metalness={0.9} roughness={0.2} />
      </mesh>
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [3, 1.5, 3] }}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/**
 * `<Environment>` from six images, a cube map, lighting a metal box and drawn softly blurred behind it
 * with `backgroundBlurriness`
 */
export const example: Example = {
  title: 'An environment from six images',
  camera: { position: [3, 1.5, 3] },
  render: () => <Scene />,
};
