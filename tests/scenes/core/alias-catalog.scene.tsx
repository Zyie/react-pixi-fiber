import type { TestScene } from '@test-scene';

/** three.js element names, positional `args`, a scalar `scale` and material props renamed for pixi-3d */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[1, 2, 3]} />
      <mesh position={[0, 0.25, 0]} rotation={[0.4, 0.6, 0]} scale={1.2}>
        <boxGeometry args={[1, 2, 3]} />
        <meshStandardMaterial color="hotpink" roughness={0.25} metalness={0.5} />
      </mesh>
    </>
  ),
};
