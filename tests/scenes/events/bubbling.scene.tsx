import type { TestScene } from '@test-scene';
import type { ThreeEvent } from 'react-pixi-fiber';

import { EventLog, useEventLog } from './event-log';

const WHO = { front: '#e6194b', inner: '#f58231', outer: '#ffe119', back: '#4363d8' };

function Nested({ stop }: { stop: boolean }) {
  const [entries, log] = useEventLog();
  const click = (who: string) => (event: ThreeEvent<MouseEvent>) => {
    if (event.object.name === 'front' || event.object.name === 'back') log(who, 'click');
    if (stop && who === 'front') event.stopPropagation();
  };

  return (
    <>
      <group name="outer" onClick={click('outer')}>
        <group name="inner" position={[0, 0.5, 0]} onClick={click('inner')}>
          <mesh name="front" position={[-0.3, 0, 1]} onClick={click('front')}>
            <boxGeometry args={[1, 1, 0.2]} />
            <meshBasicMaterial color={WHO.front} />
          </mesh>
        </group>
      </group>
      <mesh name="back" position={[0.3, 0.5, -1]} onClick={click('back')}>
        <boxGeometry args={[1.6, 1.6, 0.2]} />
        <meshBasicMaterial color={WHO.back} />
      </mesh>
      <EventLog entries={entries} who={WHO} />
    </>
  );
}

/**
 * Bubbling, as r3f documents it: a click goes to the nearest object hit, up through its ancestors, then
 * to the next object hit behind it. A red plate inside two groups sits in front of a blue plate; a click
 * where they overlap logs, left to right: the red plate, its inner group (orange), its outer group
 * (yellow), then the blue plate behind. Each column's top is the object whose handler ran and its
 * bottom is the handler, cyan for a click; every handler sees the red plate as `object` until the blue
 * plate's turn.
 */
export const scene: TestScene = {
  render: () => <Nested stop={false} />,
  act: async ({ mouse, frames }) => {
    await mouse.click(205, 105);
    await frames();
  },
};
