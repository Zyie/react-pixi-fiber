import type { TestScene } from '@test-scene';

/**
 * A spot light casting a shadow: it shines down at the floor from above and to the left, and the box in
 * its pool casts a shadow away from it, toward the right
 */
export const scene: TestScene = {
  camera: { position: [0, 5, 6] },
  canvas: { renderer: { shadows: true } },
  render: () => (
    <>
      <ambientLight intensity={0.1} />
      <spotLight position={[-2.5, 4, 1]} angle={0.6} penumbra={0.2} intensity={60} castShadow />
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#5d9de0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    </>
  ),
};
