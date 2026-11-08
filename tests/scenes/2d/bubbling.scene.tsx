import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { Rectangle, Texture } from 'pixi.js';
import { useState } from 'react';

/** A lamp that is green when its count is right, and red when it isn't */
function Lamp({ x, right }: { x: number; right: boolean }) {
  const color = right ? 0x3cb44b : 0xe6194b;

  return <graphics2D x={x} y={270} draw={(graphics) => graphics.circle(0, 0, 10).fill(color)} />;
}

function Scene() {
  const [parent, setParent] = useState(0);
  const [child, setChild] = useState(0);
  const [hitArea, setHitArea] = useState(0);
  const [none, setNone] = useState(0);
  const [missed, setMissed] = useState(0);
  const square = (tint: number) => ({ texture: Texture.WHITE, tint, width: 60, height: 60 });

  return (
    <>
      <container2D x={20} y={40} onClick={() => setParent((count) => count + 1)}>
        <sprite2D {...square(0x4363d8)} onClick={() => setChild((count) => count + 1)} />
        <sprite2D {...square(0x911eb4)} x={70} />
      </container2D>
      <container2D
        x={180}
        y={40}
        hitArea={new Rectangle(0, 0, 60, 60)}
        onClick={() => setHitArea((count) => count + 1)}
      >
        <sprite2D {...square(0xf58231)} x={30} />
      </container2D>
      <sprite2D {...square(0x808080)} x={300} y={40} eventMode="none" onClick={() => setNone((count) => count + 1)} />
      <sprite2D {...square(0x46f0f0)} x={300} y={140} onPointerMissed={() => setMissed((count) => count + 1)} />
      <Lamp x={40} right={parent === 2} />
      <Lamp x={100} right={child === 1} />
      <Lamp x={200} right={hitArea === 1} />
      <Lamp x={300} right={none === 0} />
      <Lamp x={360} right={missed > 0} />
    </>
  );
}

/**
 * Bubbling and pixi's hit rules, each with a lamp that is green when its count is right. A container
 * with `onClick` holds a blue square with its own `onClick` and a purple one without: a click on each
 * reaches the container, twice in all, and the blue square once. A container whose `hitArea` covers
 * only the left half of its orange square counts a click there and not one on the right half. A grey
 * square with `eventMode="none"` never counts. A cyan square's `onPointerMissed` fires for the clicks
 * that weren't on it; as in r3f, it fires for each pointerdown, pointerup and click a handler took
 * elsewhere, so its lamp only asks that it fired. All five lamps are green.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => <Scene />,
  act: async ({ mouse, frames }) => {
    await mouse.click(50, 70);
    await mouse.click(120, 70);
    await mouse.click(200, 70);
    await mouse.click(260, 70);
    await mouse.click(330, 70);
    await mouse.click(200, 200);
    await frames();
  },
};
