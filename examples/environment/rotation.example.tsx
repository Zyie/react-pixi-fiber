// #region result
import { Suspense } from 'react';
import { Canvas, Environment } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
function Scene() {
  return (
    <>
      {/* #region environment */}
      <Environment
        files="/environment/equirect.png"
        background
        backgroundRotation={[0, Math.PI / 2, 0]}
        environmentRotation={[0, Math.PI / 2, 0]}
        backgroundIntensity={0.7}
        environmentIntensity={0.8}
      />
      {/* #endregion environment */}
      <mesh>
        <sphereGeometry args={[1, 64, 32]} />
        <meshStandardMaterial metalness={1} roughness={0.05} />
      </mesh>
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/**
 * The environment and the background turned a quarter round and dimmed: the mirror ball reflects the
 * same turned sky the background shows
 */
export const example: Example = {
  title: 'Turning and dimming an environment',
  render: () => <Scene />,
};
