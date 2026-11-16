import { useThree } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

/** Four boxes in the corners of the viewport at the origin's depth, placed from `useThree`'s viewport */
function Corners() {
  const viewport = useThree((state) => state.viewport);
  const x = viewport.width / 2 - 0.3;
  const y = viewport.height / 2 - 0.3;

  return (
    <>
      {[
        [-x, y],
        [x, y],
        [-x, -y],
        [x, -y],
      ].map(([cx, cy]) => (
        <mesh key={`${cx},${cy}`} position={[cx, cy, 0]}>
          <boxGeometry args={[0.6, 0.6, 0.1]} />
          <meshBasicMaterial color="#f0ad4e" />
        </mesh>
      ))}
      <mesh scale={viewport.factor / 200}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#5bc0de" />
      </mesh>
    </>
  );
}

/**
 * `useThree`'s viewport: its `width` and `height` are the size of the view at the origin's depth in
 * world units, so four boxes placed from them sit tight in the canvas's corners. The sphere's radius is
 * the viewport's `factor` (pixels per world unit, about 52 here) over 200 units, so it is about 13
 * pixels across the middle.
 */
export const scene: TestScene = {
  camera: { fov: 40, position: [0, 0, 8] },
  render: () => <Corners />,
};
