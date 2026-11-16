// #region result
import type { Scene3DSource } from '@pixi/3d';
import { Canvas, useAsset } from '@react-fiber/core';
import '@react-fiber/3d';
import type { Texture } from 'pixi.js';
import { Suspense } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region model
function Crate() {
  const source = useAsset<Scene3DSource>('/models/textured-box.glb');

  return <model3D args={[source]} position={[-1.3, 0, 0]} angle={[25, 35, 0]} />;
}
// #endregion model

// #region texture
function Poster() {
  const texture = useAsset<Texture>('/textures/quadrants.png');

  return (
    <mesh3D position={[1.3, 0, 0]} angle={[0, -25, 0]}>
      <planeGeometry3D args={[{ width: 1.8, height: 1.8, flipV: true }]} />
      <flatMaterial3D textures-baseColor={texture} />
    </mesh3D>
  );
}
// #endregion texture

function Lights() {
  return (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
    </>
  );
}

// #region suspense
export function App() {
  return (
    <Canvas>
      <Lights />
      <Suspense fallback={null}>
        <Crate />
        <Poster />
      </Suspense>
    </Canvas>
  );
}
// #endregion suspense
// #endregion result

/** A textured box loaded from a glTF file on the left, and a picture loaded as a texture on a plane on the right */
export const example: Example = {
  title: 'Loading a model and a texture',
  render: () => (
    <>
      <Lights />
      <Crate />
      <Poster />
    </>
  ),
};
