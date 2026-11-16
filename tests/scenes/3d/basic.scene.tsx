import type { TestScene } from '@test-scene';

/**
 * `@pixi/3d`'s elements without threejs-compat, on the root's default camera and scene: a blue cube on a
 * `<mesh3D>` with a `<cubeGeometry3D>` and a lit `<material3D>`, turned to show three faces, under an
 * ambient light and a directional light aimed down and to the left with `angle`.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-40, 30, 0]} intensity={3} />
      <mesh3D rotation={[0.5, 0.7, 0]}>
        <cubeGeometry3D />
        <material3D baseColor="#4f86f7" roughness={0.6} metallic={0} />
      </mesh3D>
    </>
  ),
};
