// #region result
import { Canvas } from '@react-fiber/core';
import '@react-fiber/3d';
// #endregion result

import type { Example } from '../example';

// #region result
function Swatches() {
  return (
    <>
      <ambientLight3D intensity={0.2} />
      <directionalLight3D angle={[-30, 40, 0]} intensity={3} />
      {/* #region materials */}
      <mesh3D position={[-2.2, 0.8, 0]}>
        <sphereGeometry3D />
        <material3D baseColor="#d0402b" roughness={0.3} metallic={0} />
      </mesh3D>
      <mesh3D position={[0, 0.8, 0]}>
        <sphereGeometry3D />
        <phongMaterial3D baseColor="#3fae5a" shininess={80} specularStrength={1} />
      </mesh3D>
      <mesh3D position={[2.2, 0.8, 0]}>
        <sphereGeometry3D />
        <flatMaterial3D baseColor="#3d7fe8" />
      </mesh3D>
      {/* #endregion materials */}
      {/* #region features */}
      <mesh3D position={[-1.1, -1.4, 0]} scale={0.6}>
        <sphereGeometry3D />
        <material3D args={[{ emissive: { color: '#ff7a1a', strength: 1 } }]} baseColor="#222222" metallic={0} />
      </mesh3D>
      <mesh3D position={[1.1, -1.4, 0]} scale={0.6}>
        <sphereGeometry3D />
        <material3D baseColor="#c0c0c0" roughness={0.2} metallic={1} />
      </mesh3D>
      {/* #endregion features */}
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 0, 7] }}>
      <Swatches />
    </Canvas>
  );
}
// #endregion result

/**
 * A red physically based sphere, a shiny green Phong sphere and a flat blue unlit one on top; under
 * them a dark sphere glowing orange from its emissive colour, and a metal one
 */
export const example: Example = {
  title: 'Materials',
  camera: { position: [0, 0, 7] },
  render: () => <Swatches />,
};
