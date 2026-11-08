import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { useState } from 'react';
import type { ThreeEvent } from 'react-pixi-fiber';

/** A box that turns orange once hovered; with `stop`, it hides what is behind it from the pointer */
function Box({ x, stop }: { x: number; stop: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={[x, 0, 0]}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        if (stop) event.stopPropagation();
        setHovered(true);
      }}
    >
      <boxGeometry args={[1.4, 1.4, 1.4]} />
      <meshBasicMaterial color={hovered ? 'orange' : '#4f86f7'} />
    </mesh>
  );
}

/** A 2D panel behind the 3D that turns pink once hovered */
function Panel({ x }: { x: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <graphics2D
      zIndex={-1}
      x={x}
      y={60}
      draw={(graphics) => graphics.rect(0, 0, 170, 180).fill(hovered ? 0xff69b4 : 0x444444)}
      onPointerOver={() => setHovered(true)}
    />
  );
}

/**
 * 2D behind the 3D is hit after it. Two grey panels with `zIndex={-1}` sit behind two blue boxes, and
 * each turns a colour for good once hovered. The pointer hovers each box where it covers its panel. The
 * left box stops propagation, so its panel stays grey; the right box doesn't, so the event goes on to
 * the panel behind it, which turns pink. Both boxes are orange.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => (
    <>
      <Box x={-1.5} stop />
      <Box x={1.5} stop={false} />
      <Panel x={15} />
      <Panel x={215} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(108, 150);
    await frames();
    await mouse.move(292, 150);
    await frames();
  },
};
