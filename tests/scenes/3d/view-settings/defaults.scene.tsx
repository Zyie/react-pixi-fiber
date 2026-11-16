import type { TestScene } from '@test-scene';

import { Stage } from './stage';

/**
 * The stage as a root draws it with no settings, @pixi/3d's defaults: no tone curve, so the white
 * sphere's lit side and the cube's top clip to flat colour; an exposure of 1; no environment, so the
 * metal sphere is dark but for the light's highlight; no fog, so the far columns are as clear as the
 * near ones; and soft `'pcf'` shadow edges
 */
export const scene: TestScene = {
  camera: { position: [0, 1.5, 7] },
  render: () => <Stage />,
};
