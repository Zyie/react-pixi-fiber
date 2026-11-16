import { useFrame } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useRef, useState } from 'react';
import type { ElementRef } from 'react';

type Change = 'hide' | 'move' | 'none';

/** A box that hides itself or moves out of view on the second frame, and reports `onVisible` */
function Watched({ x, change, onVisible }: { x: number; change: Change; onVisible: (visible: boolean) => void }) {
  const mesh = useRef<ElementRef<'mesh'>>(null);
  const frame = useRef(0);

  useFrame(() => {
    if (++frame.current !== 2) return;
    if (change === 'hide') mesh.current!.visible = false;
    if (change === 'move') mesh.current!.position.y = 50;
  });

  return (
    <mesh ref={mesh} position={[x, 0.9, 0]} onVisible={onVisible}>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshBasicMaterial color="#5d9de0" />
    </mesh>
  );
}

/** One watched box and, below it, a disc per `onVisible` call in order: green for visible, red for not */
function Column({ x, change }: { x: number; change: Change }) {
  const [calls, setCalls] = useState<boolean[]>([]);

  return (
    <>
      <Watched x={x} change={change} onVisible={(visible) => setCalls((previous) => [...previous, visible])} />
      {calls.map((visible, index) => (
        <mesh key={index} position={[x, -0.3 - index * 0.7, 0]}>
          <sphereGeometry args={[0.25, 32, 16]} />
          <meshBasicMaterial color={visible ? 'limegreen' : 'crimson'} />
        </mesh>
      ))}
    </>
  );
}

/**
 * `onVisible` fires when a box's combined visibility changes: in the camera's frustum and `visible`.
 * There are no occlusion queries on WebGL or on pixi-3d, so occlusion never hides a box. The left box
 * stays and shows one green disc; the middle one sets `visible = false` on the second frame and shows a
 * green disc then a red one, with the box gone; the right one moves out of view and shows the same.
 */
export const scene: TestScene = {
  frames: 4,
  render: () => (
    <>
      <Column x={-1.5} change="none" />
      <Column x={0} change="hide" />
      <Column x={1.5} change="move" />
    </>
  ),
};
