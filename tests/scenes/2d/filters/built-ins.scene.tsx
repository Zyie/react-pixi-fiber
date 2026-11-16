import { once, useTexture } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import type { Sprite } from 'pixi.js';
import { useState } from 'react';

const SIZE = 110;

function Tile({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  const texture = useTexture('/textures/quadrants.png?built-in-filters');

  return (
    <sprite2D texture={texture} x={x} y={y} width={SIZE} height={SIZE}>
      {children}
    </sprite2D>
  );
}

function Displaced() {
  const checker = useTexture('/textures/checker.png?built-in-filters');
  const [map, setMap] = useState<Sprite | null>(null);

  return (
    <>
      <sprite2D ref={setMap} texture={checker} renderable={false} x={20} y={155} />
      <Tile x={20} y={155}>
        {map && <displacementFilter2D attach="filters-0" args={[{ sprite: map, scale: 24 }]} />}
      </Tile>
    </>
  );
}

/**
 * pixi.js's own filters as elements, each attached to the quadrants texture as `filters-0`. Top row:
 * a `<blurFilter2D>` at strength 8, a `<colorMatrixFilter2D>` whose `sepia()` method `once()` calls on
 * mount, and one turned 180 degrees of hue by `hue={once(180)}`. Bottom row: the checker texture,
 * hidden by `renderable={false}`, as the map of a `<displacementFilter2D>` whose `args` wait for its
 * ref; a blur along x only, with `strengthY` at 0; and two overlapping squares in a container
 * faded to 0.5 as one by an `<alphaFilter2D>`, so the blue one hides the red one where they overlap. The
 * noise filter is left out: its random pattern differs between WebGL and WebGPU.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Tile x={20} y={20}>
        <blurFilter2D attach="filters-0" strength={8} quality={4} />
      </Tile>
      <Tile x={145} y={20}>
        <colorMatrixFilter2D attach="filters-0" sepia={once()} />
      </Tile>
      <Tile x={270} y={20}>
        <colorMatrixFilter2D attach="filters-0" hue={once(180)} />
      </Tile>
      <Displaced />
      <Tile x={145} y={155}>
        <blurFilter2D attach="filters-0" strengthX={12} strengthY={0} />
      </Tile>
      <container2D x={270} y={155}>
        <sprite2D texture={Texture.WHITE} tint={0xe6194b} width={75} height={75} />
        <sprite2D texture={Texture.WHITE} tint={0x4363d8} width={75} height={75} x={35} y={35} />
        <alphaFilter2D attach="filters-0" alpha={0.5} />
      </container2D>
    </>
  ),
};
