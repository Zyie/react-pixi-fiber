// #region fog
import { useRef } from 'react';
import { useFrame } from 'react-pixi-fiber';
import type { Fog } from 'react-pixi-fiber/three';
// #endregion fog

import type { Example } from '../example';

const COLUMNS = Array.from({ length: 24 }, (_, index) => ({
  x: ((index * 7) % 9) - 4,
  z: -Math.floor(index / 3) * 2.5,
  height: 0.6 + ((index * 5) % 4) * 0.5,
}));

// #region fog
function Haze() {
  const fog = useRef<Fog>(null!);

  useFrame(({ elapsed }) => {
    fog.current.far = 12 + Math.sin(elapsed) * 6;
  });

  return (
    <>
      <color attach="background" args={['#202030']} />
      <fog ref={fog} attach="fog" args={['#202030', 2, 12]} />
    </>
  );
}
// #endregion fog

function City() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      {COLUMNS.map(({ x, z, height }, index) => (
        <mesh key={index} position={[x, height / 2 - 1, z]}>
          <boxGeometry args={[0.8, height, 0.8]} />
          <meshStandardMaterial color="#e8a33d" />
        </mesh>
      ))}
    </>
  );
}

/**
 * r3f's Fog demo, with three's `Fog` in place of its node-based fog: towers fade into a background of
 * the fog's colour, and the fog's far edge breathes in and out as the scene runs
 */
export const example: Example = {
  title: 'Fog that changes as the scene runs',
  frames: 30,
  camera: { position: [0, 1.5, 6] },
  render: () => (
    <>
      <Haze />
      <City />
    </>
  ),
};
