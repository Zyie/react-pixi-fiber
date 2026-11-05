import type { TestScene } from '@test-scene';

const DEPTHS = [0, -3, -6, -9, -12];

/**
 * Linear fog the colour of the background, `<fog attach="fog" args={['#202030', 4, 13]} />`: a row of
 * lit boxes runs from the camera into the distance: the front one clear, the next two fainter and
 * fainter, and the last two gone into the background
 */
export const scene: TestScene = {
  camera: { position: [2.5, 1.5, 5] },
  render: () => (
    <>
      <color attach="background" args={['#202030']} />
      <fog attach="fog" args={['#202030', 4, 13]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      {DEPTHS.map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#f0ad4e" />
        </mesh>
      ))}
    </>
  ),
};
