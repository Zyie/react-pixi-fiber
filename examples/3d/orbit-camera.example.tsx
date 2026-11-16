// #region result
import { OrbitCamera3D } from '@react-fiber/3d';
import { Canvas } from '@react-fiber/core';
// #endregion result

import type { Example } from '../example';

// #region result
function Scene() {
  return (
    <>
      <OrbitCamera3D target={{ x: 0, y: 0.5, z: 0 }} minDistance={3} maxDistance={12} />
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={3} />
      <mesh3D position={[0, 0.5, 0]}>
        <cubeGeometry3D />
        <material3D baseColor="orange" roughness={0.6} />
      </mesh3D>
      <mesh3D position={[1.6, 0.4, 0]}>
        <sphereGeometry3D args={[{ radius: 0.4 }]} />
        <material3D baseColor="#4363d8" roughness={0.4} />
      </mesh3D>
      <mesh3D angle={[-90, 0, 0]}>
        <planeGeometry3D args={[{ width: 6, height: 6 }]} />
        <material3D baseColor="#3a3a3a" />
      </mesh3D>
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 2, 6] }}>
      <Scene />
    </Canvas>
  );
}
// #endregion result

/**
 * An orange cube and a blue ball on a floor, seen through `<OrbitCamera3D>` after a drag to the left turned
 * the camera around the cube, so the ball is in front of it, and a wheel turn brought it closer.
 */
export const example: Example = {
  title: 'Orbit camera',
  camera: { position: [0, 2, 6] },
  render: () => <Scene />,
  act: async ({ mouse, frames }) => {
    await frames();
    await mouse.move(260, 150);
    await mouse.down();
    await mouse.move(200, 150);
    await mouse.move(140, 150);
    await mouse.up();
    await mouse.wheel(0, -200);
    await frames();
  },
};
