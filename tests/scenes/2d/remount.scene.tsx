import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';

function Scene({ shown }: { shown: Record<'a' | 'b' | 'c', boolean> }) {
  return (
    <container2D x={40} y={100}>
      {shown.a && <sprite2D texture={Texture.WHITE} tint={0xe6194b} width={80} height={80} />}
      {shown.b && (
        <container2D x={120}>
          <sprite2D texture={Texture.WHITE} tint={0x3cb44b} width={80} height={80} />
          <text2D text="B" x={30} y={20} style={{ fill: 'black', fontSize: 32, fontFamily: 'Arial' }} />
        </container2D>
      )}
      {shown.c && <graphics2D x={240} draw={(graphics) => graphics.rect(0, 0, 80, 80).fill(0x4363d8)} />}
    </container2D>
  );
}

/**
 * Unmounting and mounting again. Three shapes, red, green with a "B" and blue, are rendered; then the
 * green container and its children are unmounted with the blue graphics; then both come back while
 * the red one goes. The picture is the last state: no red, the green "B" and the blue square, each
 * in its own place, the green one before the blue one in the container as in React.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => <Scene shown={{ a: true, b: true, c: true }} />,
  act: async ({ update, frames }) => {
    await frames();
    await update(<Scene shown={{ a: true, b: false, c: false }} />);
    await frames();
    await update(<Scene shown={{ a: false, b: true, c: true }} />);
  },
};
