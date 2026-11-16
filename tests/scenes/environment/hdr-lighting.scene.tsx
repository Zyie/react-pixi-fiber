import { Environment } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

import { Spheres } from './spheres';

/**
 * Spheres lit only by an `.hdr` environment, with no lights and no background: white dielectric on top
 * and white metal below, from rough on the left to mirror-like on the right. The sky is blue above, the
 * ground brown below and the sun up to the right of the camera. How far the metal row is from three's
 * picture measures pixi-3d's image-based lighting against three's PMREM.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 6], fov: 45 },
  // pixi-3d prefilters an environment into a 10-bit unorm cube (rgb10a2unorm, the default of
  // generateIblSpecialCubemap), which clips radiance above 1. The sun, 24 times brighter than white,
  // leaves no highlight on the smooth spheres, and the roughest metal sphere misses the light of its
  // sunlit side. The same spheres lit by an environment with nothing above 1 (cube-lighting) match.
  parity: { maxDiff: 0.05 },
  render: () => (
    <>
      <Environment files="/environment/equirect.hdr" />
      <Spheres />
    </>
  ),
};
