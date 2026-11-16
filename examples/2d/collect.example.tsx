// #region result
import { useAsset } from '@react-fiber/2d';
import { Canvas } from '@react-fiber/core';
import '@react-fiber/threejs-compat';
import type { AnimatedSprite, Spritesheet } from 'pixi.js';
import { Suspense, useRef, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region coin
function Coin({ x, onCollected }: { x: number; onCollected: () => void }) {
  const sheet = useAsset<Spritesheet>('/sprites/coin.json');
  const coin = useRef<AnimatedSprite>(null);
  const [collecting, setCollecting] = useState(false);
  const [collected, setCollected] = useState(false);

  return (
    <animatedSprite2D
      ref={coin}
      args={[sheet.animations.spin]}
      playing={!collected}
      loop={!collecting}
      animationSpeed={collecting ? 0.5 : 0.13}
      visible={!collected}
      anchor={0.5}
      x={x}
      y={150}
      scale={2}
      cursor="pointer"
      onClick={() => {
        coin.current!.gotoAndPlay(0);
        setCollecting(true);
      }}
      onComplete={() => {
        setCollected(true);
        onCollected();
      }}
    />
  );
}
// #endregion coin

function Game() {
  const [score, setScore] = useState(0);

  return (
    <>
      {[100, 200, 300].map((x) => (
        <Coin key={x} x={x} onCollected={() => setScore((value) => value + 1)} />
      ))}
      <text2D text={`Coins: ${score}`} x={20} y={20} style={{ fill: '#ffd166', fontFamily: 'Arial', fontSize: 24 }} />
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Game />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/** Three spinning coins; the middle one was clicked, spun once fast and was collected */
export const example: Example = {
  title: 'Click to collect',
  render: () => <Game />,
  act: async ({ mouse, frames }) => {
    await mouse.click(200, 150);
    await frames(24);
  },
};
