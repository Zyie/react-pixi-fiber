import type { TestScene } from '@test-scene';
import { useState } from 'react';

import { EventLog, useEventLog } from './event-log';

const WHO = { box: '#4363d8' };

/** A box that logs its over, out, leave and cancel handlers, and turns pink while hovered */
function Box() {
  const [entries, log] = useEventLog();
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <mesh
        position={[0, 0.4, 0]}
        onPointerOver={() => (log('box', 'over'), setHovered(true))}
        onPointerOut={() => (log('box', 'out'), setHovered(false))}
        onPointerLeave={() => log('box', 'leave')}
        onPointerCancel={() => log('box', 'click')}
      >
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshBasicMaterial color={hovered ? 'hotpink' : WHO.box} />
      </mesh>
      <EventLog entries={entries} who={WHO} />
    </>
  );
}

/**
 * A cancelled pointer, as r3f handles it: the pointer moves over the box (it turns pink and logs over,
 * green), then the browser cancels it, here a `pointercancel` dispatched on the canvas. r3f ends the
 * pointer's hovers, so the box turns back and logs out (red) and leave (orange). It never calls the
 * box's own `onPointerCancel`, which would log a cyan column: three entries in all.
 */
export const scene: TestScene = {
  render: () => <Box />,
  act: async ({ mouse, frames }, state) => {
    await mouse.move(200, 124);
    state.events.connected!.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true }));
    await frames();
  },
};
