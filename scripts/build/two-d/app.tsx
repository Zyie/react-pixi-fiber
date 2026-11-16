import { Canvas, useAsset, useFrame } from '@react-fiber/core';
import type { FiberEvent2D } from '@react-fiber/core';
import '@react-fiber/2d';
import { Texture } from 'pixi.js';
import type { Sprite } from 'pixi.js';
import { Suspense, useRef } from 'react';
import { createRoot } from 'react-dom/client';

function Bunny() {
  const texture = useAsset<Texture>('/bunny.png');
  const sprite = useRef<Sprite>(null);

  useFrame((_, delta) => {
    sprite.current!.rotation += delta;
  });

  return <sprite2D ref={sprite} texture={texture} anchor={0.5} x={200} y={150} />;
}

function App() {
  return (
    <Canvas>
      <graphics2D draw={(graphics) => graphics.roundRect(20, 20, 120, 60, 12).fill(0xf58231)} />
      <sprite2D
        texture={Texture.WHITE}
        tint="orange"
        width={40}
        height={40}
        onClick={(event: FiberEvent2D<MouseEvent>) => event.object.position.set(event.point.x, event.point.y)}
      >
        <blurFilter2D attach="filters-0" args={[{ strength: 2 }]} />
      </sprite2D>
      <text2D text="2D alone" x={20} y={100} style={{ fill: 'white', fontSize: 18 }} />
      <Suspense fallback={null}>
        <Bunny />
      </Suspense>
    </Canvas>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
