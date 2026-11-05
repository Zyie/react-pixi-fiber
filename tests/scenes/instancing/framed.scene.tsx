import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ElementRef } from 'react';
import { Matrix4 } from 'react-pixi-fiber/three';

/** Instances spread along x from `from`, and a lamp that is green while `onFramed` says the mesh is in view */
function Spread({ from, lamp }: { from: number; lamp: number }) {
  const mesh = useRef<ElementRef<'instancedMesh'>>(null);
  const [framed, setFramed] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    const matrix = new Matrix4();

    for (let i = 0; i < 4; i++) mesh.current!.setMatrixAt(i, matrix.makeTranslation(from + i * 0.8, 0.5, 0));
    mesh.current!.instanceMatrix.needsUpdate = true;
  }, [from]);

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, 4]} onFramed={setFramed}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color="#4363d8" />
      </instancedMesh>
      <mesh position={[lamp, -1.4, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshBasicMaterial color={framed === null ? '#2a2a2a' : framed ? '#3cb44b' : '#e6194b'} />
      </mesh>
    </>
  );
}

/**
 * `onFramed` on instanced meshes, which r3f tests against the camera's frustum by the mesh's
 * `boundingSphere`, worked out from every instance. Both meshes sit at the origin. The first has its
 * four boxes in view, in a row across the middle: its lamp on the left is green. The second has its
 * boxes far off to the right, out of view, so its lamp on the right is red, though the mesh's own
 * position is in view.
 */
export const scene: TestScene = {
  frames: 3,
  render: () => (
    <>
      <Spread from={-1.2} lamp={-0.6} />
      <Spread from={12} lamp={0.6} />
    </>
  ),
};
