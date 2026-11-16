import { useThree } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useLayoutEffect } from 'react';

import { EventLog, useEventLog } from './event-log';

const WHO = { left: '#4363d8', right: '#e6194b', canvas: '#888888' };

function Targets() {
  const [entries, log] = useEventLog();
  const set = useThree((state) => state.set);

  useLayoutEffect(() => set({ onPointerMissed: () => log('canvas', 'missed') }), [set, log]);

  return (
    <>
      {(['left', 'right'] as const).map((name, index) => (
        <mesh
          key={name}
          position={[index * 2.4 - 1.2, 0.4, 0]}
          onClick={() => log(name, 'click')}
          onPointerMissed={() => log(name, 'missed')}
        >
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshBasicMaterial color={WHO[name]} />
        </mesh>
      ))}
      <EventLog entries={entries} who={WHO} />
    </>
  );
}

/**
 * `onPointerMissed`, on objects and on the root. A click on the left box logs the right box's missed
 * (white) and then the left box's click (cyan): a click that hits one object is a miss for the rest. A
 * click on empty space logs a miss for both boxes, then the root's own `onPointerMissed` (grey top),
 * which only fires when nothing was hit. Last, a press on empty space dragged 12 px before release
 * logs nothing: a miss needs the pointer to stay within 2 px.
 */
export const scene: TestScene = {
  render: () => <Targets />,
  act: async ({ mouse, frames }) => {
    await mouse.click(123, 124);
    await mouse.click(200, 40);
    await mouse.move(200, 260);
    await mouse.down();
    await mouse.move(212, 260);
    await mouse.up();
    await frames();
  },
};
