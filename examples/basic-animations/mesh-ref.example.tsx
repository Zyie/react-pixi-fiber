// #region box
import type { Mesh } from '@react-fiber/threejs-compat/three';
import { useRef } from 'react';
// #endregion box

import type { Example } from '../example';

// #region box
function MyAnimatedBox() {
  const myMesh = useRef<Mesh>(null!);

  return (
    <mesh ref={myMesh}>
      <boxGeometry />
      <meshBasicMaterial color="royalblue" />
    </mesh>
  );
}
// #endregion box

export const example: Example = {
  title: 'A ref to the mesh',
  render: () => <MyAnimatedBox />,
};
