import { LinearSRGBColorSpace } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';

import { ToneScene } from './tone-scene';

/**
 * `outputColorSpace: LinearSRGBColorSpace` through the `renderer` prop, three's `linear` before v10: the
 * renderer writes linear values with no sRGB encoding, so every mid tone is drawn darker and the
 * shadows sink toward black
 */
export const scene: TestScene = {
  camera: { position: [0, 1, 6] },
  canvas: { renderer: { outputColorSpace: LinearSRGBColorSpace } },
  render: () => <ToneScene />,
};
