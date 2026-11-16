import type { ThreeEvent } from '@react-fiber/threejs-compat';
import { useThree } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useState } from 'react';

/** A plate that turns its colour on when clicked, and stops the click there */
function Plate({ z, x, color }: { z: number; x: number; color: string }) {
  const [clicked, setClicked] = useState(false);

  return (
    <mesh
      position={[x, 0, z]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        setClicked(true);
      }}
    >
      <boxGeometry args={[1.5, 1.5, 0.1]} />
      <meshBasicMaterial color={clicked ? color : '#3a3f4b'} />
    </mesh>
  );
}

/** Sets the root's event filter to take the farthest hit first */
function FarthestFirst() {
  const setEvents = useThree((state) => state.setEvents);

  useLayoutEffect(() => setEvents({ filter: (items) => [...items].reverse() }), [setEvents]);

  return null;
}

/**
 * The event layer's `filter`, which can reorder the hits before handlers run: here it reverses them,
 * so the farthest object comes first. Two plates overlap and each stops propagation on click; a click
 * where they overlap reaches the back plate (blue) instead of the front one, which stays grey.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <FarthestFirst />
      <Plate x={-0.4} z={1} color="hotpink" />
      <Plate x={0.4} z={-1} color="royalblue" />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(205, 150);
    await frames();
  },
};
