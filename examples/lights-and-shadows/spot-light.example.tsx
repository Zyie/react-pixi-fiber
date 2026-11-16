// #region spot
import type { Mesh, SpotLight } from '@react-fiber/threejs-compat/three';
import { useLayoutEffect, useRef } from 'react';
// #endregion spot

import type { Example } from '../example';

// #region spot
function Spot() {
  const light = useRef<SpotLight>(null!);
  const ball = useRef<Mesh>(null!);

  useLayoutEffect(() => {
    light.current.target = ball.current;
  }, []);

  return (
    <>
      <spotLight ref={light} position={[-2, 4, 2]} angle={0.4} penumbra={0.4} intensity={60} castShadow />
      <mesh ref={ball} position={[0.5, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.5, 48, 24]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    </>
  );
}
// #endregion spot

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#c8c8c8" />
    </mesh>
  );
}

/** A soft-edged spot light aimed at a ball in the scene, which casts its shadow across the pool */
export const example: Example = {
  title: 'A spot light aimed at its target',
  camera: { position: [3, 4, 6] },
  canvas: { renderer: { shadows: true } },
  render: () => (
    <>
      <ambientLight intensity={0.1} />
      <Spot />
      <Floor />
    </>
  ),
};
