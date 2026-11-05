import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A box that counts its clicks and double clicks: one lamp per click, and a blue top once it is double-clicked */
function Target() {
  const [clicks, setClicks] = useState(0);
  const [doubled, setDoubled] = useState(false);

  return (
    <>
      <mesh onClick={() => setClicks((count) => count + 1)} onDoubleClick={() => setDoubled(true)}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshBasicMaterial color={doubled ? 'royalblue' : '#3a3f4b'} />
      </mesh>
      {[0, 1].map((index) => (
        <mesh key={index} position={[index * 0.6 - 0.3, -1.6, 0]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshBasicMaterial color={index < clicks ? 'limegreen' : '#2a2a2a'} />
        </mesh>
      ))}
    </>
  );
}

/**
 * A real double click: two clicks, each lighting a lamp, then `onDoubleClick`, which turns the box blue.
 *
 * Left out of the three.js comparison: r3f v10 keeps what each pointerdown hit by `pointerId`, and
 * Chrome's `dblclick` is a plain MouseEvent with no `pointerId`, so r3f's own build looks up pointer 0
 * and never fires `onDoubleClick`; on three.js the box stays grey. This library's event layer gives
 * the `dblclick` the pointer of the last pointerdown (`src/events/pointerEvents.ts`).
 */
export const scene: TestScene = {
  parity: false,
  render: () => <Target />,
  act: async ({ mouse, frames }) => {
    await mouse.doubleClick(200, 150);
    await frames();
  },
};
