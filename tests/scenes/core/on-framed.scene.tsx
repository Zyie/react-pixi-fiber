import type { TestScene } from '@test-scene';
import { useRef, useState } from 'react';
import type { ElementRef } from 'react';
import { useFrame } from 'react-pixi-fiber';

/** A box that `useFrame` moves far out of view on the second frame */
function Mover({ onFramed }: { onFramed: (inView: boolean) => void }) {
  const mesh = useRef<ElementRef<'mesh'>>(null);
  const frame = useRef(0);

  useFrame(() => {
    if (++frame.current === 2) mesh.current!.position.x = 100;
  });

  return (
    <mesh ref={mesh} position={[0, 0.8, 0]} onFramed={onFramed}>
      <boxGeometry />
      <meshBasicMaterial color="#5d9de0" />
    </mesh>
  );
}

/** The mover, and a row of discs: one per `onFramed` call, in order, green for in view and red for out */
function Witness() {
  const [calls, setCalls] = useState<boolean[]>([]);

  return (
    <>
      <Mover onFramed={(inView) => setCalls((previous) => [...previous, inView])} />
      {calls.map((inView, index) => (
        <mesh key={index} position={[-1.5 + index, -1, 0]}>
          <sphereGeometry args={[0.35, 32, 16]} />
          <meshBasicMaterial color={inView ? 'limegreen' : 'crimson'} />
        </mesh>
      ))}
    </>
  );
}

/**
 * `onFramed` against the camera's frustum: it fires `true` on the first frame, when the box is in view,
 * and `false` once the box has left. The box is gone, and the row shows a green disc then a red one.
 */
export const scene: TestScene = {
  frames: 4,
  render: () => <Witness />,
};
