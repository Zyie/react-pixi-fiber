import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A box that turns hot pink while the pointer is over it */
function HoverBox({ x }: { x: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh position={[x, 0, 0]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshBasicMaterial color={hovered ? 'hotpink' : 'gray'} />
    </mesh>
  );
}

/** `onPointerOver` from a real mouse move over the right box: it turns pink and the left one stays grey */
export const scene: TestScene = {
  render: () => (
    <>
      <HoverBox x={-1.5} />
      <HoverBox x={1.5} />
    </>
  ),
  // The right box spans about x 247 to 343 and y 102 to 198 of the 400 by 300 canvas.
  act: async ({ mouse, frames }) => {
    await mouse.move(295, 150);
    await frames();
  },
};
