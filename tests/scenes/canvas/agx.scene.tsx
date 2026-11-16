import { AgXToneMapping } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';

import { ToneScene } from './tone-scene';

/**
 * The renderer's tone mapping set through the `renderer` prop to `AgXToneMapping`: bright colours desaturate toward white as they run past 1, and the darks lift
 */
export const scene: TestScene = {
  camera: { position: [0, 1, 6] },
  canvas: { renderer: { toneMapping: AgXToneMapping } },
  render: () => <ToneScene />,
};
