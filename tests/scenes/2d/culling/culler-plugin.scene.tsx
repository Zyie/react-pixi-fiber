import { useFrame } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { CullerPlugin, extensions, Rectangle, Texture } from 'pixi.js';
import type { Sprite } from 'pixi.js';
import { useLayoutEffect, useRef, useState } from 'react';

const OUTSIDE_AREA = new Rectangle(-500, 0, 10, 10);

function Lamp({ x, on }: { x: number; on: boolean }) {
  return <graphics2D x={x} y={250} draw={(graphics) => graphics.circle(0, 0, 12).fill(on ? 0x3cb44b : 0xe6194b)} />;
}

function Culled() {
  const [culled, setCulled] = useState<boolean[]>([]);
  const sprites = useRef<(Sprite | null)[]>([]);

  useLayoutEffect(() => {
    extensions.add(CullerPlugin);
    return () => {
      extensions.remove(CullerPlugin);
    };
  }, []);

  useFrame(() => {
    const now = sprites.current.map((sprite) => sprite!.culled);
    if (now.some((value, i) => value !== culled[i])) setCulled(now);
  });

  const spriteAt = (i: number, x: number, props: { cullable?: boolean; cullArea?: Rectangle } = {}) => (
    <sprite2D
      ref={(sprite) => {
        sprites.current[i] = sprite;
      }}
      texture={Texture.WHITE}
      tint={0x4363d8}
      width={60}
      height={60}
      x={x}
      y={100}
      cullable
      {...props}
    />
  );

  return (
    <>
      {spriteAt(0, 40)}
      {spriteAt(1, -200)}
      {spriteAt(2, -200, { cullable: false })}
      {spriteAt(3, 370)}
      {spriteAt(4, 150, { cullArea: OUTSIDE_AREA })}
      <Lamp x={70} on={culled[0] === false} />
      <Lamp x={120} on={culled[1] === true} />
      <Lamp x={170} on={culled[2] === false} />
      <Lamp x={220} on={culled[3] === false} />
      <Lamp x={270} on={culled[4] === true} />
    </>
  );
}

/**
 * Culling, once `extensions.add(CullerPlugin)` registers pixi's plugin, as for a pixi `Application`:
 * the root culls its `cullable` 2D against the canvas before each frame. Each lamp turns green when its
 * square's `culled` is what it should be: a square on the canvas isn't culled; one 200 pixels off its
 * left edge is; the same off the edge without `cullable` isn't; one half over the right edge isn't; and
 * one on the canvas whose `cullArea` lies off it is, so it isn't drawn. Two blue squares show.
 */
export const scene: TestScene = {
  frames: 3,
  render: () => <Culled />,
};
