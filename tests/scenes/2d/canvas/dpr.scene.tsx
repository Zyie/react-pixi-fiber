import { useThree } from '@react-fiber/core';
import type { TestScene } from '@test-scene';

/** What `useThree` reports of the canvas: its CSS size and its pixel ratio */
function Readout() {
  const { size, viewport } = useThree();

  return (
    <text2D
      text={`${size.width} x ${size.height} at ${viewport.dpr}x`}
      x={10}
      y={10}
      style={{ fill: 'white', fontSize: 14, fontFamily: 'Arial' }}
    />
  );
}

/**
 * A canvas of 200 by 150 CSS pixels at a pixel ratio of 2, so 400 by 300 device pixels, captured at its
 * CSS size. 2D stays in CSS pixels: the white frame is 1 pixel wide, 5 from the sides. The text is
 * rasterized at the canvas's resolution, which a capture at CSS size can't show; a unit test in
 * `tests/unit/two-d.test.tsx` holds it. The readout, from `useThree`, says "200 x 150 at 2x".
 */
export const scene: TestScene = {
  size: { width: 200, height: 150, dpr: 2 },
  render: () => (
    <>
      <graphics2D draw={(graphics) => graphics.rect(5, 35, 190, 110).stroke({ width: 1, color: 0xffffff })} />
      <graphics2D draw={(graphics) => graphics.circle(100, 90, 40).fill(0x4363d8)} />
      <text2D text="sharp" anchor={0.5} x={100} y={90} style={{ fill: 'white', fontSize: 20, fontFamily: 'Arial' }} />
      <Readout />
    </>
  ),
};
