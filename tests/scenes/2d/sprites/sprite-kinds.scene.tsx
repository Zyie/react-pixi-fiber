import { useAsset } from '@react-fiber/2d';
import { useFrame, useTexture } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import type { Spritesheet, TilingSprite } from 'pixi.js';
import { useMemo, useRef } from 'react';

/** A tiling sprite whose tiles `useFrame` scrolls 2 pixels right and 1 down a frame */
function Scrolling() {
  const texture = useTexture('/textures/checker.png?sprite-kinds');
  const tiles = useRef<TilingSprite>(null);

  useFrame(() => {
    tiles.current!.tilePosition.x += 2;
    tiles.current!.tilePosition.y += 1;
  });

  return <tilingSprite2D ref={tiles} texture={texture} x={150} y={20} width={110} height={110} tileScale={0.5} />;
}

function Sprites({ wide }: { wide: boolean }) {
  const quadrants = useTexture('/textures/quadrants.png?sprite-kinds');
  const coins = useAsset<Spritesheet>('/sprites/coin.json');
  const nineSlice = useMemo(
    () => ({ texture: quadrants, leftWidth: 10, topHeight: 10, rightWidth: 10, bottomHeight: 10 }),
    [quadrants],
  );

  return (
    <>
      <sprite2D texture={quadrants} anchor={0.5} x={75} y={75} width={90} height={90} angle={20} skew={[0.2, 0]} />
      <Scrolling />
      <tilingSprite2D
        texture={quadrants}
        x={280}
        y={20}
        width={100}
        height={110}
        tileScale={0.25}
        tileRotation={Math.PI / 6}
      />
      <nineSliceSprite2D args={[nineSlice]} x={20} y={160} width={wide ? 200 : 60} height={wide ? 50 : 110} />
      <sprite2D texture={coins.textures[wide ? 'coin-2' : 'coin-0']} x={250} y={170} scale={2} tint="#7ad151" />
    </>
  );
}

/**
 * Sprites after twelve frames. Top row: the quadrants texture turned 20 degrees about its centre
 * (`anchor={0.5}`) and skewed; the checker tiled at half size, its tiles scrolled 22 pixels right and
 * 11 down by `useFrame`; the quadrants tiled at a quarter of their size and turned 30 degrees inside
 * their frame. Bottom row, after `act`: a nine-slice sprite stretched from 60 by 110 to 200 by 50,
 * whose 10 pixel borders keep their width, and a sprite whose `texture` prop moved from the coin's
 * first frame to its third, tinted green.
 */
export const scene: TestScene = {
  frames: 12,
  render: () => <Sprites wide={false} />,
  act: async ({ update }) => {
    await update(<Sprites wide />);
  },
};
