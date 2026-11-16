// #region result
import { FlatMaterial, Mesh3D, TorusGeometry } from '@pixi/3d';
import type { Container3D } from '@pixi/3d';
import { Canvas, useFrame } from '@react-fiber/core';
import '@react-fiber/3d';
import { useEffect, useMemo, useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region nesting
function Planet() {
  const orbit = useRef<Container3D>(null);

  useFrame((_, delta) => {
    orbit.current!.rotation.y += delta;
  });

  return (
    <container3D ref={orbit}>
      <mesh3D position={[2.2, 0, 0]} scale={0.45}>
        <sphereGeometry3D />
        <material3D baseColor="#4f86f7" roughness={0.7} />
        <mesh3D position={[1.8, 0, 0]} scale={0.35}>
          <sphereGeometry3D />
          <material3D baseColor="#d9d9d9" roughness={0.9} />
        </mesh3D>
      </mesh3D>
    </container3D>
  );
}
// #endregion nesting

// #region primitive
function Ring() {
  const ring = useMemo(
    () =>
      new Mesh3D({
        geometry: new TorusGeometry({ radius: 1.4, tube: 0.04, tubularSegments: 96 }),
        material: new FlatMaterial({ baseColor: '#e9c46a' }),
      }),
    [],
  );

  useEffect(() => () => ring.destroy({ children: true }), [ring]);

  return <primitive object={ring} angle={[80, 0, 0]} />;
}
// #endregion primitive

function System() {
  return (
    <>
      <ambientLight3D intensity={0.25} />
      <pointLight3D intensity={20} range={10} />
      <mesh3D scale={0.8}>
        <sphereGeometry3D />
        <flatMaterial3D baseColor="#f4a261" />
      </mesh3D>
      <Ring />
      <Planet />
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 2.5, 5] }}>
      <System />
    </Canvas>
  );
}
// #endregion result

/**
 * An unlit orange sun lighting a blue planet and its grey moon, nested so the moon follows the planet
 * as an orbit container turns them both, inside a ring built in code and added as a `<primitive>`
 */
export const example: Example = {
  title: 'Nesting nodes and primitives',
  camera: { position: [0, 2.5, 5] },
  frames: 40,
  render: () => <System />,
};
