import { Canvas } from '@react-fiber/core';
// #region result
import { Texture } from 'pixi.js';
import { useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region button
function Button({ x }: { x: number }) {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  return (
    <sprite2D
      texture={Texture.WHITE}
      tint={hovered ? 'hotpink' : 'royalblue'}
      width={active ? 120 : 80}
      height={active ? 120 : 80}
      anchor={0.5}
      x={x}
      y={150}
      cursor="pointer"
      onClick={(event) => {
        event.stopPropagation();
        setActive(!active);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    />
  );
}
// #endregion button

export function App() {
  return (
    <Canvas>
      <Button x={120} />
      <Button x={280} />
    </Canvas>
  );
}
// #endregion result

/** Two squares; the right one was clicked and is still under the pointer, so it is big and pink */
export const example: Example = {
  title: 'Squares that react to the pointer',
  render: () => (
    <>
      <Button x={120} />
      <Button x={280} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(280, 150);
    await frames();
  },
};
