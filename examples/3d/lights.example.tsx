// #region result
import { Canvas } from '@react-fiber/core';
import '@react-fiber/3d';
// #endregion result

import type { Example } from '../example';

// #region result
function Stage() {
  return (
    <>
      {/* #region lights */}
      <ambientLight3D intensity={0.15} />
      <directionalLight3D angle={[-50, -30, 0]} intensity={0.8} />
      <pointLight3D position={[-2.2, 1.2, 0.5]} color="#ff5a36" intensity={12} range={6} />
      <spotLight3D
        position={[2.2, 3, 0]}
        angle={[-90, 0, 0]}
        color="#4f86f7"
        intensity={40}
        coneAngle={30}
        penumbra={0.4}
        range={8}
      />
      {/* #endregion lights */}
      <mesh3D angle={[-90, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry3D args={[{ width: 9, height: 6 }]} />
        <material3D baseColor="#9a9a9a" roughness={0.9} metallic={0} />
      </mesh3D>
      {[-2.2, 0, 2.2].map((x) => (
        <mesh3D key={x} position={[x, 0, 0]} scale={0.6}>
          <sphereGeometry3D />
          <material3D baseColor="#ffffff" roughness={0.5} metallic={0} />
        </mesh3D>
      ))}
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 4, 7] }}>
      <Stage />
    </Canvas>
  );
}
// #endregion result

/**
 * Three white spheres on a grey floor: a red point light on the left, a soft-edged blue spot light
 * shining straight down on the right, and a dim directional and ambient light over them all
 */
export const example: Example = {
  title: 'The four lights',
  camera: { position: [0, 4, 7] },
  render: () => <Stage />,
};
