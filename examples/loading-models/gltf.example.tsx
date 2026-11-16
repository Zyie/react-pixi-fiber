// #region result
import { Canvas, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { Suspense, useReducer } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Test() {
  const [flag, toggle] = useReducer((state: boolean) => !state, true);
  const { scene } = useLoader(GLTFLoader, flag ? '/models/box.glb' : '/models/textured-box.glb');

  return <primitive object={scene} onClick={toggle} />;
}

useLoader.preload(GLTFLoader, ['/models/box.glb', '/models/textured-box.glb']);

export function App() {
  return (
    <Canvas>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Suspense fallback={null}>
        <Test />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's Gltf demo: a click swaps the model `useLoader` loads, both preloaded so the swap doesn't wait.
 * The demo swaps its birds on a timer; this swaps on a click, and the picture is taken after one, on
 * the second model.
 */
export const example: Example = {
  title: 'Swapping glTF models',
  render: () => (
    <>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Test />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(200, 125);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await frames(2);
  },
  // Only the edges between quadrants differ: pixi-3d filters the texture before its sRGB decode, three after.
  parity: { maxDiff: 0.05 },
};
