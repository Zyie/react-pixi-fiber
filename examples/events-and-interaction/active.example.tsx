// #region result
import { Canvas } from '@react-fiber/threejs-compat';
import { useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Box() {
  // #region state
  const [active, setActive] = useState(false);
  // #endregion state

  return (
    // #region box
    <mesh scale={active ? 1.5 : 1} onClick={() => setActive(!active)}>
      <boxGeometry />
      <meshPhongMaterial color="royalblue" />
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

/** The box after one click: active, and half as big again */
export const example: Example = {
  title: 'A box that grows when clicked',
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Box />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(200, 150);
    await frames();
  },
};
