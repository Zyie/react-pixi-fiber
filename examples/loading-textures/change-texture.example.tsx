import { Canvas, useTexture } from '@react-fiber/threejs-compat';
// #region result
import { useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
const textures = ['/textures/quadrants.png', '/textures/checker.png', '/textures/cube/pz.png'];

function Plane() {
  const [index, setIndex] = useState(0);
  const texture = useTexture(textures[index]);

  return (
    <mesh scale={2} onClick={() => setIndex((i) => (i + 1) % textures.length)}>
      <planeGeometry />
      <meshBasicMaterial transparent map={texture} />
    </mesh>
  );
}

useTexture.preload(textures);

export function App() {
  return (
    <Canvas>
      <Plane />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's ChangeTexture demo: `useTexture` with a URL that changes, from textures preloaded with
 * `useTexture.preload`. The demo changes it on a timer; this changes it on a click, and the picture is
 * taken after one, on the second texture.
 */
export const example: Example = {
  title: 'Changing a texture',
  render: () => <Plane />,
  act: async ({ mouse, frames }) => {
    await mouse.click(200, 150);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await frames(2);
  },
};
