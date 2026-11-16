import type { TestScene } from '@test-scene';

/**
 * A 2D canvas with a colour background and antialiasing off: the scene's `background` clears the canvas
 * to dark blue, and `renderer={{ antialias: false }}` leaves the circle's and the turned square's edges
 * stepped.
 */
export const scene: TestScene = {
  canvas: { renderer: { antialias: false }, scene: { background: '#1d2433' } },
  render: () => (
    <>
      <graphics2D draw={(graphics) => graphics.circle(120, 150, 80).fill(0xf58231)} />
      <graphics2D x={290} y={150} angle={30} draw={(graphics) => graphics.rect(-60, -60, 120, 120).fill(0x46f0f0)} />
    </>
  ),
};
