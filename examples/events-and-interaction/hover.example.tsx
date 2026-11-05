// #region result
import { useState } from 'react';
import { Canvas } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
function Box(props: { position: [number, number, number] }) {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  return (
    // #region box
    <mesh
      {...props}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry />
      <meshPhongMaterial color={hovered ? 'hotpink' : 'royalblue'} />
    </mesh>
    // #endregion box
  );
}

export function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />
    </Canvas>
  );
}
// #endregion result

/** Two boxes; the pointer rests on the right one, which turns pink */
export const example: Example = {
  title: 'Boxes that light up under the pointer',
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(277, 150);
    await frames();
  },
};
