import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';

const COLORS = { red: 0xe6194b, green: 0x3cb44b, blue: 0x4363d8, yellow: 0xffe119 };

type Name = keyof typeof COLORS;

/** Overlapping squares in React order, each 40 pixels right of and below the one before */
function Stack({ order, x }: { order: Name[]; x: number }) {
  return (
    <container2D x={x} y={40}>
      {order.map((name, i) => (
        <sprite2D key={name} texture={Texture.WHITE} tint={COLORS[name]} width={90} height={90} x={i * 30} y={i * 30} />
      ))}
    </container2D>
  );
}

function Scene({ order }: { order: Name[] }) {
  return (
    <>
      <Stack order={order} x={20} />
      <container2D x={220} y={40} sortableChildren>
        <sprite2D texture={Texture.WHITE} tint={COLORS.red} width={90} height={90} zIndex={2} />
        <sprite2D texture={Texture.WHITE} tint={COLORS.green} width={90} height={90} x={30} y={30} zIndex={1} />
        <container2D x={60} y={60} zIndex={0}>
          <sprite2D texture={Texture.WHITE} tint={COLORS.blue} width={90} height={90} />
          <sprite2D texture={Texture.WHITE} tint={COLORS.yellow} width={40} height={40} x={25} y={25} />
        </container2D>
      </container2D>
    </>
  );
}

/**
 * Children draw in React order, and keyed children move when their keys do. The left stack starts as
 * red, green, blue, yellow from the back and is rendered again as yellow, blue, red, green: each square
 * keeps its place by key and its position by index, so yellow is now at the back top left and green in
 * front at the bottom right, and red, third, overlaps blue. On the right, `zIndex` in a sortable
 * container puts red in front of green in front of a nested container, whose yellow child draws over
 * its blue one.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => <Scene order={['red', 'green', 'blue', 'yellow']} />,
  act: async ({ update }) => {
    await update(<Scene order={['yellow', 'blue', 'red', 'green']} />);
  },
};
