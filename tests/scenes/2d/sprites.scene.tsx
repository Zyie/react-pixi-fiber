import { useAsset } from '@react-fiber/2d';
import { useTexture } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import type { Spritesheet } from 'pixi.js';

function Sprites() {
  const quadrants = useTexture('/textures/quadrants.png?sprites');
  const sheet = useAsset<Spritesheet>('/sprites/walk.json');

  return (
    <>
      <sprite2D texture={quadrants} position={[20, 20]} width={100} height={100} />
      <tilingSprite2D
        texture={quadrants}
        position={[140, 20]}
        width={110}
        height={100}
        tileScale={0.5}
        tilePosition={[16, 0]}
      />
      <nineSliceSprite2D
        args={[{ texture: quadrants, leftWidth: 8, topHeight: 8, rightWidth: 8, bottomHeight: 8 }]}
        position={[270, 20]}
        width={110}
        height={60}
      />
      <animatedSprite2D args={[sheet.animations.walk]} position={[20, 160]} scale={3} />
      <animatedSprite2D args={[sheet.animations.walk]} position={[140, 160]} scale={3} currentFrame={2} />
      <sprite2D texture={sheet.textures['walk-3']} position={[260, 160]} scale={3} tint="orange" />
    </>
  );
}

/**
 * The sprite elements, with textures from `useTexture` (a three `Texture`, which is a pixi texture)
 * and from a spritesheet loaded with `useAsset`. Top row: the quadrants texture as a 100 pixel
 * `<sprite2D>`, tiled at half scale and shifted 16 pixels by a `<tilingSprite2D>`, and stretched by a
 * `<nineSliceSprite2D>` whose 8 pixel borders keep their size. Bottom row, three times the
 * spritesheet's 32 pixel frames: an `<animatedSprite2D>` on its first frame (the bar at the top), one
 * on its third (`currentFrame={2}`, the bar below the middle), and the fourth frame as a sprite tinted
 * orange.
 */
export const scene: TestScene = {
  render: () => <Sprites />,
};
