import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A box that turns orange once a click hits it */
function Box({ position }: { position: [number, number, number] }) {
  const [hit, setHit] = useState(false);

  return (
    <mesh position={position} rotation={[0.4, 0.6, 0]} onClick={() => setHit(true)}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshBasicMaterial color={hit ? 'orange' : '#3a3f4b'} />
    </mesh>
  );
}

/**
 * Picking through an orthographic camera, whose rays run parallel from its near plane rather than
 * fanning out from a point. Three boxes at different depths; real clicks on the left and right ones
 * turn them orange, and a click between the boxes hits nothing.
 */
export const scene: TestScene = {
  canvas: { orthographic: true },
  camera: { position: [2, 2, 10], zoom: 60 },
  render: () => (
    <>
      <Box position={[-1.8, 0, -3]} />
      <Box position={[0, 0, 0]} />
      <Box position={[1.8, 0, 2]} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(130, 134);
    await mouse.click(282, 198);
    await mouse.click(250, 120);
    await frames();
  },
};
