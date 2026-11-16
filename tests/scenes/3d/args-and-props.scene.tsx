import type { TestScene } from '@test-scene';

/**
 * `args` against props: each column draws the same cube twice, the top one set through its class's
 * constructor options as `args`, the bottom one through props in r3f's forms. They match column by
 * column. From the left: an orange cube placed by `args` and by pierced `position-x` and `position-y`;
 * a green, rougher cube coloured by `args` and by `baseColor` and `roughness`; a purple cube turned by
 * `angle` in `args` and by a `quaternion` array; a small blue cube scaled by `args` and by a scalar
 * `scale`. The light is set through `args` too, and the camera is orthographic, so the two rows draw
 * alike.
 */
export const scene: TestScene = {
  camera: { zoom: 55, position: [0, 0, 10] },
  canvas: { orthographic: true },
  render: () => (
    <>
      <ambientLight3D args={[{ intensity: 0.3 }]} />
      <directionalLight3D args={[{ intensity: 2.5, angle: { x: -35, y: 30, z: 0 } }]} />

      <mesh3D args={[{ position: { x: -2.4, y: 1.1, z: 0 } }]} angle={[20, 30, 0]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#e07b39" />
      </mesh3D>
      <mesh3D position-x={-2.4} position-y={-1.1} angle={[20, 30, 0]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#e07b39" />
      </mesh3D>

      <mesh3D position={[-0.8, 1.1, 0]} angle={[20, 30, 0]}>
        <cubeGeometry3D />
        <material3D args={[{ baseColor: 0x4caf50, roughness: 0.9, metallic: 0 }]} />
      </mesh3D>
      <mesh3D position={[-0.8, -1.1, 0]} angle={[20, 30, 0]}>
        <cubeGeometry3D />
        <material3D baseColor="#4caf50" roughness={0.9} metallic={0} />
      </mesh3D>

      <mesh3D args={[{ angle: { x: 0, y: 45, z: 30 } }]} position={[0.8, 1.1, 0]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#9b59b6" />
      </mesh3D>
      <mesh3D quaternion={[0.0990458, 0.3696438, 0.2391176, 0.8923991]} position={[0.8, -1.1, 0]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#9b59b6" />
      </mesh3D>

      <mesh3D args={[{ scale: 0.55 }]} position={[2.4, 1.1, 0]} angle={[20, 30, 0]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#3d7fe8" />
      </mesh3D>
      <mesh3D scale={0.55} position={[2.4, -1.1, 0]} angle={[20, 30, 0]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#3d7fe8" />
      </mesh3D>
    </>
  ),
};
