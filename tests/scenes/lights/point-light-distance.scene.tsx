import type { TestScene } from '@test-scene';

/**
 * Two point lights over a grey floor with no other light. The left one is white with `distance={3}`
 * as a prop, the right one blue with a distance of 2 through `args`. Each lights a pool on the floor
 * that fades to black where the light stops reaching, so the pools are round, the right one smaller.
 */
export const scene: TestScene = {
  camera: { position: [0, 6, 5] },
  render: () => (
    <>
      <pointLight position={[-1.5, 1, 0]} intensity={4} distance={3} />
      <pointLight position={[1.8, 1, 0]} args={['#5d9de0', 4, 2]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    </>
  ),
};
