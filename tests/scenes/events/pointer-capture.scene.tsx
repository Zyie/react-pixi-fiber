import type { ThreeEvent } from '@react-fiber/threejs-compat';
import { Plane, Vector3 } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useRef, useState } from 'react';

const floor = new Plane(new Vector3(0, 0, 1), 0);

/** A box dragged across the z = 0 plane; with `capture`, it holds the pointer while the button is down */
function Draggable({ x, capture, color }: { x: number; capture: boolean; color: string }) {
  const [position, setPosition] = useState<[number, number, number]>([x, -0.6, 0]);
  const [held, setHeld] = useState(false);
  const dragging = useRef(false);
  const target = useRef(new Vector3());

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    dragging.current = true;
    if (capture) {
      event.target.setPointerCapture(event.pointerId);
      setHeld(event.target.hasPointerCapture(event.pointerId));
    }
  };
  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !event.ray.intersectPlane(floor, target.current)) return;
    setPosition([target.current.x, target.current.y, 0]);
  };
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    dragging.current = false;
    if (capture) {
      event.target.releasePointerCapture(event.pointerId);
      setHeld(false);
    }
  };

  return (
    <>
      <mesh position={position} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[x, -1.7, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshBasicMaterial color={held ? '#3cb44b' : '#2a2a2a'} />
      </mesh>
    </>
  );
}

/**
 * Pointer capture: two boxes are dragged up and to the side in one quick move that leaves each box
 * behind. The left box captured the pointer on pointerdown (`event.target.setPointerCapture`), so it
 * still gets the move and lands under the pointer; the right box didn't, so the move misses it and it
 * stays put. The lamp under the left box lit while `hasPointerCapture` was true, and goes dark when
 * pointerup releases it; it is dark at the end.
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
