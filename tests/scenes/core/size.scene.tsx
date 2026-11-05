import type { TestScene } from '@test-scene';

/**
 * A portrait canvas, 240 by 320: the camera's aspect follows it, so the sphere stays round. The default
 * camera's fov of 50 shows 2.33 units above the centre, so the small box at y 1.8 sits just under the
 * top edge, its lower part behind the sphere.
 */
export const scene: TestScene = {
  size: { width: 240, height: 320 },
  render: () => (
    <>
      <mesh>
        <sphereGeometry args={[1.5, 48, 24]} />
        <meshBasicMaterial color="#f0ad4e" />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </>
  ),
};
