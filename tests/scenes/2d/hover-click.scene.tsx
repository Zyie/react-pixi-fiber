import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import { useState } from 'react';

/** A square that turns orange while hovered and grows by 30 pixels each time it is clicked */
function Button({ x }: { x: number }) {
  const [hovered, setHovered] = useState(false);
  const [clicks, setClicks] = useState(0);

  return (
    <sprite2D
      texture={Texture.WHITE}
      tint={hovered ? 'orange' : 'steelblue'}
      anchor={0.5}
      position={[x, 130]}
      width={60 + clicks * 30}
      height={60 + clicks * 30}
      cursor="pointer"
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => setClicks((count) => count + 1)}
    />
  );
}

/** A lamp that lights when the canvas's cursor is the hovered element's `cursor` */
function CursorLamp({ lit }: { lit: boolean }) {
  return <graphics2D x={200} y={260} draw={(graphics) => graphics.circle(0, 0, 10).fill(lit ? 0x3cb44b : 0x2a2a2a)} />;
}

function Scene({ cursorShown = false }: { cursorShown?: boolean }) {
  return (
    <>
      <Button x={110} />
      <Button x={290} />
      <CursorLamp lit={cursorShown} />
    </>
  );
}

/**
 * Hover and click on 2D: two steel-blue squares of pixi's white texture, 60 pixels wide. The pointer
 * clicks the left one twice, so it grows to 120 pixels, and stays over it, so it is orange; the right
 * one, never touched, stays steel blue and 60 pixels wide. While the
 * pointer is over the left square the canvas shows its `cursor`, `pointer`, which lights the green
 * lamp at the bottom.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => <Scene />,
  act: async ({ mouse, frames, update }, state) => {
    await mouse.click(110, 130);
    await frames();
    await mouse.click(110, 130);
    await frames();
    await mouse.move(112, 132);
    await frames();
    const cursor = (state.renderer.domElement as HTMLCanvasElement).style.cursor;
    await update(<Scene cursorShown={cursor === 'pointer'} />);
  },
};
