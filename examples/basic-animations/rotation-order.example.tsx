// #region result
import { Canvas, useFrame } from '@react-fiber/threejs-compat';
import type { Mesh } from '@react-fiber/threejs-compat/three';
import { useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Tumbler({ position, order }: { position: [number, number, number]; order: 'XYZ' | 'YXZ' }) {
  const myMesh = useRef<Mesh>(null!);

  useFrame((state) => {
    myMesh.current.rotation.set(state.elapsed, state.elapsed, 0, order);
  });

  return (
    <mesh ref={myMesh} position={position}>
      <boxGeometry />
      <meshStandardMaterial color="royalblue" />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={1.5} />
      <Tumbler position={[-1.2, 0, 0]} order="XYZ" />
      <Tumbler position={[1.2, 0, 0]} order="YXZ" />
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

/** Both boxes at the same angles, three quarters of a second in, turned in different orders */
export const example: Example = {
  title: 'Rotation order',
  frames: 46,
  render: () => <Scene />,
};
