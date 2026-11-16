import type { TestScene } from '@test-scene';

/**
 * pixi-3d's own classes by their own names, beside three's: a `<mesh>` holding a `<cubeGeometry>` and a
 * lit `<material3D>` on the left, and an unlit `<flatMaterial>` on the right. r3f attaches each to its
 * mesh as it would three's geometry and material.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} />
      <mesh position={[-1.4, 0, 0]} rotation={[0.4, 0.6, 0]}>
        <cubeGeometry />
        <material3D baseColor={0x4f86f7} roughness={1} metallic={0} />
      </mesh>
      <mesh position={[1.4, 0, 0]} rotation={[0.4, 0.6, 0]}>
        <cubeGeometry />
        <flatMaterial baseColor={0xf7a84f} />
      </mesh>
    </>
  ),
  skip: { renderers: ['three'], reason: 'three.js has no pixi-3d classes' },
  // A FlatMaterial skips lighting but not the view's tone curve, so the orange is 0xf7a84f through
  // r3f's default ACES tone mapping, lighter than authored.
  parity: false,
};
