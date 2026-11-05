// #region result
import { Suspense } from 'react';
import { Canvas, useLoader } from 'react-pixi-fiber';
import { TextureLoader } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
function Scene() {
  // #region load
  const colorMap = useLoader(TextureLoader, '/textures/quadrants.png');
  // #endregion load

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <mesh rotation={[0.2, -0.4, 0]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial map={colorMap} />
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

/** An image loaded with `TextureLoader` through `useLoader`, as the map of a lit plane */
export const example: Example = {
  title: 'A texture with useLoader',
  render: () => <Scene />,
  // Only the edges between quadrants differ: pixi-3d filters the texture before its sRGB decode, three after.
  parity: { maxDiff: 0.03 },
};
