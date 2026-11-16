import type { TestScene } from '@test-scene';

/**
 * An orthographic default camera, `<Canvas orthographic>`, with a `zoom` of 60: 60 pixels to a unit, so
 * the two cubes, each a unit wide and 2 units apart, are 60 pixels wide with their centres 120 pixels
 * apart, the same size whatever their depth: the left cube is 3 units nearer the camera than the right.
 */
export const scene: TestScene = {
  camera: { zoom: 60, position: [0, 0, 10] },
  canvas: { orthographic: true },
  render: () => (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2} />
      <mesh3D position={[-1, 0, 2]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#e6194b" />
      </mesh3D>
      <mesh3D position={[1, 0, -1]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#4363d8" />
      </mesh3D>
    </>
  ),
};
