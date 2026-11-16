import { Canvas, useFrame } from '@react-fiber/threejs-compat';
import type { Mesh } from '@react-fiber/threejs-compat/three';
// #region result
import { useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function SwingingBox() {
  const myMesh = useRef<Mesh>(null!);

  useFrame((state) => {
    myMesh.current.rotation.x = Math.sin(state.elapsed);
  });

  return (
    <mesh ref={myMesh}>
      <boxGeometry />
      <meshBasicMaterial color="royalblue" />
    </mesh>
  );
}

export function App() {
  return (
    <Canvas>
      <SwingingBox />
    </Canvas>
  );
}
// #endregion result

/** The box a second in, swung to `sin(1)` radians */
export const example: Example = {
  title: 'A swinging box',
  frames: 61,
  render: () => <SwingingBox />,
};
