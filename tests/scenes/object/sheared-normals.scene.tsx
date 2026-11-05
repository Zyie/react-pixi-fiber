import type { TestScene } from '@test-scene';

/**
 * A box turned inside a group scaled unevenly, which shears its world transform: three lights it with
 * the true normal matrix, the inverse transpose of the world transform.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={1.5} />
      <group scale={[1.6, 0.6, 1]} rotation={[0.3, 0.5, 0]}>
        <mesh rotation={[0, 0, 0.6]}>
          <boxGeometry args={[1, 1.4, 1]} />
          <meshStandardMaterial color="#5b8def" />
        </mesh>
      </group>
    </>
  ),
  // pixi-3d turns normals with the world transform, dividing each column by its squared length
  // (MaterialSystemGl's and MaterialSystemGpu's vertex templates). That is the inverse transpose only
  // when the columns stay at right angles: rotation and scale, no shear. A rotated child of an unevenly
  // scaled parent is sheared, so its faces are lit at the wrong angle.
  fails: { webgl: 'differ from three.js', webgpu: 'differ from three.js' },
};
