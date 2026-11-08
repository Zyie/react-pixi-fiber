import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import type { RenderLayer, Sprite } from 'pixi.js';
import { useLayoutEffect, useRef } from 'react';

const COLORS = [0xe6194b, 0x3cb44b, 0xffe119, 0x4363d8, 0xf58231, 0x911eb4, 0x46f0f0, 0xf032e6];

/**
 * Particles: a `<particleContainer2D>` with a `<particle2D>` child per dot, each built from `args`
 * (pixi's particle options) on a ring of eight around the container's origin, 16 pixels square,
 * coloured by `tint`; and a `<renderLayer2D>` that draws the yellow square attached to it over the
 * blue one, though the yellow one comes first in the tree.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => (
    <>
      <particleContainer2D x={120} y={150}>
        {COLORS.map((tint, i) => (
          <particle2D
            key={tint}
            args={[
              {
                texture: Texture.WHITE,
                x: Math.cos((i / COLORS.length) * Math.PI * 2) * 70,
                y: Math.sin((i / COLORS.length) * Math.PI * 2) * 70,
                scaleX: 16,
                scaleY: 16,
                anchorX: 0.5,
                anchorY: 0.5,
                tint,
              },
            ]}
          />
        ))}
      </particleContainer2D>
      <Layered />
    </>
  ),
};

/** A yellow square first in the tree, attached to a render layer last in it, so it draws in front */
function Layered() {
  const layer = useRef<RenderLayer>(null);
  const yellow = useRef<Sprite>(null);

  useLayoutEffect(() => {
    layer.current!.attach(yellow.current!);
  }, []);

  return (
    <container2D x={250} y={90}>
      <sprite2D ref={yellow} texture={Texture.WHITE} tint={0xffe119} width={70} height={70} />
      <sprite2D texture={Texture.WHITE} tint={0x4363d8} width={70} height={70} x={40} y={40} />
      <renderLayer2D ref={layer} />
    </container2D>
  );
}
