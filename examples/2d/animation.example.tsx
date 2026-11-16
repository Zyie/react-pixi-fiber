// #region result
import { Canvas, useFrame } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/threejs-compat';
import { Texture } from 'pixi.js';
import type { Graphics, Sprite } from 'pixi.js';
import { useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region ref
function Bobbing() {
  const sprite = useRef<Sprite>(null);

  useFrame((state) => {
    sprite.current!.y = 150 + Math.sin(state.elapsed * 4) * 60;
    sprite.current!.rotation += 0.05;
  });

  return <sprite2D ref={sprite} texture={Texture.WHITE} tint="hotpink" width={60} height={60} anchor={0.5} x={120} />;
}
// #endregion ref

// #region draw
function Pulse() {
  const graphics = useRef<Graphics>(null);

  useFrame((state) => {
    const radius = 40 + Math.sin(state.elapsed * 3) * 20;
    graphics.current!.clear().circle(0, 0, radius).fill('royalblue');
  });

  return <graphics2D ref={graphics} x={280} y={150} />;
}
// #endregion draw

export function App() {
  return (
    <Canvas>
      <Bobbing />
      <Pulse />
    </Canvas>
  );
}
// #endregion result

/** A pink square bobbing and turning, moved through its ref, and a blue circle redrawn each frame */
export const example: Example = {
  title: 'Animating 2D with useFrame',
  frames: 25,
  render: () => (
    <>
      <Bobbing />
      <Pulse />
    </>
  ),
};
