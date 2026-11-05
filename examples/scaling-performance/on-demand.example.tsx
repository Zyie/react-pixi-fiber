// #region result
import { useRef, useState } from 'react';
import { Canvas, useThree } from 'react-pixi-fiber';
import type { Mesh } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
function Box() {
  const mesh = useRef<Mesh>(null!);
  const invalidate = useThree((state) => state.invalidate);
  const [active, setActive] = useState(false);

  return (
    <mesh
      ref={mesh}
      rotation={[0.4, 0.6, 0]}
      scale={active ? 1.4 : 1}
      onClick={() => setActive(!active)}
      onContextMenu={(e) => {
        e.nativeEvent.preventDefault();
        // #region invalidate
        mesh.current.rotation.y += Math.PI / 4;
        invalidate();
        // #endregion invalidate
      }}
    >
      <boxGeometry />
      <meshStandardMaterial color="royalblue" />
    </mesh>
  );
}

export function App() {
  return (
    // #region demand
    <Canvas frameloop="demand">
      {/* #endregion demand */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Box />
    </Canvas>
  );
}
// #endregion result

/**
 * A scene that draws only when something changes: a click changes a prop, which React renders and r3f
 * draws; a right click turns the box through its ref, which React can't see, so it calls `invalidate()`
 * for a frame. The box has been clicked once and right-clicked once.
 */
export const example: Example = {
  title: 'Rendering on demand',
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Box />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(200, 150);
    await mouse.contextMenu(200, 150);
    await frames();
  },
};
