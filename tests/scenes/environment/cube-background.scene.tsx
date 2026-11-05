import type { TestScene } from '@test-scene';
import { Environment } from 'react-pixi-fiber';

import { CUBE_FACES } from './faces';

/**
 * `<Environment>` from six images, drawn behind the scene, looking up toward +X and +Z with a wide lens.
 * The red +X marker is left of centre and the green +Z one to the right, the sun high between them
 * over the pale horizon, and the white squares in the faces' corners land where three's put them, so
 * the faces are neither mirrored nor upside down.
 */
export const scene: TestScene = {
  camera: { position: [-1, -0.25, -0.8], fov: 100 },
  render: () => <Environment files={CUBE_FACES} path="/environment/cube/" background="only" />,
};
