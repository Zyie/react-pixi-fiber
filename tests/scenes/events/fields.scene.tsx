import type { TestScene } from '@test-scene';
import { useState } from 'react';
import type { ThreeEvent } from 'react-pixi-fiber';
import { useThree } from 'react-pixi-fiber';

import { Checks } from './event-log';

const close = (a: number, b: number, tolerance = 1e-4): boolean => Math.abs(a - b) < tolerance;

function Fields() {
  const camera = useThree((state) => state.camera);
  const [checks, setChecks] = useState<boolean[]>([]);

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    const native = event.nativeEvent as PointerEvent;
    const { offsetX, offsetY } = native;
    const stoppedBefore = event.stopped;

    event.stopPropagation();
    setChecks([
      event.intersections.length === 2 && event.intersections[1].object.name === 'back',
      event.object === event.eventObject && event.object.name === 'front',
      event.delta === 12,
      close(event.distance, event.ray.origin.distanceTo(event.point)),
      close(event.point.z, 0.5, 1e-3),
      event.camera === camera,
      close(event.pointer.x, (offsetX / 400) * 2 - 1) && close(event.pointer.y, 1 - (offsetY / 300) * 2),
      event.ray.distanceToPoint(event.unprojectedPoint) < 1e-3,
      event.face !== null && event.faceIndex! >= 0 && event.uv !== undefined,
      event.type === 'click' && native.type === 'click' && event.pointerId === native.pointerId,
      !stoppedBefore && event.stopped,
    ]);
  };

  return (
    <>
      <mesh name="front" position={[-0.4, 0.4, 0]} onClick={onClick}>
        <boxGeometry args={[1.2, 1.2, 1]} />
        <meshBasicMaterial color="#4363d8" />
      </mesh>
      <mesh name="back" position={[0.4, 0.6, -1.5]} onClick={() => {}}>
        <boxGeometry args={[1.2, 1.2, 1]} />
        <meshBasicMaterial color="#3a3f4b" />
      </mesh>
      <Checks checks={checks} />
    </>
  );
}

/**
 * The fields of a click event, each checked by a lamp that is green when it holds: `intersections`
 * (both boxes under the pointer, nearest first), `object` and `eventObject`, `delta` (the press is
 * dragged 12 px), `distance` along `ray` to `point`, `point` on the front face, `camera`, `pointer` in
 * device coordinates, `unprojectedPoint` on the ray, `face`, `faceIndex` and `uv`, the native event's
 * fields and `nativeEvent`, and `stopped` after `stopPropagation()`. Eleven green lamps.
 */
export const scene: TestScene = {
  render: () => <Fields />,
  act: async ({ mouse, frames }) => {
    await mouse.move(190, 115);
    await mouse.down();
    await mouse.move(202, 115);
    await mouse.up();
    await frames();
  },
};
