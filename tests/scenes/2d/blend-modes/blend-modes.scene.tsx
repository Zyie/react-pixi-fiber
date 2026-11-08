import 'pixi.js/advanced-blend-modes';
import type { TestScene } from '@test-scene';
import { FillGradient, Texture } from 'pixi.js';
import type { BLEND_MODES } from 'pixi.js';

const RAINBOW = new FillGradient({
  type: 'linear',
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
  colorStops: [
    { offset: 0, color: 0xe6194b },
    { offset: 0.5, color: 0x3cb44b },
    { offset: 1, color: 0x4363d8 },
  ],
});

const MODES: BLEND_MODES[] = ['normal', 'multiply', 'screen', 'difference', 'overlay', 'color-burn'];

/**
 * Blend modes, a prop like any other. Top left, red, green and blue circles drawn with `blendMode="add"`
 * add up to white where all three overlap. Beside them, a rainbow band under six white-and-grey
 * squares drawn with `normal`, `multiply`, `screen`, and the advanced `difference`, `overlay` and
 * `color-burn`, which `import 'pixi.js/advanced-blend-modes'` registers; WebGL draws those through the
 * canvas's back buffer, which `renderer={{ useBackBuffer: true }}` turns on.
 */
export const scene: TestScene = {
  canvas: { renderer: { useBackBuffer: true } },
  render: () => (
    <>
      <container2D x={80} y={90}>
        <graphics2D blendMode="add" draw={(graphics) => graphics.circle(0, -22, 40).fill(0xff0000)} />
        <graphics2D blendMode="add" draw={(graphics) => graphics.circle(-24, 18, 40).fill(0x00ff00)} />
        <graphics2D blendMode="add" draw={(graphics) => graphics.circle(24, 18, 40).fill(0x0000ff)} />
      </container2D>
      <graphics2D draw={(graphics) => graphics.rect(170, 20, 210, 260).fill(RAINBOW)} />
      {MODES.map((mode, i) => (
        <container2D key={mode} x={185 + (i % 2) * 100} y={30 + Math.floor(i / 2) * 85} blendMode={mode}>
          <sprite2D texture={Texture.WHITE} tint={0xffffff} width={40} height={70} />
          <sprite2D texture={Texture.WHITE} tint={0x808080} width={40} height={70} x={40} />
        </container2D>
      ))}
      <graphics2D draw={(graphics) => graphics.rect(20, 170, 130, 110).fill(RAINBOW)} />
      <sprite2D texture={Texture.WHITE} tint={0xffe119} width={90} height={70} x={40} y={190} blendMode="multiply" />
    </>
  ),
};
