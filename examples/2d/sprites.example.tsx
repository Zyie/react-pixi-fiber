// #region result
import { useAsset } from '@react-fiber/2d';
import { Canvas, useFrame, useTexture } from '@react-fiber/core';
import '@react-fiber/threejs-compat';
import type { Spritesheet, TilingSprite } from 'pixi.js';
import { Suspense, useMemo, useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region tiling
function Floor() {
  const texture = useTexture('/textures/bricks.png');
  const floor = useRef<TilingSprite>(null);

  useFrame((_, delta) => {
    floor.current!.tilePosition.x -= delta * 60;
  });

  return <tilingSprite2D ref={floor} texture={texture} y={236} width={400} height={64} />;
}
// #endregion tiling

// #region nine-slice
function Frame() {
  const texture = useTexture('/textures/panel.png');
  const slices = useMemo(
    () => ({ texture, leftWidth: 14, topHeight: 14, rightWidth: 14, bottomHeight: 14 }),
    [texture],
  );

  return <nineSliceSprite2D args={[slices]} x={30} y={40} width={340} height={150} />;
}
// #endregion nine-slice

// #region coins
function Coins() {
  const sheet = useAsset<Spritesheet>('/sprites/coin.json');

  return (
    <>
      {[0.1, 0.15, 0.2, 0.25].map((speed, i) => (
        <animatedSprite2D
          key={speed}
          args={[sheet.animations.spin]}
          playing
          animationSpeed={speed}
          anchor={0.5}
          x={80 + i * 80}
          y={115}
          scale={1.5}
        />
      ))}
    </>
  );
}
// #endregion coins

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Floor />
        <Frame />
        <Coins />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/** Four coins spinning at their own speeds in a nine-slice frame, over a scrolling tiled floor */
export const example: Example = {
  title: 'Sprites, tiling and nine-slice',
  frames: 20,
  render: () => (
    <>
      <Floor />
      <Frame />
      <Coins />
    </>
  ),
};
