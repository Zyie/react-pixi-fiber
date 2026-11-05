import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A box that turns pink while the pointer is over it */
function HoverBox({ position }: { position: [number, number, number] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh position={position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={hovered ? 'hotpink' : '#3a3f4b'} />
    </mesh>
  );
}

const Boxes = ({ left, right }: { left: [number, number, number]; right: [number, number, number] }) => (
  <>
    <HoverBox position={left} />
    <HoverBox position={right} />
  </>
);

/**
 * `events.update()`, which raycasts the last pointer event again, for objects that move under a still
 * pointer. The pointer rests on empty space in the middle. The left box moves under it and nothing
 * happens, since r3f only raycasts on input. It moves back out, and the right box moves under the
 * pointer, followed by `events.update()`: the right box turns pink.
 */
export const scene: TestScene = {
  render: () => <Boxes left={[-2, 0, 0]} right={[2, 0, 0]} />,
  act: async ({ mouse, frames, update }, state) => {
    await mouse.move(200, 150);
    await update(<Boxes left={[0, 0, 0]} right={[2, 0, 0]} />);
    await frames();
    await update(<Boxes left={[-1.2, 0, 0]} right={[0.2, 0, 0]} />);
    state.events.update!();
    await frames();
  },
};
