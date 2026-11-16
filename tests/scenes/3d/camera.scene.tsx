import type { TestScene } from '@test-scene';

/** A cube on each axis: red on x, green on y, blue on z, and a grey one at the origin */
function Axes() {
  return (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2} />
      {(
        [
          [[0, 0, 0], '#808080'],
          [[1.5, 0, 0], '#e6194b'],
          [[0, 1.5, 0], '#3cb44b'],
          [[0, 0, 1.5], '#4363d8'],
        ] as const
      ).map(([position, color]) => (
        <mesh3D key={color} position={position} scale={0.7}>
          <cubeGeometry3D />
          <phongMaterial3D baseColor={color} />
        </mesh3D>
      ))}
    </>
  );
}

/**
 * The default camera, a @pixi/3d `Camera3D`, set through `<Canvas camera>` with @pixi/3d's fields: a
 * narrow `fov` of 30 at (4, 3, 6), which r3f aims at the origin. The grey cube at the origin is in the
 * middle, the red x cube to its right, the green y cube above it and the blue z cube in front of it,
 * lower left.
 */
export const scene: TestScene = {
  camera: { fov: 30, position: [4, 3, 6] },
  render: () => <Axes />,
};
