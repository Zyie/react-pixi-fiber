import type { TestScene } from '@test-scene';
import { useState } from 'react';
import type { ElementRef } from 'react';
import type { ThreeEvent } from 'react-pixi-fiber';
import { createPortal } from 'react-pixi-fiber';

/** A plate that turns its colour on once the pointer is over it, and hides what is behind it from the pointer */
function Plate({
  position,
  color,
  userData,
}: {
  position: [number, number, number];
  color: string;
  userData?: Record<string, unknown>;
}) {
  const [reached, setReached] = useState(false);

  return (
    <mesh
      position={position}
      userData={userData}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setReached(true);
      }}
    >
      <boxGeometry args={[1.3, 1.3, 0.1]} />
      <meshBasicMaterial color={reached ? color : '#3a3f4b'} />
    </mesh>
  );
}

/** A group whose children are rendered through a portal with a higher event priority */
function Layer() {
  const [group, setGroup] = useState<ElementRef<'group'> | null>(null);

  return (
    <>
      <group ref={setGroup} />
      {group && createPortal(<Plate position={[-1, 0.3, -1.5]} color="orange" />, group, { events: { priority: 2 } })}
    </>
  );
}

/**
 * Two ways to win the pointer from a nearer object. Each plate turns its colour on once the pointer
 * reaches it, and stops propagation. Left: a plate behind another, rendered through `createPortal` with
 * `events: { priority: 2 }`; layers of higher priority are hit first, so it turns orange and hides the
 * nearer plate, which stays grey. Right: a plate behind another with `userData.interactivePriority`,
 * which sorts it ahead of objects without one; it turns green and the nearer one stays grey.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Layer />
      <Plate position={[-1.4, 0, 0.5]} color="hotpink" />
      <Plate position={[2.4, 0.3, -1.5]} color="limegreen" userData={{ interactivePriority: 1 }} />
      <Plate position={[1.2, 0, 0.5]} color="hotpink" />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(118, 148);
    await frames();
    await mouse.move(309, 137);
    await frames();
  },
};
