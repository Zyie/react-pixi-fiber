import type { TestScene } from '@test-scene';
import type { GraphicsContext } from 'pixi.js';
import { useState } from 'react';

const HOUSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="20" y="45" width="60" height="45" fill="#f5d020" />
  <polygon points="10,50 50,12 90,50" fill="#e6194b" />
  <rect x="42" y="62" width="16" height="28" fill="#4363d8" />
  <circle cx="68" cy="58" r="6" fill="#ffffff" stroke="#000000" stroke-width="2" />
</svg>`;

const drawStar = (context: GraphicsContext) => context.star(0, 0, 5, 30, 14).fill(0xffffff);
const drawHeart = (context: GraphicsContext) =>
  context.moveTo(0, 28).bezierCurveTo(-40, 0, -24, -30, 0, -12).bezierCurveTo(24, -30, 40, 0, 0, 28).fill(0xffffff);

const TINTS = [0xe6194b, 0x3cb44b, 0x4363d8];

/** Three graphics sharing one context element, kept in state, whose `draw` the act swaps */
function Badges({ heart }: { heart: boolean }) {
  const [badge, setBadge] = useState<GraphicsContext | null>(null);

  return (
    <container2D x={220} y={60}>
      <graphicsContext2D ref={setBadge} draw={heart ? drawHeart : drawStar} />
      {TINTS.map((tint, i) => (
        <graphics2D key={tint} context={badge ?? undefined} tint={tint} x={i * 60} scale={1 - i * 0.2} />
      ))}
    </container2D>
  );
}

/**
 * SVG and shared contexts. Left: a house parsed from SVG by `graphics.svg()` in a `draw` callback, at
 * full size and again at half size. Right: one `<graphicsContext2D>`, which isn't drawn on its own, is
 * the `context` of three graphics tinted red, green and blue at shrinking scales; `act` swaps its
 * `draw` from a star to a heart, and all three redraw as hearts.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <graphics2D x={10} y={40} draw={(graphics) => graphics.svg(HOUSE)} scale={1.6} />
      <graphics2D x={20} y={210} draw={(graphics) => graphics.svg(HOUSE)} scale={0.8} />
      <Badges heart={false} />
    </>
  ),
  act: async ({ update }) => {
    await update(
      <>
        <graphics2D x={10} y={40} draw={(graphics) => graphics.svg(HOUSE)} scale={1.6} />
        <graphics2D x={20} y={210} draw={(graphics) => graphics.svg(HOUSE)} scale={0.8} />
        <Badges heart />
      </>,
    );
  },
};
