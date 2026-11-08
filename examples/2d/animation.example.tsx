// #region result
import { Texture } from 'pixi.js';
import type { Sprite } from 'pixi.js';
import { useRef, useState } from 'react';
import { Canvas, useFrame } from 'react-pixi-fiber';
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
  const [radius, setRadius] = useState(20);

  useFrame((state) => setRadius(40 + Math.sin(state.elapsed * 3) * 20));

  return <graphics2D x={280} y={150} draw={(graphics) => graphics.circle(0, 0, radius).fill('royalblue')} />;
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
