import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';

/**
 * `<graphics2D>` with a `draw` prop, nested in a `<container2D>` that moves it: a red rectangle, a blue
 * circle and a yellow outlined rounded rectangle on top, a green star and a translucent purple triangle
 * below, in CSS pixels from the canvas's top-left corner.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => (
    <container2D x={40} y={30}>
      <graphics2D
        draw={(graphics) => {
          graphics.rect(0, 0, 120, 80).fill(0xe8453c);
          graphics.circle(200, 40, 40).fill(0x3cb4e8);
          graphics.roundRect(260, 0, 60, 80, 12).stroke({ width: 4, color: 0xf5d020 });
        }}
      />
      <graphics2D
        y={120}
        draw={(graphics) => {
          graphics.star(60, 60, 5, 55).fill(0x7ad151);
          graphics.poly([160, 110, 220, 10, 280, 110]).fill({ color: 0xb05cf0, alpha: 0.8 });
        }}
      />
    </container2D>
  ),
};
