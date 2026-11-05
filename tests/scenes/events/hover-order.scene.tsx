import type { TestScene } from '@test-scene';

import { EventLog, useEventLog } from './event-log';

const WHO = { left: '#e6194b', right: '#4363d8', group: '#888888' };

function Pair() {
  const [entries, log] = useEventLog();
  const box = (name: 'left' | 'right', x: number) => (
    <mesh position={[x, 0.5, 0]} onPointerOver={() => log(name, 'over')} onPointerOut={() => log(name, 'out')}>
      <boxGeometry args={[1.1, 1.1, 1.1]} />
      <meshBasicMaterial color={WHO[name]} />
    </mesh>
  );

  return (
    <>
      <group
        onPointerOver={() => log('group', 'over')}
        onPointerOut={() => log('group', 'out')}
        onPointerEnter={() => log('group', 'enter')}
        onPointerLeave={() => log('group', 'leave')}
      >
        {box('left', -0.7)}
        {box('right', 0.7)}
      </group>
      <EventLog entries={entries} who={WHO} />
    </>
  );
}

/**
 * Over and out against enter and leave on nested objects: a group holds a red and a blue box that
 * touch. The pointer moves onto the red box, across to the blue one, then off both. The log shows, in
 * order, what r3f does: enter and leave behave like over and out (r3f doesn't implement the DOM's
 * enter and leave), so moving between two children of the group takes the group out and back in.
 *
 * Expected, left to right (top: object, bottom: green over, red out, lime enter, orange leave): red
 * over, group over, group enter; red out, group out, group leave, blue over, group over, group enter;
 * blue out, group out, group leave.
 */
export const scene: TestScene = {
  render: () => <Pair />,
  act: async ({ mouse, frames }) => {
    await mouse.move(160, 118);
    await mouse.move(250, 118);
    await mouse.move(250, 40);
    await frames();
  },
};
