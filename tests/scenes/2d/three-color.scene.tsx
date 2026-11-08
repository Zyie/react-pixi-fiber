import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import { useMemo } from 'react';
import { Color } from 'react-pixi-fiber/three';

function Colored() {
  const lime = useMemo(() => new Color('limegreen'), []);
  const orange = useMemo(() => new Color('#ff8800'), []);
  const pink = useMemo(() => new Color('hotpink'), []);

  return (
    <>
      <sprite2D texture={Texture.WHITE} tint={lime} position={[20, 20]} width={110} height={110} />
      <graphics2D draw={(graphics) => graphics.roundRect(145, 20, 110, 110, 12).fill(orange)} />
      <text2D text="Aa" position={[270, 20]} style={{ fill: pink, fontSize: 90, fontWeight: 'bold' }} />
      <sprite2D texture={Texture.WHITE} tint="limegreen" position={[20, 170]} width={110} height={110} />
      <graphics2D draw={(graphics) => graphics.roundRect(145, 170, 110, 110, 12).fill('#ff8800')} />
      <text2D text="Aa" position={[270, 170]} style={{ fill: 'hotpink', fontSize: 90, fontWeight: 'bold' }} />
    </>
  );
}

/**
 * 2D colour props take a three `Color` from `react-pixi-fiber/three`, as a material's `color` does. The
 * top row is coloured with three `Color`s, the bottom row with the same colours as CSS strings, and the
 * two rows match: a lime sprite (`tint`), an orange rounded square (a graphics `fill`) and pink text
 * (its style's `fill`).
 */
export const scene: TestScene = {
  render: () => <Colored />,
};
