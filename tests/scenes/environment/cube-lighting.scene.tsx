import type { TestScene } from '@test-scene';
import { Environment } from 'react-pixi-fiber';

import { CUBE_FACES } from './faces';
import { Spheres } from './spheres';

/**
 * Spheres lit only by an environment from six images, with no lights: white dielectric on top and white
 * metal below, from rough on the left to mirror-like on the right. The sky holds no radiance above 1,
 * so this measures pixi-3d's image-based lighting against three's PMREM with nothing clipped.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 6], fov: 45 },
  render: () => (
    <>
      <Environment files={CUBE_FACES} path="/environment/cube/" />
      <Spheres />
    </>
  ),
};
