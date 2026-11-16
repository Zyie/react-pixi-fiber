// #region result
import { useAsset } from '@react-fiber/2d';
import { Canvas, useFrame } from '@react-fiber/core';
import '@react-fiber/threejs-compat';
import { GraphicsContext } from 'pixi.js';
import type { Spritesheet, AnimatedSprite } from 'pixi.js';
import { Suspense, useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
const TILE = new GraphicsContext().roundRect(0, 0, 36, 36, 8).fill('#1d3557').circle(18, 18, 8).fill('#457b9d');

// #region cached
function Board() {
  return (
    <container2D cacheAsTexture x={20} y={20}>
      {Array.from({ length: 70 }, (_, i) => (
        <graphics2D key={i} context={TILE} x={(i % 10) * 36} y={Math.floor(i / 10) * 36} />
      ))}
    </container2D>
  );
}
// #endregion cached

function Runner() {
  const sheet = useAsset<Spritesheet>('/sprites/coin.json');
  const coin = useRef<AnimatedSprite>(null);

  useFrame((state) => {
    coin.current!.x = 200 + Math.cos(state.elapsed * 2) * 140;
    coin.current!.y = 146 + Math.sin(state.elapsed * 3) * 90;
  });

  return <animatedSprite2D ref={coin} args={[sheet.animations.spin]} playing animationSpeed={0.2} anchor={0.5} />;
}

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Board />
        <Runner />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/** Seventy tiles drawn once into a cached texture, with a coin moving over them every frame */
export const example: Example = {
  title: 'A board cached as a texture',
  frames: 20,
  render: () => (
    <>
      <Board />
      <Runner />
    </>
  ),
};
