// #region result
import { Canvas, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { Suspense } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region model
function Model() {
  const gltf = useLoader(GLTFLoader, '/models/box.glb');

  return <primitive object={gltf.scene} position={[0, -0.5, 0]} />;
}
// #endregion model

export function App() {
  return (
    <Canvas camera={{ position: [0, 2, 4] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/** A glTF file's scene added whole with `<primitive>`: a red box on a blue slab */
export const example: Example = {
  title: 'A glTF model with useLoader',
  camera: { position: [0, 2, 4] },
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <Model />
    </>
  ),
};
