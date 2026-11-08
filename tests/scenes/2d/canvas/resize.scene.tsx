import type { TestScene } from '@test-scene';
import { useThree } from 'react-pixi-fiber';

/** Four corner marks and a centred bar, placed from the canvas's size */
function Hud() {
  const { width, height } = useThree((state) => state.size);
  const mark = (x: number, y: number) => (
    <graphics2D key={`${x},${y}`} x={x} y={y} draw={(graphics) => graphics.circle(0, 0, 10).fill(0xffe119)} />
  );

  return (
    <>
      {mark(20, 20)}
      {mark(width - 20, 20)}
      {mark(20, height - 20)}
      {mark(width - 20, height - 20)}
      <graphics2D x={width / 2} y={height / 2} draw={(graphics) => graphics.rect(-50, -8, 100, 16).fill(0x3cb44b)} />
    </>
  );
}

/**
 * The screen layer follows the canvas's size. The marks and the bar are placed from
 * `useThree((state) => state.size)`; `act` shrinks the canvas from 400 by 300 to 300 by 200 and tells
 * the root with `setSize`, as `<Canvas>` does when its parent resizes, and they move to the corners
 * and the centre of the smaller canvas.
 */
export const scene: TestScene = {
  render: () => <Hud />,
  act: async (_, state) => {
    const canvas = state.renderer.domElement as HTMLCanvasElement;
    canvas.style.width = '300px';
    canvas.style.height = '200px';
    state.setSize(300, 200);
  },
};
