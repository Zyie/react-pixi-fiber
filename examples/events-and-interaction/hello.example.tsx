// #region result
import { Canvas } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
function Box() {
  return (
    // #region box
    <mesh onClick={() => alert('Hello')}>
      <boxGeometry />
      <meshStandardMaterial color="royalblue" />
    </mesh>
    // #endregion box
  );
}

export function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Box />
    </Canvas>
  );
}
// #endregion result

/** A box that says hello when clicked */
export const example: Example = {
  title: 'A box that answers a click',
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Box />
    </>
  ),
};
