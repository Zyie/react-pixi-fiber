import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import type { RenderLayer } from 'pixi.js';
import { useState } from 'react';

function Cards({ x, layer }: { x: number; layer: RenderLayer | null }) {
  return (
    <container2D x={x} y={60}>
      <sprite2D texture={Texture.WHITE} tint={0xe6194b} width={90} height={90} renderLayer={layer} />
      <sprite2D texture={Texture.WHITE} tint={0x3cb44b} width={90} height={90} x={30} y={30} />
      <sprite2D texture={Texture.WHITE} tint={0x4363d8} width={90} height={90} x={60} y={60} />
    </container2D>
  );
}

function Layered({ lifted }: { lifted: boolean }) {
  const [layer, setLayer] = useState<RenderLayer | null>(null);

  return (
    <>
      <Cards x={30} layer={layer} />
      <Cards x={230} layer={lifted ? layer : null} />
      <sprite2D texture={Texture.WHITE} tint={0xffe119} width={360} height={30} x={20} y={110} alpha={0.9} />
      <renderLayer2D ref={setLayer} />
    </>
  );
}

/**
 * The `renderLayer` prop draws a container in a `<renderLayer2D>` where the layer is, not where it is in
 * its parent. The layer comes after the cards, so its ref is kept in state, which re-renders the cards
 * with it once it is set. Each group stacks red, green and blue cards in that order, under a
 * yellow band drawn after both. On the left the red card is in the layer, last in the tree, so it draws
 * over its siblings and the band. On the right it was in the layer, then `act` set `renderLayer` to
 * `null`, and it is back at the bottom of its stack, under the band.
 */
export const scene: TestScene = {
  render: () => <Layered lifted />,
  act: async ({ update }) => {
    await update(<Layered lifted={false} />);
  },
};
