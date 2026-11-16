import { useTexture } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { BlurFilter } from 'pixi.js';
import type { Graphics } from 'pixi.js';
import { useMemo, useState } from 'react';

function Scene({ on }: { on: boolean }) {
  const texture = useTexture('/textures/quadrants.png?props-removed');
  const [circle, setCircle] = useState<Graphics | null>(null);
  const blur = useMemo(() => new BlurFilter({ strength: 8 }), []);

  return (
    <>
      <graphics2D ref={setCircle} draw={(graphics) => graphics.circle(85, 150, 60).fill('white')} />
      <sprite2D texture={texture} x={20} y={85} width={130} height={130} {...(on && { mask: circle })} />
      <sprite2D texture={texture} x={160} y={85} width={130} height={130} {...(on && { filters: [blur] })} />
      <graphics2D
        x={300}
        y={85}
        {...(on && { draw: (graphics: Graphics) => graphics.rect(0, 0, 80, 130).fill('orange') })}
      />
    </>
  );
}

/**
 * Props an update removes leave a 2D object as a new one has it. Three objects are drawn with a prop,
 * then rendered again without it, as `{...(on && { mask })}` does: the left sprite loses its circle
 * `mask` and shows its whole quadrants texture, the middle sprite loses its blur `filters` and is
 * sharp, and the graphics at the right loses its `draw`, which drew an orange box, and is empty.
 */
export const scene: TestScene = {
  render: () => <Scene on />,
  act: async ({ update, frames }) => {
    await frames();
    await update(<Scene on={false} />);
  },
};
