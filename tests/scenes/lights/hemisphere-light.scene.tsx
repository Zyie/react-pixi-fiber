import type { TestScene } from '@test-scene';

/**
 * A hemisphere light alone, sky blue above and brown below, over a white sphere, a white box and a tilted
 * plane. Each surface takes the sky colour where it faces up, the ground colour where it faces down and a
 * blend between, so the sphere shades from blue at the top to brown underneath and the box's top is
 * bluer than its sides.
 */
export const scene: TestScene = {
  camera: { position: [0, 1.5, 5] },
  render: () => (
    <>
      <hemisphereLight args={['#7fb8ff', '#8a5a2b', 2]} />
      <mesh position={[-1.4, 0, 0]}>
        <sphereGeometry args={[0.9, 48, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[1.2, 0, 0]} rotation={[0.4, 0.6, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, -1.2, -1]} rotation={[-1.1, 0, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#d0d0d0" />
      </mesh>
    </>
  ),
};
