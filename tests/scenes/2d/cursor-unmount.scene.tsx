import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';

/** A lamp that is green when lit */
function Lamp({ x, lit }: { x: number; lit: boolean }) {
  return <graphics2D x={x} y={260} draw={(graphics) => graphics.circle(0, 0, 10).fill(lit ? 0x3cb44b : 0x2a2a2a)} />;
}

function Scene({ button = true, hovered = false, cleared = false }) {
  return (
    <>
      {button && (
        <container2D x={150} y={80}>
          <sprite2D
            texture={Texture.WHITE}
            tint="steelblue"
            width={100}
            height={100}
            cursor="pointer"
            onClick={() => {}}
          />
        </container2D>
      )}
      <Lamp x={170} lit={hovered} />
      <Lamp x={230} lit={cleared} />
    </>
  );
}

/**
 * The canvas's cursor when the element that set it is unmounted under a pointer that doesn't move. The
 * pointer rests on a steel-blue square whose `cursor` is `pointer`, which lights the left lamp. Then the
 * container around the square unmounts, and the canvas's cursor is cleared at once, without another
 * pointer move, which lights the right lamp; the square is gone.
 */
export const scene: TestScene = {
  render: () => <Scene />,
  act: async ({ mouse, frames, update }, state) => {
    const canvas = state.renderer.domElement as HTMLCanvasElement;
    await mouse.move(200, 130);
    await frames();
    const hovered = canvas.style.cursor === 'pointer';
    await update(<Scene button={false} hovered={hovered} />);
    await frames();
    await update(<Scene button={false} hovered={hovered} cleared={canvas.style.cursor === ''} />);
  },
};
