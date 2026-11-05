import type { TestScene } from '@test-scene';

/**
 * The default camera from `camera` options: moved up and to the side with a narrower fov. r3f aims a
 * default camera at the origin, so the box sits in the middle with three of its faces showing, the
 * sphere to its left and the plane flat beneath both.
 */
export const scene: TestScene = {
  camera: { position: [4, 3, 5], fov: 45 },
  render: () => (
    <>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry />
        <meshBasicMaterial color="#d9534f" />
      </mesh>
      <mesh position={[-1.6, 0.5, 0]}>
        <sphereGeometry args={[0.5, 32, 16]} />
        <meshBasicMaterial color="#5bc0de" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 3]} />
        <meshBasicMaterial color="#3a3f4b" />
      </mesh>
    </>
  ),
};
