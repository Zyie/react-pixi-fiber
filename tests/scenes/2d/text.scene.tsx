import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { useAsset } from 'react-pixi-fiber';

function Texts() {
  useAsset('/fonts/blocks.fnt');

  return (
    <>
      <text2D text="Canvas text" x={20} y={16} style={{ fill: 'white', fontSize: 32, fontFamily: 'Arial' }} />
      <text2D
        args={[{ text: 'args and anchor', style: { fill: '#f5d020', fontSize: 24, fontFamily: 'Arial' } }]}
        anchor={[1, 0]}
        x={380}
        y={70}
      />
      <text2D text="pierced fill" x={20} y={110} style={{ fontSize: 24, fontFamily: 'Arial' }} style-fill="#ff69b4" />
      <bitmapText2D text="PIXI 2D" x={20} y={160} style={{ fontFamily: 'Blocks', fontSize: 28, fill: 'white' }} />
      <bitmapText2D text="dynamic" x={220} y={160} style={{ fontFamily: 'Arial', fontSize: 28, fill: '#7ad151' }} />
      <text2D
        text="rotated"
        x={300}
        y={220}
        angle={-20}
        style={{ fill: '#3cb4e8', fontSize: 22, fontFamily: 'Arial' }}
      />
    </>
  );
}

/**
 * The text elements: a white `<text2D>` set by props; a yellow one from `args` (an options object),
 * right-aligned to x 380 by its anchor; a pink one whose fill is pierced (`style-fill`); a
 * `<bitmapText2D>` in the `Blocks` bitmap font, loaded with `useAsset`, reading "PIXI 2D" in white
 * blocks; a green `<bitmapText2D>` whose font pixi builds from its style; and a blue text turned 20
 * degrees by `angle`.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => <Texts />,
};
