import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';

interface Props {
  x: number;
  tint: string;
  alpha: number;
  angle: number;
  text: string;
  visible: boolean;
}

function Scene({ x, tint, alpha, angle, text, visible }: Props) {
  return (
    <>
      <sprite2D
        texture={Texture.WHITE}
        width={80}
        height={80}
        anchor={0.5}
        position={[x, 90]}
        tint={tint}
        alpha={alpha}
        angle={angle}
      />
      <text2D text={text} x={20} y={180} style={{ fill: 'white', fontSize: 28, fontFamily: 'Arial' }} />
      <sprite2D texture={Texture.WHITE} tint="red" width={40} height={40} x={330} y={240} visible={visible} />
    </>
  );
}

/**
 * Props that change between renders reach the pixi object. A grey square at x 80 is rendered again
 * at x 280, orange, at 70% opacity and turned 30 degrees; the text changes from "before" to "after";
 * a red square at the bottom right is hidden by `visible={false}`.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => <Scene x={80} tint="grey" alpha={1} angle={0} text="before" visible />,
  act: async ({ update, frames }) => {
    await frames();
    await update(<Scene x={280} tint="orange" alpha={0.7} angle={30} text="after" visible={false} />);
  },
};
