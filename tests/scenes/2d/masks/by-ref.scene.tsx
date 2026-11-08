import type { TestScene } from '@test-scene';
import type { Graphics, Sprite } from 'pixi.js';
import { useState } from 'react';
import { useTexture } from 'react-pixi-fiber';

const SIZE = 110;

function Masks({ inverse }: { inverse: boolean }) {
  const texture = useTexture('/textures/quadrants.png?masks');
  const ramp = useTexture('/textures/alpha-ramp.png?masks');
  const [circle, setCircle] = useState<Graphics | null>(null);
  const [fade, setFade] = useState<Sprite | null>(null);
  const [diamond, setDiamond] = useState<Graphics | null>(null);

  return (
    <>
      <graphics2D ref={setCircle} draw={(graphics) => graphics.circle(75, 75, 50).fill('white')} />
      <sprite2D texture={texture} x={20} y={20} width={SIZE} height={SIZE} mask={circle} />

      <sprite2D ref={setFade} texture={ramp} x={145} y={20} width={SIZE} height={SIZE} />
      <sprite2D texture={texture} x={145} y={20} width={SIZE} height={SIZE} mask={fade} />

      <sprite2D texture={texture} x={270} y={20} width={SIZE} height={SIZE} mask={{ inverse }}>
        <graphics2D attach="mask" draw={(graphics) => graphics.star(32, 32, 5, 26, 12).fill('white')} />
      </sprite2D>

      <graphics2D
        ref={setDiamond}
        draw={(graphics) => graphics.poly([75, 165, 125, 220, 75, 275, 25, 220]).fill('white')}
      />
      <sprite2D
        texture={texture}
        x={20}
        y={165}
        width={SIZE}
        height={SIZE}
        mask={diamond && { mask: diamond, inverse: true }}
      />
    </>
  );
}

/**
 * Masks by ref and inverse masks. Each mask element's ref is kept in state, which renders the masked
 * sprite again once it is set. Top row: the quadrants texture cut to a circle by a sibling
 * `<graphics2D>` passed as `mask`, which isn't drawn itself; faded from left to right by a sprite of
 * the alpha ramp as its mask; and, after `act` turns `inverse` off, shown only inside a star, its
 * `mask={{ inverse }}` keeping the `attach="mask"` child. Bottom left: everything but a diamond, an
 * inverse mask from `mask={{ mask: diamond, inverse: true }}`.
 */
export const scene: TestScene = {
  render: () => <Masks inverse />,
  act: async ({ update }) => {
    await update(<Masks inverse={false} />);
  },
};
