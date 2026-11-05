import type { TestScene } from '@test-scene';
import { useTexture } from 'react-pixi-fiber';

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
  parity: { maxDiff: 0.1 },
  // pixi-3d draws the plane white: `map` isn't aliased to pixi-3d's `textures.baseColor` yet.
  fails: { webgl: 'differ from three.js', webgpu: 'differ from three.js' },
};
