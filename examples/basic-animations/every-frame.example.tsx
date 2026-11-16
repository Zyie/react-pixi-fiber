// #region box
import { useFrame } from '@react-fiber/threejs-compat';
// #endregion box

import type { Example } from '../example';

// #region box
function MyAnimatedBox() {
  useFrame(() => {
    console.log("I'm running every frame!");
  });

  return (
    <mesh>
      <boxGeometry />
      <meshBasicMaterial color="royalblue" />
    </mesh>
  );
}
// #endregion box

export const example: Example = {
  title: 'A callback every frame',
  render: () => <MyAnimatedBox />,
};
