import { useFrame, useThree } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useRef, useState } from 'react';
import type { ElementRef } from 'react';

/**
 * A box at the origin, and a camera to its left, facing it, that the scene isn't drawn from. On the third
 * frame the root's raycaster casts from that camera and a marker is put where it hit.
 */
function SideCamera() {
  const camera = useRef<ElementRef<'perspectiveCamera'>>(null);
  const box = useRef<ElementRef<'mesh'>>(null);
  const raycaster = useThree((state) => state.raycaster);
  const frame = useRef(0);
  const [hit, setHit] = useState<[number, number, number] | null>(null);

  useFrame(() => {
    if (++frame.current !== 3) return;
    raycaster.setFromCamera({ x: 0.2, y: 0.3 }, camera.current!);
    const [first] = raycaster.intersectObject(box.current!, false);

    if (first) setHit([first.point.x - 0.15, first.point.y, first.point.z]);
  });

  return (
    <>
      <perspectiveCamera ref={camera} position={[-6, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <mesh ref={box}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="#3a3f4b" />
      </mesh>
      {hit && (
        <mesh position={hit}>
          <sphereGeometry args={[0.15, 32, 16]} />
          <meshBasicMaterial color="hotpink" />
        </mesh>
      )}
    </>
  );
}

/**
 * Picking from a camera other than the one drawing: the ray is built from that camera's own matrices.
 * Seen from the front left, the marker sits on the box's left face, up and toward the viewer from its
 * centre, where a ray through (0.2, 0.3) of the side camera's view meets it.
 */
export const scene: TestScene = {
  camera: { position: [-4, 2, 5] },
  frames: 4,
  render: () => <SideCamera />,
};
