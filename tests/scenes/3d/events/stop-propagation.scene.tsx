import type { ThreeEvent } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A plate that turns orange while hovered; with `stop`, it hides whatever is behind it from the pointer */
function Plate({
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
    <mesh3D
      position={position}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        if (stop) event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <cubeGeometry3D args={[{ width: 1.4, height: 1.4, depth: 0.05 }]} />
      <flatMaterial3D baseColor={hovered ? '#ffa500' : color} />
    </mesh3D>
  );
}

/**
 * `stopPropagation` hides the objects behind: three overlapping plates step back from left to right,
 * and the middle one stops propagation on pointer over. With the pointer where all three overlap, the
 * front (pink) and middle (aquamarine) plates turn orange, while the back one (light blue) stays as it
 * is. Then the pointer moves to where only the middle and back plates overlap: the front plate gets its
 * pointer out and is pink again, and the back plate is still hidden behind the middle one.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Plate color="#ff69b4" position={[-0.5, 0.3, 0]} />
      <Plate stop color="#7fffd4" position={[0, 0, -0.5]} />
      <Plate color="#add8e6" position={[0.5, -0.3, -1]} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(200, 150);
    await frames();
    await mouse.move(235, 175);
    await frames();
  },
};
