import type { TestScene } from '@test-scene';

const DEPTHS = [0, -3, -6, -9, -12];

/**
 * Exponential fog, `<fogExp2 attach="fog" args={['#aeb8c6', 0.12]} />`, over a pale background of the
 * same colour: the row of blue boxes fades from clear at the front to almost the background colour at
 * the back, closing in faster with distance than linear fog does
 */
export const scene: TestScene = {
  camera: { position: [2.5, 1.5, 5] },
  render: () => (
    <>
      <color attach="background" args={['#aeb8c6']} />
      <fogExp2 attach="fog" args={['#aeb8c6', 0.12]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      {DEPTHS.map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#3d6fb6" />
        </mesh>
      ))}
    </>
  ),
};
