import { useThree } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useState } from 'react';

/** A box that turns its colour on once clicked */
function Box({ x, color }: { x: number; color: string }) {
  const [clicked, setClicked] = useState(false);

  return (
    <mesh position={[x, 0, 0]} onClick={() => setClicked(true)}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshBasicMaterial color={clicked ? color : '#3a3f4b'} />
    </mesh>
  );
}

/** Sets a compute that mirrors the pointer left to right before casting */
function MirroredPointer() {
  const setEvents = useThree((state) => state.setEvents);

  useLayoutEffect(
    () =>
      setEvents({
        compute: (event, state) => {
          state.pointer.set(1 - (event.offsetX / state.size.width) * 2, 1 - (event.offsetY / state.size.height) * 2);
          state.raycaster.setFromCamera(state.pointer, state.camera);
        },
      }),
    [setEvents],
  );

  return null;
}

/**
 * The event layer's `compute`, which turns a DOM event into the pointer and the ray: this one mirrors
 * the pointer left to right. A click on the left box hits the right one, which turns orange, and the
 * left box stays grey.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <MirroredPointer />
      <Box x={-1.5} color="hotpink" />
      <Box x={1.5} color="orange" />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(104, 150);
    await frames();
  },
};
