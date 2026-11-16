import { useFrame } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { GraphicsContext } from 'pixi.js';
import { useMemo, useState } from 'react';

/** A bar that grows 4 pixels a frame from 40: its `draw` callback is new every frame, so it runs again */
function GrowingBar() {
  const [frame, setFrame] = useState(0);
  useFrame(() => setFrame((count) => count + 1));

  return <graphics2D x={20} y={30} draw={(graphics) => graphics.rect(0, 0, 40 + frame * 4, 40).fill(0x3cb4e8)} />;
}

/** Three graphics drawing one shared context, passed as `args` */
function Shared() {
  const context = useMemo(() => new GraphicsContext().circle(0, 0, 24).fill(0xf28c28), []);

  return (
    <>
      {[60, 140, 220].map((x) => (
        <graphics2D key={x} args={[context]} x={x} y={150} />
      ))}
    </>
  );
}

/**
 * Graphics over frames and shared contexts. The blue bar grows by 4 pixels on each of 20 frames,
 * since a new `draw` callback clears the graphics and draws it again: it ends 120 pixels wide. Three
 * orange circles share one `GraphicsContext` from `args`. A `<graphicsContext2D attach="context">`
 * swaps the green star's own context for one drawn by its `draw` prop.
 */
export const scene: TestScene = {
  frames: 20,
  render: () => (
    <>
      <GrowingBar />
      <Shared />
      <graphics2D x={320} y={150}>
        <graphicsContext2D attach="context" draw={(context) => context.star(0, 0, 5, 40).fill(0x7ad151)} />
      </graphics2D>
    </>
  ),
};
