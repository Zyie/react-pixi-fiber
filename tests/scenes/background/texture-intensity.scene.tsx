import type { TestScene } from '@test-scene';

import { Backdrop } from './texture.scene';

/**
 * The texture background at a `backgroundIntensity` of 0.4: the same quadrants, darker. three scales
 * the texture in linear light; pixi.js tints the sprite in display space by the intensity to the power
 * 1 / 2.2, which lands close.
 */
export const scene: TestScene = {
  render: () => <Backdrop intensity={0.4} />, // Only the quadrants' edges differ: pixi.js filters the texture in display space, three after its sRGB decode.
  parity: { maxDiff: 0.05 },
};
