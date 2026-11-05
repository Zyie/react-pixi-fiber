import type { TestScene } from '@test-scene';

/** Props a mesh mounts with: the left box keeps the defaults, the right one is moved, turned and scaled */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} />
      <mesh position={[-1.6, 0, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="#4f86f7" />
      </mesh>
      <mesh position={[1.4, 0.4, 0]} rotation={[0.5, 0.8, 0]} scale={[1.5, 1, 1]}>
        <boxGeometry />
        <meshStandardMaterial color="#f7a84f" />
      </mesh>
    </>
  ),
};
