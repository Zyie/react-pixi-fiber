// #region result
import { Texture } from 'pixi.js';
import { useRef, useState } from 'react';
import { Canvas } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
function Draggable() {
  const [position, setPosition] = useState<[number, number]>([100, 150]);
  const offset = useRef({ x: 0, y: 0 });

  return (
    // #region drag
    <sprite2D
      texture={Texture.WHITE}
      tint="orange"
      width={80}
      height={80}
      anchor={0.5}
      position={position}
      cursor="grab"
      onPointerDown={(event) => {
        event.target.setPointerCapture(event.pointerId);
        offset.current = { x: position[0] - event.global.x, y: position[1] - event.global.y };
      }}
      onPointerMove={(event) => {
        if (!event.target.hasPointerCapture(event.pointerId)) return;
        setPosition([event.global.x + offset.current.x, event.global.y + offset.current.y]);
      }}
      onPointerUp={(event) => event.target.releasePointerCapture(event.pointerId)}
    />
    // #endregion drag
  );
}

export function App() {
  return (
    <Canvas>
      <Draggable />
    </Canvas>
  );
}
// #endregion result

/** An orange square dragged from the left of the canvas to the right */
export const example: Example = {
  title: 'Dragging with pointer capture',
  render: () => <Draggable />,
  act: async ({ mouse, frames }) => {
    await mouse.move(110, 160);
    await mouse.down();
    await mouse.move(300, 120);
    await mouse.up();
    await frames();
  },
};
