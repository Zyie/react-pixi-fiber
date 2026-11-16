// #region result
import { PhongMaterial } from '@pixi/3d';
import { Canvas } from '@react-fiber/core';
import '@react-fiber/3d';
import { useEffect, useMemo } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Shapes() {
  // #region attach
  const shared = useMemo(() => new PhongMaterial({ baseColor: '#2a9d8f', shininess: 60 }), []);

  useEffect(() => () => shared.destroy(), [shared]);
  // #endregion attach

  return (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      {/* #region args */}
      <mesh3D position={[-2.2, 0.9, 0]}>
        <sphereGeometry3D args={[{ radius: 0.8, widthSegments: 48, heightSegments: 24 }]} />
        <material3D baseColor="#e76f51" roughness={0.4} />
      </mesh3D>
      {/* #endregion args */}
      {/* #region props */}
      <mesh3D position={[0, 0.9, 0]} angle={[30, 45, 0]} scale={0.8}>
        <cubeGeometry3D />
        <material3D baseColor="hotpink" roughness={0.8} metallic={0} />
      </mesh3D>
      {/* #endregion props */}
      {/* #region pierce */}
      <mesh3D position-x={2.2} position-y={0.9} scale-y={1.6} rotation-z={0.3}>
        <cylinderGeometry3D args={[{ radiusTop: 0.4, radiusBottom: 0.4, height: 1 }]} />
        <material3D baseColor="#e9c46a" />
      </mesh3D>
      {/* #endregion pierce */}
      {/* #region attach */}
      <mesh3D position={[-1.1, -1.2, 0]} angle={[20, 30, 0]}>
        <torusGeometry3D args={[{ radius: 0.6, tube: 0.22 }]} />
        <primitive object={shared} attach="material" />
      </mesh3D>
      <mesh3D position={[1.1, -1.2, 0]} angle={[20, -30, 0]}>
        <coneGeometry3D args={[{ radius: 0.6, height: 1.2 }]} />
        <primitive object={shared} attach="material" />
      </mesh3D>
      {/* #endregion attach */}
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 0, 7] }}>
      <Shapes />
    </Canvas>
  );
}
// #endregion result

/**
 * A sphere built from an options object, a pink cube turned and scaled by its props, a yellow
 * cylinder set through pierced props, and a torus and a cone sharing one green material they attach
 */
export const example: Example = {
  title: 'Args, props and attach',
  camera: { position: [0, 0, 7] },
  render: () => <Shapes />,
};
