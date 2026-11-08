import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import type { Sprite } from 'pixi.js';
import { useRef } from 'react';
import { useFrame, useThree } from 'react-pixi-fiber';

/** A square in the bottom-right corner of the canvas, placed from `useThree`'s size */
function Corner() {
  const { width, height } = useThree((state) => state.size);

  return (
    <sprite2D texture={Texture.WHITE} tint="orange" width={50} height={50} anchor={1} x={width - 10} y={height - 10} />
  );
}

/** A square that `useFrame` turns by 3 degrees a frame */
function Spinner() {
  const sprite = useRef<Sprite>(null);
  useFrame(() => {
    sprite.current!.angle += 3;
  });

  return (
    <sprite2D
      ref={sprite}
      texture={Texture.WHITE}
      tint="steelblue"
      width={80}
      height={80}
      anchor={0.5}
      x={120}
      y={110}
    />
  );
}

/** How many children the screen layer has, as dots */
function ScreenChildren() {
  const screen = useThree((state) => state.screen);

  return (
    <graphics2D
      x={20}
      y={20}
      draw={(graphics) => {
        for (let i = 0; i < screen.children.length; i++) graphics.circle(i * 16, 0, 5).fill(0xffffff);
      }}
    />
  );
}

/**
 * The screen layer follows the canvas, here 480 by 240: an orange square sits 10 pixels from its
 * bottom-right corner, placed from `useThree((state) => state.size)`. A steel-blue square spun by
 * `useFrame` has turned 30 degrees after ten frames. White dots count `state.screen`'s children when it
 * drew: the corner and the spinner, before the dots' own graphics joined it.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  size: { width: 480, height: 240 },
  frames: 10,
  render: () => (
    <>
      <Corner />
      <Spinner />
      <ScreenChildren />
    </>
  ),
};
