// #region result
import { Canvas } from '@react-fiber/core';
import '@react-fiber/2d';
import { FillGradient, GraphicsContext } from 'pixi.js';
import type { Graphics } from 'pixi.js';
// #endregion result

import type { Example } from '../example';

// #region result
// #region gradients
const SKY = new FillGradient({
  type: 'linear',
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
  colorStops: [
    { offset: 0, color: '#0b1026' },
    { offset: 1, color: '#3b2667' },
  ],
});

const HILLS = new FillGradient({
  type: 'linear',
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
  colorStops: [
    { offset: 0, color: '#2a9d8f' },
    { offset: 1, color: '#14423c' },
  ],
});
// #endregion gradients

// #region holes
const drawMoon = (graphics: Graphics) =>
  graphics.circle(0, 0, 34).fill('#f4f1de').circle(-11, -9, 8).cut().circle(12, 4, 10).cut().circle(-6, 17, 5).cut();

function Moon() {
  return <graphics2D x={300} y={70} draw={drawMoon} />;
}
// #endregion holes

// #region context
const STAR = new GraphicsContext().star(0, 0, 4, 5, 2).fill('#fff6c2');

const STARS = [
  [40, 40, 1],
  [110, 70, 0.6],
  [170, 30, 0.8],
  [240, 90, 0.5],
  [345, 150, 1.1],
  [360, 110, 0.7],
  [70, 120, 0.5],
  [210, 140, 0.9],
] as const;

function Stars() {
  return (
    <>
      {STARS.map(([x, y, scale]) => (
        <graphics2D key={`${x},${y}`} context={STAR} x={x} y={y} scale={scale} />
      ))}
    </>
  );
}
// #endregion context

function Night() {
  return (
    <>
      <graphics2D draw={(graphics) => graphics.rect(0, 0, 400, 300).fill(SKY)} />
      <Stars />
      <Moon />
      <graphics2D
        draw={(graphics) =>
          graphics
            .moveTo(0, 230)
            .bezierCurveTo(90, 170, 170, 260, 260, 210)
            .bezierCurveTo(320, 180, 370, 200, 400, 190)
            .lineTo(400, 300)
            .lineTo(0, 300)
            .fill(HILLS)
        }
      />
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Night />
    </Canvas>
  );
}
// #endregion result

/** A night sky: gradient fills, a moon with craters cut from it, and stars sharing one context */
export const example: Example = {
  title: 'A night sky in graphics',
  render: () => <Night />,
};
