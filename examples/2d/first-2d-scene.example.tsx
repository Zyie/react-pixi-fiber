import { Canvas, useFrame } from '@react-fiber/core';
// #region result
import { Texture } from 'pixi.js';
import type { Sprite } from 'pixi.js';
import { useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Spinner() {
  const sprite = useRef<Sprite>(null);

  useFrame((_, delta) => {
    sprite.current!.rotation += delta;
  });

  return (
    <sprite2D
      ref={sprite}
      texture={Texture.WHITE}
      tint="royalblue"
      width={100}
      height={100}
      anchor={0.5}
      x={200}
      y={150}
    />
  );
}

function Scene() {
  return (
    <>
      <graphics2D draw={(graphics) => graphics.roundRect(20, 20, 360, 260, 16).stroke({ width: 4, color: 'white' })} />
      <text2D text="Hello 2D" x={40} y={36} style={{ fill: 'white', fontSize: 28, fontFamily: 'Arial' }} />
      <Spinner />
    </>
  );
}

export function App() {
  return (
    <div id="canvas-container">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
// #endregion result

/** A white frame, a line of text and a blue square that turns a radian a second, here after half a second */
export const example: Example = {
  title: 'A first 2D scene',
  frames: 31,
  render: () => <Scene />,
};
