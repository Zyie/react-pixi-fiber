import { useThree } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useLayoutEffect } from 'react';

import { EventLog, useEventLog } from './event-log';

const WHO = { left: '#4363d8', right: '#e6194b', canvas: '#888888' };

function Targets() {
  const [entries, log] = useEventLog();
  const set = useThree((state) => state.set);

  useLayoutEffect(() => set({ onDropMissed: () => log('canvas', 'missed') }), [set, log]);

  return (
    <>
      {(['left', 'right'] as const).map((name, index) => (
        <mesh
          key={name}
          position={[index * 2.4 - 1.2, 0.4, 0]}
          onDragOverEnter={() => log(name, 'enter')}
          onDragOver={() => log(name, 'over')}
          onDragOverLeave={() => log(name, 'leave')}
          onDrop={() => log(name, 'drop')}
          onDropMissed={() => log(name, 'missed')}
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
 * Drag and drop: DragEvents dispatched on the canvas, as a file dragged in from the desktop sends
 * them. A drag over the left box, then over the right one, a drop on the right box, then a drop on
 * empty space. The log reads, left to right: left drag-over-enter (lime) and drag-over (green); left
 * drag-over-leave (orange); right enter and over; right drop (magenta); then the misses (white) of
 * both boxes and of the root's `onDropMissed` (grey top).
 */
export const scene: TestScene = {
  render: () => <Targets />,
  act: async ({ frames }, state) => {
    const canvas = state.events.connected!;
    const { left, top } = canvas.getBoundingClientRect();
    const drag = (type: string, x: number, y: number) =>
      canvas.dispatchEvent(
        new DragEvent(type, { bubbles: true, cancelable: true, clientX: left + x, clientY: top + y }),
      );

    drag('dragover', 123, 124);
    drag('dragover', 277, 124);
    drag('drop', 277, 124);
    drag('drop', 200, 40);
    await frames();
  },
};
