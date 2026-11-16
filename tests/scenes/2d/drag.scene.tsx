import type { ThreeEvent2D } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import { useRef, useState } from 'react';

/** A square dragged by its centre; with `capture`, it holds the pointer while the button is down */
function Draggable({ x, capture, color }: { x: number; capture: boolean; color: number }) {
  const [position, setPosition] = useState<[number, number]>([x, 200]);
  const [held, setHeld] = useState(false);
  const dragging = useRef(false);

  return (
    <>
      <sprite2D
        texture={Texture.WHITE}
        tint={color}
        anchor={0.5}
        width={60}
        height={60}
        position={position}
        onPointerDown={(event: ThreeEvent2D<PointerEvent>) => {
          dragging.current = true;
          if (capture) {
            event.target.setPointerCapture(event.pointerId);
            setHeld(event.target.hasPointerCapture(event.pointerId));
          }
        }}
        onPointerMove={(event: ThreeEvent2D<PointerEvent>) => {
          if (dragging.current) setPosition([event.global.x, event.global.y]);
        }}
        onPointerUp={(event: ThreeEvent2D<PointerEvent>) => {
          dragging.current = false;
          if (capture) {
            event.target.releasePointerCapture(event.pointerId);
            setHeld(false);
          }
        }}
      />
      <graphics2D x={x} y={270} draw={(graphics) => graphics.circle(0, 0, 8).fill(held ? 0x3cb44b : 0x2a2a2a)} />
    </>
  );
}

/**
 * Pointer capture on 2D: two squares are dragged up and to the side in one quick move that leaves each
 * behind. The left one captured the pointer on pointerdown, so it still gets the move, reads the
 * pointer's `global` position, and lands centred under it; the right one didn't, so the move misses it
 * and it stays put. The lamp under the left square lit while it held the pointer and is dark again
 * after pointerup.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Draggable x={110} capture color={0x4363d8} />
      <Draggable x={290} capture={false} color={0xe6194b} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(110, 200);
    await mouse.down();
    await mouse.move(160, 80);
    await mouse.up();
    await frames();
    await mouse.move(290, 200);
    await mouse.down();
    await mouse.move(240, 80);
    await mouse.up();
    await frames();
  },
};
