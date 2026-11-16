import { useFrame } from '@react-fiber/threejs-compat';
import { DynamicDrawUsage, PlaneGeometry } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useMemo } from 'react';

/**
 * A plane whose vertices ripple: each frame writes new heights into its position attribute and sets
 * `needsUpdate`, and the normals are worked out again
 */
function Ripple({ position, dynamic }: { position: [number, number, number]; dynamic: boolean }) {
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(2.6, 2.6, 24, 24);
    if (dynamic) plane.getAttribute('position')!.setUsage(DynamicDrawUsage);
    return plane;
  }, [dynamic]);

  useFrame(({ elapsed }) => {
    const attribute = geometry.getAttribute('position')!;
    for (let i = 0; i < attribute.count; i++) {
      const x = attribute.getX(i);
      const y = attribute.getY(i);
      attribute.setZ(i, Math.sin(x * 2.4 + elapsed * 3) * Math.cos(y * 2.4) * 0.3);
    }
    attribute.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh geometry={geometry} position={position} rotation={[-0.9, 0, 0.3]}>
      <meshStandardMaterial color="#58c4a7" roughness={0.6} />
    </mesh>
  );
}

/**
 * `attribute.needsUpdate` after writing vertices: two planes rippling over 20 frames, the left packed
 * into pixi-3d's shared buffers again on each update, the right with `DynamicDrawUsage`, drawn from
 * its own buffers. Both show the twentieth frame's ripple.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 6] },
  frames: 20,
  render: () => (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 4, 3]} intensity={2.5} />
      <Ripple position={[-1.5, 0, 0]} dynamic={false} />
      <Ripple position={[1.5, 0, 0]} dynamic />
    </>
  ),
};
