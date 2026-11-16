import { useTexture } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

/** A plane with the quadrant texture: red top left, green top right, blue bottom left, yellow bottom right */
function Quadrants() {
  const texture = useTexture('/textures/quadrants.png');

  return (
    <mesh>
      <planeGeometry args={[3, 3]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

/**
 * `useTexture` suspends until the texture loads, and the plane is drawn once it has. The quadrants show
 * which way up the texture lands.
 */
export const scene: TestScene = {
  render: () => <Quadrants />,
  // Only the quadrants' edges differ: pixi-3d filters the texture before its sRGB decode, three after.
  parity: { maxDiff: 0.05 },
};
