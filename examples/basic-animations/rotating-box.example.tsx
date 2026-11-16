import { Canvas, useFrame } from '@react-fiber/threejs-compat';
import type { Mesh } from '@react-fiber/threejs-compat/three';
// #region result
import { useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function MyAnimatedBox() {
  const myMesh = useRef<Mesh>(null!);

  // #region frame
  useFrame((state) => {
    myMesh.current.rotation.x = state.elapsed;
  });
  // #endregion frame

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
      <MyAnimatedBox />
    </Canvas>
  );
}
// #endregion result

/** The box after three quarters of a second: turned 0.75 radians about x */
export const example: Example = {
  title: 'A box turning with useFrame',
  frames: 46,
  render: () => <MyAnimatedBox />,
};
