// #region result
import type { Mesh3D } from '@pixi/3d';
import { Canvas, useFrame } from '@react-fiber/core';
import '@react-fiber/3d';
import { useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region box
function Box() {
  const mesh = useRef<Mesh3D>(null);

  useFrame((_, delta) => {
    mesh.current!.rotation.y += delta;
  });

  return (
    <mesh3D ref={mesh} rotation-x={0.4}>
      <cubeGeometry3D args={[{ width: 2, height: 2, depth: 2 }]} />
      <material3D baseColor="#5ec27a" roughness={0.6} />
    </mesh3D>
  );
}
// #endregion box

// #region lights
function Scene() {
  return (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={3} />
      <Box />
    </>
  );
}
// #endregion lights

export function App() {
  return (
    <div id="canvas-container">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
// #endregion result

/** A green cube under an ambient and a directional light, turning a radian a second, here after half a second */
export const example: Example = {
  title: 'Your first 3D scene',
  frames: 31,
  render: () => <Scene />,
};
