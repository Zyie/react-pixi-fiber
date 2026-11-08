import type { TestScene } from '@test-scene';
import { FillGradient, Matrix } from 'pixi.js';
import type { Graphics } from 'pixi.js';
import { useMemo } from 'react';
import { useTexture } from 'react-pixi-fiber';

function Shapes() {
  const texture = useTexture('/textures/quadrants.png?graphics-fills');
  const sunset = useMemo(
    () =>
      new FillGradient({
        type: 'linear',
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        colorStops: [
          { offset: 0, color: 0xf58231 },
          { offset: 1, color: 0x911eb4 },
        ],
      }),
    [],
  );
  const glow = useMemo(
    () =>
      new FillGradient({
        type: 'radial',
        center: { x: 0.5, y: 0.5 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.5 },
        outerRadius: 0.5,
        colorStops: [
          { offset: 0, color: 0xffffff },
          { offset: 1, color: 0x4363d8 },
        ],
      }),
    [],
  );
  const tiled = useMemo(() => new Matrix().scale(0.25, 0.25), []);

  return (
    <>
      <graphics2D draw={(graphics) => graphics.rect(20, 20, 70, 70).fill({ color: 0xe6194b, alpha: 0.8 })} />
      <graphics2D
        draw={(graphics) =>
          graphics
            .circle(150, 55, 28)
            .stroke({ width: 10, color: 0x4363d8, alignment: 1 })
            .circle(150, 55, 28)
            .stroke({ width: 2, color: 0xffffff })
        }
      />
      <graphics2D
        draw={(graphics) =>
          graphics.roundRect(205, 20, 80, 70, 14).fill(0x3cb44b).stroke({ width: 6, color: 0xffe119, alignment: 0 })
        }
      />
      <graphics2D
        draw={(graphics) =>
          graphics
            .moveTo(305, 85)
            .lineTo(330, 25)
            .lineTo(355, 85)
            .lineTo(380, 25)
            .stroke({ width: 10, color: 0x46f0f0, join: 'round', cap: 'round' })
        }
      />
      <graphics2D draw={(graphics) => graphics.rect(20, 120, 170, 60).fill(sunset)} />
      <graphics2D draw={(graphics) => graphics.circle(260, 150, 40).fill(glow)} />
      <graphics2D
        draw={(graphics: Graphics) => graphics.rect(20, 200, 170, 80).fill({ texture, matrix: tiled, color: 0xffffff })}
      />
      <graphics2D
        draw={(graphics) =>
          graphics
            .roundRect(220, 200, 160, 80, 10)
            .fill(0xf032e6)
            .circle(260, 240, 22)
            .cut()
            .rect(310, 220, 50, 40)
            .cut()
        }
      />
    </>
  );
}

/**
 * Graphics fills and strokes through the `draw` prop. Top row: a red square at 0.8 alpha; a blue ring
 * stroked inside its circle (`alignment: 1`) under a thin white one on the line; a green rounded
 * rectangle with a yellow stroke outside it (`alignment: 0`); a cyan zigzag with round joins and caps.
 * Middle: a linear `FillGradient` from orange to purple, and a radial one from white to blue. Bottom: the
 * quadrants texture as a fill, tiled at a quarter of its size by its matrix; and a pink rounded
 * rectangle with a round hole and a square one cut out of it.
 */
export const scene: TestScene = {
  render: () => <Shapes />,
};
