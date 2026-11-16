import type { TestScene } from '@test-scene';
import { useState } from 'react';

/**
 * Clicks: the left cube is in a `<container3D>` with an `onClick` of its own, and turns blue on its own
 * `onClick`; the container's handler, reached as the event bubbles, turns the small sphere above it green.
 * The right cube has only `onPointerMissed`, which turns it yellow when a click misses it. One click on
 * the left cube: it is blue, the sphere green, and the right cube yellow.
 */
function Clicks() {
  const [clicked, setClicked] = useState(false);
  const [bubbled, setBubbled] = useState(false);
  const [missed, setMissed] = useState(false);

  return (
    <>
      <container3D position={[-1.5, 0, 0]} onClick={() => setBubbled(true)}>
        <mesh3D onClick={() => setClicked(true)}>
          <cubeGeometry3D args={[{ width: 1.4, height: 1.4, depth: 1.4 }]} />
          <flatMaterial3D baseColor={clicked ? '#4363d8' : '#e6194b'} />
        </mesh3D>
      </container3D>
      <mesh3D position={[-1.5, 1.5, 0]} scale={0.3}>
        <sphereGeometry3D />
        <flatMaterial3D baseColor={bubbled ? '#3cb44b' : '#404040'} />
      </mesh3D>
      <mesh3D position={[1.5, 0, 0]} onPointerMissed={() => setMissed(true)}>
        <cubeGeometry3D args={[{ width: 1.4, height: 1.4, depth: 1.4 }]} />
        <flatMaterial3D baseColor={missed ? '#ffe119' : '#808080'} />
      </mesh3D>
    </>
  );
}

export const scene: TestScene = {
  render: () => <Clicks />,
  act: async ({ mouse, frames }) => {
    await mouse.click(200 - 1.5 * 64.3, 150);
    await frames();
  },
};
