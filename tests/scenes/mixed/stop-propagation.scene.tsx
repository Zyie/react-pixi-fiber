import type { ThreeEvent2D } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A box that turns orange once the pointer has been over it */
function Box({ x }: { x: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh position={[x, 0, 0]} onPointerOver={() => setHovered(true)}>
      <boxGeometry args={[1.6, 1.6, 1.6]} />
      <meshBasicMaterial color={hovered ? 'orange' : '#4f86f7'} />
    </mesh>
  );
}

/** A 2D card over a box, which turns pink once hovered; with `stop`, it hides the box from the pointer */
function Card({ x, stop }: { x: number; stop: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <graphics2D
      x={x}
      y={130}
      draw={(graphics) => graphics.rect(0, 0, 80, 80).fill(hovered ? 0xff69b4 : 0xdddddd)}
      onPointerOver={(event: ThreeEvent2D<PointerEvent>) => {
        if (stop) event.stopPropagation();
        setHovered(true);
      }}
    />
  );
}

/**
 * One event system for 2D and 3D: a grey 2D card is drawn over each of two blue boxes, and each turns
 * a colour for good once the pointer has been over it. The pointer hovers the left card, which stops
 * propagation, then the right card, which doesn't. Both cards are pink; the left box stayed blue,
 * because the card in front of it stopped the event, and the right box is orange, because the event
 * went on through its card to the box behind it.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Box x={-1.5} />
      <Box x={1.5} />
      <Card x={85} stop />
      <Card x={235} stop={false} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(120, 170);
    await frames();
    await mouse.move(270, 170);
    await frames();
  },
};
