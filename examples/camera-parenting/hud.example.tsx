// #region hud
import { Portal, useThree } from '@react-fiber/threejs-compat';
import type { Group } from '@react-fiber/threejs-compat/three';
import { useEffect, useRef } from 'react';
// #endregion hud

import type { Example } from '../example';

// #region hud
function HUD() {
  const { camera } = useThree();
  const hudRef = useRef<Group>(null);

  useEffect(() => {
    const hud = hudRef.current;
    if (!hud) return;
    camera.add(hud);
    return () => void camera.remove(hud);
  }, [camera]);

  return (
    <group ref={hudRef} position={[0, -0.6, -2]}>
      <mesh>
        <planeGeometry args={[0.5, 0.1]} />
        <meshBasicMaterial color="green" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function Reticle() {
  const { camera } = useThree();

  return (
    <Portal container={camera}>
      <mesh position={[0, 0, -2]}>
        <sphereGeometry args={[0.03, 16, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </Portal>
  );
}
// #endregion hud

/** A green bar added to the camera with `camera.add` and a white dot portalled into it, both fixed on screen over a turned box */
export const example: Example = {
  title: 'Objects that follow the camera',
  frames: 2,
  camera: { position: [3, 2, 5] },
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <mesh>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#f0ad4e" />
      </mesh>
      <HUD />
      <Reticle />
    </>
  ),
};
