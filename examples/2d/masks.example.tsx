// #region result
import { useAsset } from '@react-fiber/2d';
import { Canvas, useTexture } from '@react-fiber/core';
import '@react-fiber/threejs-compat';
import type { Graphics, Spritesheet } from 'pixi.js';
import { Suspense, useRef } from 'react';
import type { RefObject } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region inverse
const drawDark = (graphics: Graphics) => graphics.rect(0, 0, 400, 300).fill({ color: '#05050a', alpha: 0.92 });
const drawSpot = (graphics: Graphics) => graphics.circle(0, 0, 70).fill('white');

function Darkness({ spot }: { spot: RefObject<Graphics | null> }) {
  return (
    <container2D mask={{ inverse: true }}>
      <graphics2D draw={drawDark} />
      <graphics2D ref={spot} attach="mask" x={200} y={150} draw={drawSpot} />
    </container2D>
  );
}
// #endregion inverse

function Spotlight() {
  const bricks = useTexture('/textures/bricks.png');
  const sheet = useAsset<Spritesheet>('/sprites/coin.json');
  const spot = useRef<Graphics>(null);

  return (
    <>
      <tilingSprite2D
        texture={bricks}
        width={400}
        height={300}
        onPointerMove={(event) => spot.current!.position.copyFrom(event.global)}
      />
      <animatedSprite2D args={[sheet.animations.spin]} playing animationSpeed={0.15} x={250} y={110} scale={1.5} />
      <Darkness spot={spot} />
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Spotlight />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/** A spotlight that follows the pointer: darkness with an inverse circle mask, which reveals a hidden coin */
export const example: Example = {
  title: 'A spotlight mask',
  render: () => <Spotlight />,
  act: async ({ mouse, frames }) => {
    await mouse.move(270, 140);
    await frames();
  },
};
