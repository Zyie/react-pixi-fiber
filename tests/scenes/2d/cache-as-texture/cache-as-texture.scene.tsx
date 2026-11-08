import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import type { Container } from 'pixi.js';
import { useLayoutEffect, useRef } from 'react';

const LOW_RESOLUTION = { resolution: 0.125 };

function Squares({ tint }: { tint: number }) {
  return (
    <>
      <sprite2D texture={Texture.WHITE} tint={tint} width={50} height={50} />
      <sprite2D texture={Texture.WHITE} tint={0xffffff} width={30} height={30} x={45} y={45} />
      <graphics2D x={25} y={75} draw={(graphics) => graphics.circle(0, 0, 20).fill(0xf58231)} />
    </>
  );
}

/** A cached group that refreshes its texture when its content changes, in the commit that changes it */
function Refreshed({ tint }: { tint: number }) {
  const group = useRef<Container>(null);

  useLayoutEffect(() => {
    group.current!.updateCacheTexture();
  }, [tint]);

  return (
    <container2D ref={group} x={150} y={60} cacheAsTexture>
      <Squares tint={tint} />
    </container2D>
  );
}

function Cached({ tint }: { tint: number }) {
  return (
    <>
      <container2D x={30} y={60} cacheAsTexture>
        <Squares tint={tint} />
      </container2D>
      <Refreshed tint={tint} />
      <container2D x={270} y={60} cacheAsTexture={LOW_RESOLUTION}>
        <Squares tint={tint} />
      </container2D>
    </>
  );
}

/**
 * `cacheAsTexture` as a prop: three groups of a coloured square, a white one and an orange circle,
 * each drawn once into a texture. `act` turns the coloured squares from blue to green. The left group
 * keeps its cached texture, so its square stays blue; the middle one calls `updateCacheTexture()` in a
 * layout effect and turns green; the right one caches at an eighth of the resolution, so it is
 * blurred, and stays blue.
 */
export const scene: TestScene = {
  render: () => <Cached tint={0x4363d8} />,
  act: async ({ update, frames }) => {
    await frames();
    await update(<Cached tint={0x3cb44b} />);
  },
};
