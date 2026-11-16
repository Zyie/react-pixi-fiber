import type { TestScene } from '@test-scene';

/** A cube in a slot, `x` from the centre */
function Cube({ x, color }: { x: number; color: string }) {
  return (
    <mesh3D position={[x, 0, 0]} angle={[20, 30, 0]}>
      <cubeGeometry3D />
      <phongMaterial3D baseColor={color} />
    </mesh3D>
  );
}

/** Up to three cubes, each shown or not */
function Slots({ left, middle, right }: { left?: string; middle?: string; right?: string }) {
  return (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      {left && <Cube key={`left-${left}`} x={-2} color={left} />}
      {middle && <Cube key={`middle-${middle}`} x={0} color={middle} />}
      {right && <Cube key={`right-${right}`} x={2} color={right} />}
    </>
  );
}

/**
 * Unmount and remount. Three red cubes; the middle one unmounts, a frame passes, and a green cube mounts
 * in its place while the right one unmounts. Left to right at the end: red, green, nothing: the
 * unmounted cubes are gone from the scene.
 */
export const scene: TestScene = {
  render: () => <Slots left="#e6194b" middle="#e6194b" right="#e6194b" />,
  act: async ({ update, frames }) => {
    await update(<Slots left="#e6194b" right="#e6194b" />);
    await frames();
    await update(<Slots left="#e6194b" middle="#3cb44b" />);
  },
};
