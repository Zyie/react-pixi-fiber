import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A box that turns green when clicked */
function Target() {
  const [clicked, setClicked] = useState(false);

  return (
    <mesh position={[1.5, 0, 0]} onClick={() => setClicked(true)}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshBasicMaterial color={clicked ? 'limegreen' : 'gray'} />
    </mesh>
  );
}

/** A box that turns orange when a click misses every object */
function Witness() {
  const [missed, setMissed] = useState(false);

  return (
    <mesh position={[-1.5, 0, 0]} onPointerMissed={() => setMissed(true)}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshBasicMaterial color={missed ? 'orange' : 'gray'} />
    </mesh>
  );
}

/**
 * Real clicks: one on an empty corner fires `onPointerMissed` (the left box turns orange), one on the
 * right box fires its `onClick` (it turns green)
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Witness />
      <Target />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(10, 10);
    await frames();
    await mouse.click(295, 150);
    await frames();
  },
};
