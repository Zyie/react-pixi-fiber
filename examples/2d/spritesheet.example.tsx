// #region result
import { useAsset } from '@react-fiber/2d';
import { Canvas, useTexture } from '@react-fiber/core';
import type { Spritesheet } from 'pixi.js';
import { Suspense } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region walker
function Walker() {
  const sheet = useAsset<Spritesheet>('/sprites/walk.json');

  return <animatedSprite2D args={[sheet.animations.walk]} playing animationSpeed={0.13} x={40} y={90} scale={4} />;
}
// #endregion walker

// #region picture
function Picture() {
  const texture = useTexture('/textures/quadrants.png');

  return <sprite2D texture={texture} x={220} y={90} width={128} height={128} />;
}
// #endregion picture

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Walker />
        <Picture />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/** A spritesheet's walk animation on its third frame, and a picture loaded with useTexture */
export const example: Example = {
  title: 'Textures and spritesheets',
  frames: 18,
  render: () => (
    <>
      <Walker />
      <Picture />
    </>
  ),
};
