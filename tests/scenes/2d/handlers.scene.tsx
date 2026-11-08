import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import { useState } from 'react';

type Seen = Record<'doubleClick' | 'contextMenu' | 'wheel' | 'over' | 'out' | 'enter' | 'leave', number>;

const LAMPS: (keyof Seen)[] = ['doubleClick', 'contextMenu', 'wheel', 'over', 'out', 'enter', 'leave'];

/** What each lamp should read once the pointer has moved from one child to the other and off both */
const EXPECTED: Seen = { doubleClick: 1, contextMenu: 1, wheel: 1, over: 2, out: 2, enter: 2, leave: 2 };

function Scene() {
  const [seen, setSeen] = useState<Seen>({
    doubleClick: 0,
    contextMenu: 0,
    wheel: 0,
    over: 0,
    out: 0,
    enter: 0,
    leave: 0,
  });
  const count = (name: keyof Seen) => () => setSeen((last) => ({ ...last, [name]: last[name] + 1 }));

  return (
    <>
      <sprite2D
        texture={Texture.WHITE}
        tint={0x4363d8}
        width={100}
        height={100}
        x={20}
        y={40}
        onDoubleClick={count('doubleClick')}
        onContextMenu={count('contextMenu')}
        onWheel={count('wheel')}
      />
      <container2D
        x={180}
        y={40}
        onPointerOver={count('over')}
        onPointerOut={count('out')}
        onPointerEnter={count('enter')}
        onPointerLeave={count('leave')}
      >
        <sprite2D texture={Texture.WHITE} tint={0xf58231} width={90} height={100} />
        <sprite2D texture={Texture.WHITE} tint={0x911eb4} width={90} height={100} x={100} />
      </container2D>
      {LAMPS.map((name, i) => (
        <graphics2D
          key={name}
          x={40 + i * 50}
          y={250}
          draw={(graphics) => graphics.circle(0, 0, 12).fill(seen[name] === EXPECTED[name] ? 0x3cb44b : 0xe6194b)}
        />
      ))}
    </>
  );
}

/**
 * The rest of r3f's handlers on 2D, each counted by a lamp that is green when its count is right. The
 * blue square gets a double click, a right click and a wheel turn, once each. A container with
 * `onPointerOver`, `onPointerOut`, `onPointerEnter` and `onPointerLeave` holds an orange and a purple
 * square; the pointer moves onto the orange one, across to the purple one and off both. As in r3f
 * (tests/scenes/events/hover-order), moving between two children takes the container out and back in,
 * and enter and leave behave like over and out, so each fires twice. All seven lamps are green.
 */
export const scene: TestScene = {
  render: () => <Scene />,
  act: async ({ mouse, frames }) => {
    await mouse.doubleClick(70, 90);
    await mouse.contextMenu(70, 90);
    await mouse.move(70, 90);
    await mouse.wheel(0, 40);
    await frames();
    await mouse.move(220, 90);
    await frames();
    await mouse.move(320, 90);
    await frames();
    await mouse.move(320, 200);
    await frames();
  },
};
