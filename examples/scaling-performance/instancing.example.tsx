// #region result
import { useEffect, useRef } from 'react';
import { Canvas } from 'react-pixi-fiber';
import { MathUtils, Object3D } from 'react-pixi-fiber/three';
import type { InstancedMesh } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
// #region instances
function Instances({ count = 2000, temp = new Object3D() }) {
  const instancedMeshRef = useRef<InstancedMesh>(null!);

  useEffect(() => {
    MathUtils.seededRandom(1);
    for (let i = 0; i < count; i++) {
      temp.position.set(MathUtils.seededRandom() - 0.5, MathUtils.seededRandom() - 0.5, MathUtils.seededRandom() - 0.5);
      temp.position.multiplyScalar(5);
      temp.rotation.set(MathUtils.seededRandom() * Math.PI, MathUtils.seededRandom() * Math.PI, 0);
      temp.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, temp.matrix);
    }
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, temp]);

  return (
    <instancedMesh ref={instancedMeshRef} args={[null, null, count]}>
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}
// #endregion instances

export function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Instances />
    </Canvas>
  );
}
// #endregion result

/**
 * Two thousand boxes in one draw: one `instancedMesh`, each instance placed with `setMatrixAt` from a
 * helper `Object3D`, scattered through a cube by a seeded random so every run draws the same picture
 */
export const example: Example = {
  title: 'Instancing',
  render: () => (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Instances />
    </>
  ),
};
