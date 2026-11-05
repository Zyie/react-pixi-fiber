import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A box that counts its clicks with a row of lamps */
function Counter({ x, color }: { x: number; color: string }) {
  const [clicks, setClicks] = useState(0);

  return (
    <>
      <mesh position={[x, 0.3, 0]} onClick={() => setClicks((count) => count + 1)}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {[0, 1].map((index) => (
        <mesh key={index} position={[x + index * 0.5 - 0.25, -1.4, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshBasicMaterial color={index < clicks ? '#3cb44b' : '#2a2a2a'} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Turning the event layer off and on through the root's `events`. Each box counts its clicks with the
 * lamps under it. The left box is clicked with `events.enabled` false, which drops the click, then
 * again once it is true: one lamp. The right box is clicked after `events.disconnect()`, which takes
 * the listeners off the canvas, then again after `events.connect(canvas)` puts them back: one lamp.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Counter x={-1.4} color="#4363d8" />
      <Counter x={1.4} color="#e6194b" />
    </>
  ),
  act: async ({ mouse, frames }, state) => {
    state.setEvents({ enabled: false });
    await mouse.click(110, 130);
    state.setEvents({ enabled: true });
    await mouse.click(110, 130);

    const canvas = state.events.connected!;

    state.events.disconnect!();
    await mouse.click(290, 130);
    state.events.connect!(canvas);
    await mouse.click(290, 130);
    await frames();
  },
};
