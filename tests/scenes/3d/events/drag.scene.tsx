import { Plane, Vector3 } from '@pixi/3d';
import type { FiberEvent } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { useRef, useState } from 'react';

const floor = new Plane(new Vector3(0, 0, 1), 0);

/** A cube dragged across the z = 0 plane; with `capture`, it holds the pointer while the button is down */
function Draggable({ x, capture, color }: { x: number; capture: boolean; color: string }) {
  const [position, setPosition] = useState<[number, number, number]>([x, -0.6, 0]);
  const [held, setHeld] = useState(false);
  const dragging = useRef(false);
  const target = useRef(new Vector3());

  const onPointerDown = (event: FiberEvent<PointerEvent>) => {
    dragging.current = true;
    if (capture) {
      event.target.setPointerCapture(event.pointerId);
      setHeld(event.target.hasPointerCapture(event.pointerId));
    }
  };
  const onPointerMove = (event: FiberEvent<PointerEvent>) => {
    if (!dragging.current || !event.ray.intersectPlane(floor, target.current)) return;
    setPosition([target.current.x, target.current.y, 0]);
  };
  const onPointerUp = (event: FiberEvent<PointerEvent>) => {
    dragging.current = false;
    if (capture) {
      event.target.releasePointerCapture(event.pointerId);
      setHeld(false);
    }
  };

  return (
    <>
      <mesh3D position={position} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <cubeGeometry3D args={[{ width: 0.8, height: 0.8, depth: 0.8 }]} />
        <flatMaterial3D baseColor={color} />
      </mesh3D>
      <mesh3D position={[x, -1.7, 0]}>
        <cubeGeometry3D args={[{ width: 0.3, height: 0.3, depth: 0.3 }]} />
        <flatMaterial3D baseColor={held ? '#3cb44b' : '#2a2a2a'} />
      </mesh3D>
    </>
  );
}

/**
 * Pointer capture: two cubes are dragged up and to the side in one quick move that leaves each cube
 * behind. The left cube captured the pointer on pointerdown (`event.target.setPointerCapture`), so it
 * still gets the move, finds where the event's `ray` (a @pixi/3d `Ray`) crosses z = 0, and lands under
 * the pointer; the right cube didn't, so the move misses it and it stays put. The lamp under the left
 * cube lit while `hasPointerCapture` was true, and is dark again once pointerup released it.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Draggable x={-1.4} capture color="#4363d8" />
      <Draggable x={1.4} capture={false} color="#e6194b" />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(110, 189);
    await mouse.down();
    await mouse.move(150, 80);
    await mouse.up();
    await frames();
    await mouse.move(290, 189);
    await mouse.down();
    await mouse.move(250, 80);
    await mouse.up();
    await frames();
  },
};
