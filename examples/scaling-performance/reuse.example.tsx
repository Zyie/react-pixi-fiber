// #region result
import { Canvas } from 'react-pixi-fiber';
import { MeshStandardMaterial, SphereGeometry } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
// #region shared
const red = new MeshStandardMaterial({ color: 'red' });
const sphere = new SphereGeometry(1, 28, 28);

function Scene() {
  return (
    <>
      <mesh geometry={sphere} material={red} />
      <mesh position={[1, 2, -3]} geometry={sphere} material={red} />
      {/* #endregion shared */}
      <mesh position={[-2.2, -0.6, -1]} geometry={sphere} material={red} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  );
}
// #endregion result

/** Three spheres from one geometry and one material, made once outside the components and shared */
export const example: Example = {
  title: 'Sharing geometries and materials',
  render: () => <Scene />,
};
