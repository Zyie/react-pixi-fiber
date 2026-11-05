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
  // The orange is wrong in the reference, and pixi-3d is to blame: FlatMaterial decodes baseColor from
  // sRGB but skips tone mapping, where the view encodes back to sRGB, so 0xf7a84f draws as its linear
  // value, 237, 100, 20. The alias meshBasicMaterial sets toneMapped to work around it.
  parity: false,
};
