// #region result
import type { AnimatedSprite, Spritesheet } from 'pixi.js';
import { Suspense, useRef } from 'react';
import { Canvas, useAsset, useFrame, useTexture } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
// #region walker
function Walker() {
  const sheet = useAsset<Spritesheet>('/sprites/walk.json');
  const sprite = useRef<AnimatedSprite>(null);

  useFrame((state) => {
    sprite.current!.currentFrame = Math.floor(state.elapsed * 8) % sprite.current!.totalFrames;
  });

  return <animatedSprite2D ref={sprite} args={[sheet.animations.walk]} x={40} y={90} scale={4} />;
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
