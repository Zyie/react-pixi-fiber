import type { ThreeEvent } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A plane that turns orange while hovered; with `stop`, it hides whatever is behind it from the pointer */
function Plane({
  stop = false,
  color,
  position,
}: {
  stop?: boolean;
  color: string;
  position: [number, number, number];
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={position}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        if (stop) event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1.4, 1.4, 0.05]} />
      <meshBasicMaterial color={hovered ? 'orange' : color} />
    </mesh>
  );
}

/**
 * `stopPropagation` hides the objects behind: three overlapping plates step back from left to right,
 * and the middle one stops propagation on pointer over. With the pointer where all three overlap, the
 * front (pink) and middle (aquamarine) plates turn orange, while the back one (light blue) stays as it
 * is: the middle plate kept the event from reaching it. Then the pointer moves to where only the back
 * and middle plates overlap: the front plate gets its pointer out, and the back plate is still hidden.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 5] },
  render: () => (
    <>
      <Plane color="hotpink" position={[-0.5, 0.3, 0]} />
      <Plane stop color="aquamarine" position={[0, 0, -0.5]} />
      <Plane color="lightblue" position={[0.5, -0.3, -1]} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(185, 150);
    await frames();
    await mouse.move(235, 175);
    await frames();
  },
};
